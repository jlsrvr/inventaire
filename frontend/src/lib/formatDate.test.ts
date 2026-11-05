import { describe, expect, it } from 'vitest'
import { formatRelativeMoment, formatShortMoment } from './formatDate'

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

describe('formatShortMoment', () => {
  const now = new Date(2026, 10, 5, 18, 0)
  it('gives only the time for today, the relative form otherwise', () => {
    expect(formatShortMoment(new Date(2026, 10, 5, 14, 5).toISOString(), now)).toBe('14:05')
    expect(formatShortMoment(new Date(2026, 10, 4, 9, 0).toISOString(), now)).toBe('hier à 09:00')
  })
})
