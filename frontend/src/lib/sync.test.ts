import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, setMeta, saveItem } from '../db'
import { sync } from './sync'
import type { SyncResponse } from '../api/types'

beforeEach(async () => {
  await db.items.clear()
  await db.meta.clear()
  await setMeta('token', 'test-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(response: SyncResponse) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => response,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
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

  it('applies server changes and clears only the snapshotted outbox rows', async () => {
    const id = await saveItem({ name: 'Café', quantity: 3 }, 'John')

    mockFetch({
      cursor: 1,
      changes: [
        {
          id,
          name: 'Café',
          unit: null,
          category: 'other',
          quantity: 3,
          updated_at: '2099-01-01T00:00:00',
          updated_by: 'John',
          seq: 1,
        },
      ],
      rejected: [],
    })
    await sync('http://api.test')

    const row = await db.items.get(id)
    expect(row?.dirty).toBe(0)
    expect(row?.seq).toBe(1)
  })

  it('saves the cursor after applying changes', async () => {
    mockFetch({ cursor: 42, changes: [], rejected: [] })
    await sync('http://api.test')

    const { getMeta } = await import('../db')
    expect(await getMeta<number>('cursor')).toBe(42)
  })

  it('keeps a local edit that is newer than the incoming server row (LWW)', async () => {
    const id = await saveItem({ name: 'Café', quantity: 3 }, 'John')
    // Simulate a newer local edit made after the outbox snapshot was sent.
    await db.items.update(id, {
      name: 'Café moulu',
      updated_at: '2026-06-01T00:00:00',
      dirty: 1,
    })

    mockFetch({
      cursor: 1,
      changes: [
        {
          id,
          name: 'Café (server)',
          unit: null,
          category: 'other',
          quantity: 3,
          updated_at: '2026-01-01T00:00:00', // older than the local edit
          updated_by: 'Jane',
          seq: 1,
        },
      ],
      rejected: [],
    })
    await sync('http://api.test')

    const row = await db.items.get(id)
    expect(row?.name).toBe('Café moulu')
    expect(row?.dirty).toBe(1)
  })

  it('throws when not enrolled', async () => {
    await db.meta.clear()
    await expect(sync('http://api.test')).rejects.toThrow('not enrolled')
  })
})
