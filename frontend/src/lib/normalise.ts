/**
 * Accent- and case-insensitive form used for search only — never displayed.
 * "Café" -> "cafe". Store this alongside the real name (see LocalItem).
 */
export function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
