import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, getMeta, setMeta, saveItem, type LocalItem } from '../db'
import { sync, Unauthorized, SYNC_BATCH_SIZE } from './sync'
import type { ServerItem, SyncResponse } from '../api/types'

beforeEach(async () => {
  await db.items.clear()
  await db.meta.clear()
  await setMeta('token', 'test-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function ok(response: SyncResponse) {
  return { ok: true, status: 200, json: async () => response }
}

function mockFetch(response: SyncResponse | ((body: { since: number; changes: unknown[] }) => SyncResponse | Promise<SyncResponse>)) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const sent = JSON.parse(init.body as string)
    return ok(typeof response === 'function' ? await response(sent) : response)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function serverRow(overrides: Partial<ServerItem> & { id: string }): ServerItem {
  return {
    name: 'Café',
    unit: null,
    category: 'other',
    quantity: 3,
    updated_at: '2026-11-03T10:00:00.000Z',
    updated_by: 'John',
    seq: 1,
    ...overrides,
  }
}

/** The server's echo of exactly what we sent, as the real backend formats it. */
function echo(row: LocalItem, seq: number): ServerItem {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    category: row.category as ServerItem['category'],
    quantity: row.quantity,
    updated_by: row.updated_by,
    // Spelled differently from what we stored, to prove we never compare strings.
    updated_at: new Date(row.updated_at).toISOString().replace('Z', '+00:00'),
    seq,
  }
}

describe('sync', () => {
  it('sends the dirty outbox and the last cursor', async () => {
    await setMeta('cursor', 7)
    await saveItem({ name: 'Café', quantity: 3 }, 'John')

    const fetchMock = mockFetch({ cursor: 8, changes: [], rejected: [] })
    await sync('http://api.test')

    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body.since).toBe(7)
    expect(body.changes).toHaveLength(1)
    expect(body.changes[0].name).toBe('Café')
  })

  it("accepts the server's echo of our own write whatever its timestamp spelling", async () => {
    const id = await saveItem({ name: 'Café', quantity: 3 }, 'John')
    const local = (await db.items.get(id))!

    mockFetch({ cursor: 1, changes: [echo(local, 1)], rejected: [] })
    await sync('http://api.test')

    const row = await db.items.get(id)
    expect(row?.dirty).toBe(0)
    expect(row?.seq).toBe(1)
  })

  it('a second sync after the echo sends nothing', async () => {
    const id = await saveItem({ name: 'Café', quantity: 3 }, 'John')
    const local = (await db.items.get(id))!
    mockFetch({ cursor: 1, changes: [echo(local, 1)], rejected: [] })
    await sync('http://api.test')

    const fetchMock = mockFetch({ cursor: 1, changes: [], rejected: [] })
    await sync('http://api.test')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.changes).toEqual([])
  })

  it('replaces a rejected local edit with the winning server version', async () => {
    const id = await saveItem({ name: 'Thé', quantity: 1 }, 'Jane')

    mockFetch({
      cursor: 5,
      changes: [serverRow({ id, name: 'Café', seq: 5 })],
      rejected: [id],
    })
    await sync('http://api.test')

    const row = await db.items.get(id)
    expect(row?.name).toBe('Café')
    expect(row?.search_name).toBe('cafe')
    expect(row?.dirty).toBe(0)
  })

  it('clears a sent row even if the server answers without echoing it', async () => {
    const id = await saveItem({ name: 'Thé', quantity: 1 }, 'Jane')
    mockFetch({ cursor: 5, changes: [], rejected: [id] })
    await sync('http://api.test')
    expect((await db.items.get(id))?.dirty).toBe(0)
  })

  it('keeps a local edit made while the request was in flight', async () => {
    const id = await saveItem({ name: 'Café', quantity: 3 }, 'John')
    const sentVersion = (await db.items.get(id))!

    mockFetch(async () => {
      // The user edits again while we wait for the server.
      await db.items.update(id, {
        name: 'Café moulu',
        updated_at: new Date(Date.parse(sentVersion.updated_at) + 1000).toISOString(),
      })
      return { cursor: 1, changes: [echo(sentVersion, 1)], rejected: [] }
    })
    // Second round (the rerun) should then push the newer edit.
    await sync('http://api.test')

    const row = await db.items.get(id)
    expect(row?.name).toBe('Café moulu')
    expect(row?.dirty).toBe(1)
  })

  it('saves the cursor after applying changes', async () => {
    mockFetch({ cursor: 42, changes: [], rejected: [] })
    await sync('http://api.test')
    expect(await getMeta<number>('cursor')).toBe(42)
  })

  it('throws Unauthorized on 401 so the UI can ask for the passphrase', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(sync('http://api.test')).rejects.toBeInstanceOf(Unauthorized)
  })

  it('throws when not enrolled', async () => {
    await db.meta.clear()
    await expect(sync('http://api.test')).rejects.toThrow('not enrolled')
  })

  it('never runs two syncs at once', async () => {
    let concurrent = 0
    let maxConcurrent = 0
    mockFetch(async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise((r) => setTimeout(r, 5))
      concurrent--
      return { cursor: 0, changes: [], rejected: [] }
    })

    await Promise.all([sync('http://api.test'), sync('http://api.test'), sync('http://api.test')])
    expect(maxConcurrent).toBe(1)
  })

  it('sends a large outbox in batches', async () => {
    const rows: LocalItem[] = Array.from({ length: SYNC_BATCH_SIZE + 1 }, (_, i) => ({
      id: `id-${i}`,
      name: `Item ${i}`,
      search_name: `item ${i}`,
      category: 'other',
      quantity: 1,
      unit: null,
      updated_at: '2026-11-03T10:00:00.000Z',
      updated_by: 'John',
      seq: 0,
      dirty: 1,
    }))
    await db.items.bulkPut(rows)

    const fetchMock = mockFetch({ cursor: 0, changes: [], rejected: [] })
    await sync('http://api.test')

    const sizes = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body as string).changes.length)
    expect(sizes).toEqual([SYNC_BATCH_SIZE, 1])
  })
})
