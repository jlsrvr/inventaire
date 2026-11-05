import { strings } from '../strings'
import type { LocalItem } from '../db'
import { formatQuantity } from './formatQuantity'

/** « Nouvel article », « 2 → 0 paquets » or « Modifié », for one unsent row. */
export function describeChange(item: LocalItem): string {
  if (item.seq === 0) return strings.changeNew
  const before = item.synced_quantity
  if (before === undefined || before === item.quantity) return strings.changeEdited
  return strings.changeQuantity(formatQuantity(before), formatQuantity(item.quantity), item.unit)
}
