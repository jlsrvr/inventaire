import { describe, expect, it } from 'vitest'
import { formatRelativeMoment, formatUpdatedAt } from './formatDate'

describe('formatUpdatedAt', () => {
  it('renders the date without a time component', () => {
    const result = formatUpdatedAt('2026-09-14T14:15:00')
    // Avoid asserting on exact locale punctuation (varies by ICU version) —
    // just check the date parts are present and no time made it in.
    expect(result).toContain('14')
    expect(result).toContain('09')
    expect(result).toContain('2026')
    expect(result).not.toContain('15')
  })
})

describe('formatRelativeMoment', () => {
  // Local-time constructors, so the test doesn't depend on the machine's zone.
  const now = new Date(2026, 10, 5, 18, 0) // Thursday 5 November 2026, 18:00

  it('says today, yesterday, or the weekday within the past week', () => {
    expect(formatRelativeMoment(new Date(2026, 10, 5, 14, 5).toISOString(), now)).toBe(
      'aujourd’hui à 14:05',
    )
    expect(formatRelativeMoment(new Date(2026, 10, 4, 23, 59).toISOString(), now)).toBe(
      'hier à 23:59',
    )
    expect(formatRelativeMoment(new Date(2026, 9, 31, 9, 12).toISOString(), now)).toBe(
      'samedi à 09:12',
    )
  })

  it('gives the date for anything older, with the year only if it differs', () => {
    expect(formatRelativeMoment(new Date(2026, 9, 28, 14, 5).toISOString(), now)).toBe(
      'le 28 octobre à 14:05',
    )
    expect(formatRelativeMoment(new Date(2025, 11, 24, 8, 0).toISOString(), now)).toBe(
      'le 24 décembre 2025 à 08:00',
    )
  })
})
