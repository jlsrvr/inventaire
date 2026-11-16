import { roundQuantity } from '../db'

const formatter = new Intl.NumberFormat('fr', { maximumFractionDigits: 3 })

/** Display a quantity French-style: 1,5 rather than 1.5, never float noise. */
export function formatQuantity(quantity: number): string {
  return formatter.format(quantity)
}

/** 1.5 → « 1,5 » for an input: decimal comma, no thousands separator, so it parses back. */
export function toEditableQuantity(quantity: number): string {
  return String(quantity).replace('.', ',')
}

/** « 1,5 » or « 1.5 » → 1.5; null when it isn't a quantity (empty, negative, letters). */
export function parseQuantity(text: string): number | null {
  const normalised = text.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(normalised)) return null
  return roundQuantity(Number(normalised))
}
