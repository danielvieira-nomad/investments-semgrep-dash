import { describe, expect, it } from 'vitest'
import { getOrgStats, groupFindingsByProject } from './aggregations'

describe('aggregations', () => {
  const findings = [
    { id: '1', repositoryName: 'a/one', severity: 'High', status: 'Open' },
    { id: '2', repositoryName: 'a/one', severity: 'Low', status: 'Open' },
    { id: '3', repositoryName: 'b/two', severity: 'Critical', status: 'Fixed' },
  ]

  it('groups projects', () => {
    const projects = groupFindingsByProject(findings)
    expect(projects).toHaveLength(2)
    expect(projects[0].highCriticalCount).toBeGreaterThan(0)
  })

  it('computes org stats', () => {
    const stats = getOrgStats(findings)
    expect(stats.totalFindings).toBe(3)
    expect(stats.projectCount).toBe(2)
  })
})
