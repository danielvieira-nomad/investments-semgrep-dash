import { describe, expect, it } from 'vitest'
import { countBySeverity, normalizeSeverity, sortBySeverity } from './severity.mjs'

describe('severity', () => {
  it('normalizes case', () => {
    expect(normalizeSeverity('high')).toBe('High')
  })

  it('counts by severity', () => {
    const counts = countBySeverity([
      { severity: 'High' },
      { severity: 'Low' },
      { severity: 'high' },
    ])
    expect(counts).toEqual({ High: 2, Low: 1 })
  })

  it('sorts critical first', () => {
    const sorted = sortBySeverity([
      { severity: 'Low' },
      { severity: 'Critical' },
      { severity: 'High' },
    ])
    expect(sorted.map((f) => f.severity)).toEqual(['Critical', 'High', 'Low'])
  })
})
