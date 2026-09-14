// Category slugs are ASCII and code-defined; French labels live in strings.ts.
export const CATEGORIES = [
  'alimentation',
  'boissons',
  'entretien',
  'hygiene',
  'outils',
  'other',
] as const

export type CategorySlug = (typeof CATEGORIES)[number]

export const DEFAULT_CATEGORY: CategorySlug = 'other'
