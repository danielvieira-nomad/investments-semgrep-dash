import { countBySeverity, normalizeSeverity, severityRank } from '@shared/severity.mjs'

export function getOrgStats(findings) {
  const projects = new Set(findings.map((f) => f.repositoryName))
  return {
    totalFindings: findings.length,
    projectCount: projects.size,
    severityCounts: countBySeverity(findings),
  }
}

export function groupFindingsByProject(findings) {
  const map = new Map()
  for (const finding of findings) {
    const name = finding.repositoryName
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(finding)
  }
  return [...map.entries()]
    .map(([name, projectFindings]) => ({
      repositoryName: name,
      findings: projectFindings,
      severityCounts: countBySeverity(projectFindings),
      repositoryUrl: projectFindings[0]?.repositoryUrl ?? '',
      highCriticalCount: projectFindings.filter((f) => {
        const s = normalizeSeverity(f.severity)
        return s === 'High' || s === 'Critical'
      }).length,
    }))
    .sort((a, b) => {
      if (b.highCriticalCount !== a.highCriticalCount) {
        return b.highCriticalCount - a.highCriticalCount
      }
      return b.findings.length - a.findings.length
    })
}

export function countByStatus(findings) {
  const counts = {}
  for (const f of findings) {
    const key = f.status || 'Unknown'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export function groupFindingsBySeverity(findings) {
  const groups = new Map()
  for (const finding of findings) {
    const key = normalizeSeverity(finding.severity)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(finding)
  }
  return [...groups.entries()].sort(
    (a, b) => severityRank(a[0]) - severityRank(b[0]),
  )
}

export function topProjectsByHighCritical(projects, limit = 10) {
  return projects.slice(0, limit)
}
