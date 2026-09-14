import Dexie, { type Table } from 'dexie'
import { normalise } from './lib/normalise'
import { DEFAULT_CATEGORY } from './lib/categories'

/**
 * A row as stored locally. It is the server's Item plus two client-only fields:
 * - search_name: normalised copy of name, for accent/case-insensitive search
 * - dirty: 1 while the row is a pending local write (the "outbox")
 * seq is 0 until the server assigns one.
 */
export interface LocalItem {
  id: string
  name: string
  search_name: string
  category: string
  quantity: number
  unit: string | null
  updated_at: string
  updated_by: string
  seq: number
  dirty: 0 | 1
}

export interface MetaRow {
  key: string
  value: unknown
}

export class InventaireDB extends Dexie {
  items!: Table<LocalItem, string>
  meta!: Table<MetaRow, string>

  constructor(name = 'inventaire') {
    super(name)
    // Indexes: id is the primary key; search_name/seq/category/dirty are queried.
    this.version(1).stores({
      items: 'id, search_name, seq, category, dirty',
      meta: 'key',
    })
  }
}

export const db = new InventaireDB()

// --- meta key/value ---------------------------------------------------------

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key)
  return row?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}

// --- item mutations ---------------------------------------------------------

export interface ItemInput {
  id?: string
  name: string
  category?: string
  quantity: number
  unit?: string | null
}

/**
 * Create or edit an item locally. Stamps the client clock and marks it dirty so
 * the next sync pushes it. `id` is client-generated on first write (idempotent).
 */
export async function saveItem(input: ItemInput, updatedBy: string): Promise<string> {
  const id = input.id ?? crypto.randomUUID()
  const existing = input.id ? await db.items.get(input.id) : undefined
  const item: LocalItem = {
    id,
    name: input.name.trim(),
    search_name: normalise(input.name),
    category: input.category ?? DEFAULT_CATEGORY,
    quantity: input.quantity,
    unit: input.unit?.trim() ? input.unit.trim() : null,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
    seq: existing?.seq ?? 0,
    dirty: 1,
  }
  await db.items.put(item)
  return id
}

/** Adjust quantity by a delta, never below zero (no delete — zero is valid). */
export async function adjustQuantity(
  id: string,
  delta: number,
  updatedBy: string,
): Promise<void> {
  const existing = await db.items.get(id)
  if (!existing) return
  const quantity = Math.max(0, existing.quantity + delta)
  if (quantity === existing.quantity) return
  await db.items.put({
    ...existing,
    quantity,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
    dirty: 1,
  })
}
