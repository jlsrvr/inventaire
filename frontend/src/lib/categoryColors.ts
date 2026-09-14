import type { CategorySlug } from './categories'

// Tailwind classes for each category's chip. Falls back to the "other" look
// for any value that isn't in the known slug list.
export const categoryChipClasses: Record<CategorySlug, string> = {
  alimentation: 'bg-amber-100 text-amber-800',
  boissons: 'bg-blue-100 text-blue-800',
  entretien: 'bg-green-100 text-green-800',
  hygiene: 'bg-fuchsia-100 text-fuchsia-800',
  outils: 'bg-indigo-100 text-indigo-800',
  other: 'bg-slate-100 text-slate-600',
}

export function chipClassesFor(category: string): string {
  return categoryChipClasses[category as CategorySlug] ?? categoryChipClasses.other
}
