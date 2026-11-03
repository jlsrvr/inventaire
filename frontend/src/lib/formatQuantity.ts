const formatter = new Intl.NumberFormat('fr', { maximumFractionDigits: 3 })

/** Display a quantity French-style: 1,5 rather than 1.5, never float noise. */
export function formatQuantity(quantity: number): string {
  return formatter.format(quantity)
}
