import { describe, expect, it } from 'vitest'
import { formatQuantity, parseQuantity, toEditableQuantity } from './formatQuantity'

describe('formatQuantity', () => {
  it('uses a French decimal comma and drops float noise', () => {
    expect(formatQuantity(1.5)).toBe('1,5')
    expect(formatQuantity(0.10000000000000009)).toBe('0,1')
    expect(formatQuantity(3)).toBe('3')
  })
})

describe('parseQuantity', () => {
  it('reads French and English decimals, rejects anything else', () => {
    expect(parseQuantity('1,5')).toBe(1.5)
    expect(parseQuantity(' 2.25 ')).toBe(2.25)
    expect(parseQuantity('0')).toBe(0)
    expect(parseQuantity('')).toBeNull()
    expect(parseQuantity('-1')).toBeNull()
    expect(parseQuantity('abc')).toBeNull()
  })
})

describe('toEditableQuantity', () => {
  it('round-trips through parseQuantity', () => {
    expect(toEditableQuantity(1.5)).toBe('1,5')
    expect(parseQuantity(toEditableQuantity(1234.5))).toBe(1234.5)
  })
})
