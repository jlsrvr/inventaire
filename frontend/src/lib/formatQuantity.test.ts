import { describe, expect, it } from 'vitest'
import { formatQuantity } from './formatQuantity'

describe('formatQuantity', () => {
  it('uses a French decimal comma and drops float noise', () => {
    expect(formatQuantity(1.5)).toBe('1,5')
    expect(formatQuantity(0.10000000000000009)).toBe('0,1')
    expect(formatQuantity(3)).toBe('3')
  })
})
