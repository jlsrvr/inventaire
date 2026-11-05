import { db, getMeta, setMeta, type LocalItem } from '../db'
import { normalise } from './normalise'
import type { ItemChange, SyncResponse } from '../api/types'
import { API_URL } from './api'

/** The server refused our token — the user must re-enter the passphrase. */
export class Unauthorized extends Error {}

/** Meta key: ISO time of the last sync that completed without error. */
export const LAST_SYNCED_AT = 'lastSyncedAt'

/** Matches the server's MAX_CHANGES_PER_SYNC. Bigger outboxes go in rounds. */
export const SYNC_BATCH_SIZE = 500

function toItemChange(row: LocalItem): ItemChange {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    category: row.category as ItemChange['category'],
    quantity: row.quantity,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  }
}

/**
 * One sync round-trip:
 *  1. snapshot (a batch of) the outbox and the cursor
 *  2. POST them to /sync
 *  3. in a single IndexedDB transaction, apply the returned changes and clear
 *     the outbox rows we sent, saving the cursor last.
 *
 * The server is the judge of last-write-wins; the client never compares
 * timestamps. It only asks "is my local row still the exact version I sent?"
 * If yes, the server's answer replaces it — that answer is either our own
 * write echoed back with its seq, or the winner that beat it. If the row
 * changed while the request was in flight (or was never sent), the newer local
 * edit is kept and goes out on the next round.
 *
 * Returns how many rows were sent.
 */
async function syncOnce(baseUrl: string): Promise<number> {
  const token = await getMeta<string>('token')
  if (!token) throw new Error('not enrolled')

  const since = (await getMeta<number>('cursor')) ?? 0
  const outbox = await db.items.where('dirty').equals(1).limit(SYNC_BATCH_SIZE).toArray()
  const sent = new Map(outbox.map((row) => [row.id, row.updated_at]))

  const res = await fetch(`${baseUrl}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ since, changes: outbox.map(toItemChange) }),
  })
  if (res.status === 401) throw new Unauthorized()
  if (!res.ok) throw new Error(`sync failed: ${res.status}`)
  const body: SyncResponse = await res.json()

  await db.transaction('rw', db.items, db.meta, async () => {
    const isUnsentLocalEdit = (local: LocalItem | undefined) =>
      local?.dirty === 1 && local.updated_at !== sent.get(local.id)

    for (const item of body.changes) {
      const local = await db.items.get(item.id)
      if (isUnsentLocalEdit(local)) continue
      await db.items.put({
        ...item,
        unit: item.unit ?? null,
        search_name: normalise(item.name),
        dirty: 0,
      })
    }

    // Every sent row has now been answered for (accepted or rejected). Clear
    // any that is still the snapshotted version — and only those.
    for (const [id, updatedAt] of sent) {
      const local = await db.items.get(id)
      if (local?.dirty === 1 && local.updated_at === updatedAt) {
        await db.items.update(id, { dirty: 0 })
      }
    }

    await setMeta('cursor', body.cursor)
  })

  return outbox.length
}

async function syncAll(baseUrl: string): Promise<void> {
  // A full batch means there may be more outbox left; keep going.
  while ((await syncOnce(baseUrl)) === SYNC_BATCH_SIZE) {
    // next round
  }
}

let inFlight: Promise<void> | null = null
let rerun = false

/**
 * Sync with the server. Only one sync runs at a time: calling this while one
 * is in flight returns the same promise and schedules one more round after it,
 * so an edit made mid-sync is pushed without waiting for the next trigger.
 */
export function sync(baseUrl: string = API_URL): Promise<void> {
  if (inFlight) {
    rerun = true
    return inFlight
  }
  inFlight = (async () => {
    try {
      do {
        rerun = false
        await syncAll(baseUrl)
      } while (rerun)
      // Only once everything went through: shown as « Mis à jour … ».
      await setMeta(LAST_SYNCED_AT, new Date().toISOString())
    } finally {
      inFlight = null
      rerun = false
    }
  })()
  return inFlight
}
