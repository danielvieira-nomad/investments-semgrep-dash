export function mergeFindingsById(dateBuckets) {
  const byId = new Map()
  const includedDates = []

  for (const { date, findings } of dateBuckets) {
    includedDates.push(date)
    for (const finding of findings) {
      if (!finding.id) continue
      byId.set(finding.id, finding)
    }
  }

  return {
    includedDates,
    findings: [...byId.values()],
  }
}
