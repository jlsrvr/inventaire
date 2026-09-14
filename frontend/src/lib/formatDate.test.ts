import { describe, expect, it } from 'vitest'
import { formatUpdatedAt } from './formatDate'

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
