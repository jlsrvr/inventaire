import { beforeEach, describe, expect, it } from 'vitest'
import { db, saveItem, adjustQuantity, roundQuantity, type LocalItem } from './db'

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

describe('saveItem from an edit form', () => {
  it('only writes fields the user changed, keeping values synced in meanwhile', async () => {
    const id = await saveItem({ name: 'Café', quantity: 3, category: 'alimentation' }, 'John')
    const base = (await db.items.get(id))!

    // While the form is open, a sync brings in Jane's quantity change.
    await db.items.update(id, { quantity: 7, dirty: 0 })

    // The user only renamed the item.
    await saveItem(
      { id, name: 'Café moulu', quantity: base.quantity, category: base.category, unit: base.unit },
      'John',
      base,
    )
    const row = await db.items.get(id)
    expect(row?.name).toBe('Café moulu')
    expect(row?.quantity).toBe(7)
  })

  it('saving an unchanged form does not bump updated_at', async () => {
    const id = await saveItem({ name: 'Café', quantity: 3 }, 'John')
    await db.items.update(id, { dirty: 0, updated_at: '2026-01-01T00:00:00.000Z' })
    const base = (await db.items.get(id))!

    await saveItem({ id, name: 'Café', quantity: 3, category: base.category, unit: null }, 'Jane', base)
    const row = await db.items.get(id)
    expect(row?.updated_at).toBe('2026-01-01T00:00:00.000Z')
    expect(row?.dirty).toBe(0)
  })
})

describe('adjustQuantity', () => {
  it('does not accumulate float noise on decimal quantities', async () => {
    const id = await saveItem({ name: 'Farine', quantity: 1.1, unit: 'kg' }, 'John')
    await adjustQuantity(id, -1, 'John')
    expect((await db.items.get(id))?.quantity).toBe(0.1)
  })

  it('roundQuantity keeps three decimals and never goes negative', () => {
    expect(roundQuantity(0.1 + 0.2)).toBe(0.3)
    expect(roundQuantity(-2)).toBe(0)
  })

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

describe('synced_quantity (the « before » of an unsent change)', () => {
  /** A row as it is after a sync: clean, with a server seq. */
  async function syncedRow(quantity: number): Promise<string> {
    const id = await saveItem({ name: 'Café', quantity }, 'Jules')
    await db.items.update(id, { dirty: 0, seq: 1, synced_quantity: undefined })
    return id
  }

  it('is unset on a brand-new article', async () => {
    const id = await saveItem({ name: 'Café', quantity: 2 }, 'Jules')
    expect((await db.items.get(id))!.synced_quantity).toBeUndefined()
  })

  it('remembers the synced quantity across several unsent edits', async () => {
    const id = await syncedRow(2)
    await adjustQuantity(id, -1, 'Jules')
    await adjustQuantity(id, -1, 'Jules')
    const row = (await db.items.get(id))!
    expect(row.quantity).toBe(0)
    expect(row.synced_quantity).toBe(2)

    await saveItem({ id, name: 'Café moulu', quantity: 5 }, 'Jules', row)
    expect((await db.items.get(id))!.synced_quantity).toBe(2)
  })
})
