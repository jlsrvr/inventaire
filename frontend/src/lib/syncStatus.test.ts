import { describe, expect, it } from 'vitest'
import { syncStatusOf } from './syncStatus'

const base = { online: true, syncing: false, error: null, pendingCount: 0 } as const

describe('syncStatusOf', () => {
  it('puts being offline first, then a running sync, then errors', () => {
    expect(syncStatusOf({ ...base, online: false, syncing: true, error: 'failed' })).toBe('offline')
    expect(syncStatusOf({ ...base, syncing: true, error: 'failed' })).toBe('syncing')
    expect(syncStatusOf({ ...base, error: 'unauthorized', pendingCount: 2 })).toBe('unauthorized')
    expect(syncStatusOf({ ...base, error: 'failed' })).toBe('failed')
  })

  it('is pending with unsent changes, done without', () => {
    expect(syncStatusOf({ ...base, pendingCount: 1 })).toBe('pending')
    expect(syncStatusOf(base)).toBe('done')
  })
})
