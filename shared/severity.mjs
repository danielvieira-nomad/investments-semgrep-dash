export const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info']

export function normalizeSeverity(severity) {
  if (!severity) return 'Unknown'
  const trimmed = String(severity).trim()
  const match = SEVERITY_ORDER.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase(),
  )
  return match ?? trimmed
}

export function severityRank(severity) {
  const normalized = normalizeSeverity(severity)
  const idx = SEVERITY_ORDER.indexOf(normalized)
  return idx === -1 ? SEVERITY_ORDER.length : idx
}

export function countBySeverity(findings) {
  const counts = {}
  for (const finding of findings) {
    const key = normalizeSeverity(finding.severity)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export function sortBySeverity(findings) {
  return [...findings].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  )
}
