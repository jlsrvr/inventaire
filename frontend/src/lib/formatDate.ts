const formatter = new Intl.DateTimeFormat('fr', {
  dateStyle: 'short',
})

/** Formats an ISO updated_at timestamp for display, e.g. "14/09/2026". */
export function formatUpdatedAt(isoString: string): string {
  return formatter.format(new Date(isoString))
}
