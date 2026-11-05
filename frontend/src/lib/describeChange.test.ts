import { describe, expect, it } from 'vitest'
import { describeChange } from './describeChange'
import type { LocalItem } from '../db'

const row: LocalItem = {
  id: 'c',
  name: 'Café',
  search_name: 'cafe',
  category: 'alimentation',
  quantity: 0,
  unit: 'paquets',
  updated_at: '2026-11-05T13:05:00.000Z',
  updated_by: 'Jules',
  seq: 4,
  dirty: 1,
  synced_quantity: 2,
}

describe('describeChange', () => {
  it('shows a quantity change as before → after with the unit', () => {
    expect(describeChange(row)).toBe('2 → 0 paquets')
    expect(describeChange({ ...row, unit: null, quantity: 1.5 })).toBe('2 → 1,5')
  })

  it('calls a never-synced row a new article', () => {
    expect(describeChange({ ...row, seq: 0, synced_quantity: undefined })).toBe('Nouvel article')
  })

  it('falls back to « Modifié » when the quantity did not change', () => {
    expect(describeChange({ ...row, quantity: 2 })).toBe('Modifié')
    expect(describeChange({ ...row, synced_quantity: undefined })).toBe('Modifié')
  })
})
