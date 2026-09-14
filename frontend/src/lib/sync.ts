import { db, getMeta, setMeta, type LocalItem } from '../db'
import { normalise } from './normalise'
import type { ItemChange, SyncResponse } from '../api/types'
import { API_URL } from './api'

function toItemChange(row: LocalItem): ItemChange {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    category: row.category,
    quantity: row.quantity,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  }
}

/**
 * One sync round-trip:
 *  1. snapshot the outbox (dirty rows) and the cursor
 *  2. POST them to /sync
 *  3. in a single IndexedDB transaction, apply the returned changes and clear
 *     the outbox rows we sent, saving the cursor last.
 *
 * Per-item last-write-wins: a server change is applied unless a still-dirty
 * local edit carries a strictly newer updated_at (an edit made after we sent).
 */
export async function sync(baseUrl: string = API_URL): Promise<SyncResponse> {
  const token = await getMeta<string>('token')
  if (!token) throw new Error('not enrolled')

  const since = (await getMeta<number>('cursor')) ?? 0
  const outbox = await db.items.where('dirty').equals(1).toArray()
  const changes = outbox.map(toItemChange)

  const res = await fetch(`${baseUrl}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ since, changes }),
  })
  if (!res.ok) throw new Error(`sync failed: ${res.status}`)
  const body: SyncResponse = await res.json()

  await db.transaction('rw', db.items, db.meta, async () => {
    for (const item of body.changes) {
      const local = await db.items.get(item.id)
      // Keep a local edit made after we sent this row (strictly newer).
      if (local?.dirty === 1 && local.updated_at > item.updated_at) continue
      await db.items.put({
        ...item,
        unit: item.unit ?? null,
        search_name: normalise(item.name),
        dirty: 0,
      })
    }
    await setMeta('cursor', body.cursor)
  })

  return body
}
