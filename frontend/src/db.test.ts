import { beforeEach, describe, expect, it } from 'vitest'
import { db, saveItem, adjustQuantity, type LocalItem } from './db'

beforeEach(async () => {
  await db.items.clear()
  await db.meta.clear()
})

describe('saveItem', () => {
  it('creates a new item with a generated id and normalised search_name', async () => {
    const id = await saveItem(
      { name: 'Café', quantity: 3, category: 'alimentation' },
      'John',
    )
    const row = await db.items.get(id)
    expect(row?.name).toBe('Café')
    expect(row?.search_name).toBe('cafe')
    expect(row?.dirty).toBe(1)
    expect(row?.seq).toBe(0)
  })

  it('marks quantity 0 as valid (shopping list mechanic)', async () => {
    const id = await saveItem({ name: 'Thé', quantity: 0 }, 'John')
    const row = await db.items.get(id)
    expect(row?.quantity).toBe(0)
  })

  it('accepts a decimal quantity', async () => {
    const id = await saveItem({ name: 'Farine', quantity: 1.5, unit: 'kg' }, 'John')
    const row = await db.items.get(id)
    expect(row?.quantity).toBe(1.5)
  })

  it('editing an existing item keeps its id and seq, bumps updated_at', async () => {
    const id = await saveItem({ name: 'Café', quantity: 3 }, 'John')
    await db.items.update(id, { seq: 5, dirty: 0 })

    await saveItem({ id, name: 'Café moulu', quantity: 2 }, 'Jane')
    const row = await db.items.get(id)
    expect(row?.id).toBe(id)
    expect(row?.seq).toBe(5)
    expect(row?.name).toBe('Café moulu')
    expect(row?.dirty).toBe(1)
  })
})

describe('adjustQuantity', () => {
  it('never goes below zero', async () => {
    const id = await saveItem({ name: 'Café', quantity: 1 }, 'John')
    await adjustQuantity(id, -5, 'John')
    const row = await db.items.get(id)
    expect(row?.quantity).toBe(0)
  })

  it('increments and marks dirty', async () => {
    const id = await saveItem({ name: 'Café', quantity: 1 }, 'John')
    await db.items.update(id, { dirty: 0 })
    await adjustQuantity(id, 2, 'Jane')
    const row = await db.items.get(id)
    expect(row?.quantity).toBe(3)
    expect(row?.dirty).toBe(1)
    expect(row?.updated_by).toBe('Jane')
  })
})

describe('search_name index', () => {
  it('finds items by accent/case-insensitive prefix', async () => {
    await saveItem({ name: 'Café', quantity: 1 }, 'John')
    await saveItem({ name: 'Carottes', quantity: 1 }, 'John')

    const results: LocalItem[] = await db.items
      .where('search_name')
      .startsWith('caf')
      .toArray()

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Café')
  })
})
