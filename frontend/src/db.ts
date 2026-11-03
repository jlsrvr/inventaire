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

/**
 * Quantities may be decimal (1.5 kg) but are kept to 3 places, so ±1 steps
 * never accumulate float noise like 0.10000000000000009.
 */
export function roundQuantity(quantity: number): number {
  return Math.max(0, Math.round(quantity * 1000) / 1000)
}

export interface ItemInput {
  id?: string
  name: string
  category?: string
  quantity: number
  unit?: string | null
}

type EditableFields = Pick<LocalItem, 'name' | 'category' | 'quantity' | 'unit'>
const EDITABLE: (keyof EditableFields)[] = ['name', 'category', 'quantity', 'unit']

function cleanInput(input: ItemInput): EditableFields {
  return {
    name: input.name.trim(),
    category: input.category ?? DEFAULT_CATEGORY,
    quantity: roundQuantity(input.quantity),
    unit: input.unit?.trim() ? input.unit.trim() : null,
  }
}

/**
 * Create or edit an item locally. Stamps the client clock and marks it dirty so
 * the next sync pushes it. `id` is client-generated on first write (idempotent).
 *
 * `base` is the item as it was when the user started editing. Only fields the
 * user actually changed relative to it are written; the rest keep the current
 * stored value, which may have arrived from a sync while the form was open.
 */
export async function saveItem(
  input: ItemInput,
  updatedBy: string,
  base?: EditableFields,
): Promise<string> {
  const id = input.id ?? crypto.randomUUID()
  const wanted = cleanInput(input)

  await db.transaction('rw', db.items, async () => {
    const existing = input.id ? await db.items.get(input.id) : undefined
    const next: EditableFields = { ...wanted }
    if (existing && base) {
      for (const field of EDITABLE) {
        if (wanted[field] === base[field]) {
          ;(next as Record<string, unknown>)[field] = existing[field]
        }
      }
    }
    // Saving an unchanged form must not bump updated_at — that would make a
    // no-op win last-write-wins over someone else's real edit.
    if (existing && EDITABLE.every((field) => next[field] === existing[field])) return

    await db.items.put({
      id,
      ...next,
      search_name: normalise(next.name),
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
      seq: existing?.seq ?? 0,
      dirty: 1,
    })
  })
  return id
}

/** Adjust quantity by a delta, never below zero (no delete — zero is valid). */
export async function adjustQuantity(
  id: string,
  delta: number,
  updatedBy: string,
): Promise<void> {
  // Read and write in one transaction so a sync can't land in between and
  // have its fields overwritten by our stale copy.
  await db.transaction('rw', db.items, async () => {
    const existing = await db.items.get(id)
    if (!existing) return
    const quantity = roundQuantity(existing.quantity + delta)
    if (quantity === existing.quantity) return
    await db.items.put({
      ...existing,
      quantity,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
      dirty: 1,
    })
  })
}
