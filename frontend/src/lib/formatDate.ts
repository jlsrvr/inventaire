const time = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('fr', { weekday: 'long' })
const dayMonth = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'long' })
const dayMonthYear = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'long', year: 'numeric' })

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * A past moment, relative to now, in the design's wording:
 * « aujourd’hui à 14:05 », « hier à 14:05 », « samedi à 09:12 » (this past
 * week), else « le 28 octobre à 14:05 » (with the year if it isn't this one).
 */
export function formatRelativeMoment(isoString: string, now: Date = new Date()): string {
  const date = new Date(isoString)
  // Round, not floor: a day across a DST change is 23 or 25 hours long.
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  const at = `à ${time.format(date)}`
  if (daysAgo <= 0) return `aujourd’hui ${at}`
  if (daysAgo === 1) return `hier ${at}`
  if (daysAgo < 7) return `${weekday.format(date)} ${at}`
  const day = date.getFullYear() === now.getFullYear() ? dayMonth : dayMonthYear
  return `le ${day.format(date)} ${at}`
}

/** Shorter form for lists: just « 14:05 » today, otherwise as formatRelativeMoment. */
export function formatShortMoment(isoString: string, now: Date = new Date()): string {
  const date = new Date(isoString)
  return startOfDay(date) === startOfDay(now) ? time.format(date) : formatRelativeMoment(isoString, now)
}
