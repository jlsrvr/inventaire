import { describe, expect, it } from 'vitest'
import { normalise } from './normalise'

describe('normalise', () => {
  it('strips accents', () => {
    expect(normalise('Café')).toBe('cafe')
  })

  it('lowercases', () => {
    expect(normalise('CAFÉ')).toBe('cafe')
  })

  it('handles multiple diacritics', () => {
    expect(normalise('Crème brûlée')).toBe('creme brulee')
  })

  it('leaves plain ascii untouched (besides case)', () => {
    expect(normalise('Sponges')).toBe('sponges')
  })
})
