import { describe, expect, it } from 'vitest'
import { mapCsvRow } from './csvMap.mjs'

describe('csvMap', () => {
  it('maps Semgrep CSV headers to finding fields', () => {
    const finding = mapCsvRow({
      Id: '42',
      'Repository Name': 'org/repo',
      Severity: 'High',
      Status: 'Open',
      'Rule Name': 'rule.x',
      Confidence: 'High',
      Category: 'security',
      'Repository Url': 'https://example.com/repo',
      'Line Of Code Url': 'https://example.com/loc',
      'Semgrep Platform Link': 'https://semgrep.dev/f/1',
      Branch: 'refs/heads/main',
      'Created At': '2026-01-01',
      'Last Opened At': '2026-01-02',
      'Rule Description': 'desc',
      'Triage Comment': '',
      'Triage Reason': '',
    })
    expect(finding.id).toBe('42')
    expect(finding.repositoryName).toBe('org/repo')
    expect(finding.severity).toBe('High')
  })
})
