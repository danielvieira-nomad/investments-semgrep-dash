export function mapCsvRow(row) {
  return {
    id: String(row.Id ?? ''),
    repositoryName: row['Repository Name'] ?? '',
    severity: row.Severity ?? '',
    status: row.Status ?? '',
    ruleName: row['Rule Name'] ?? '',
    confidence: row.Confidence ?? '',
    category: row.Category ?? '',
    repositoryUrl: row['Repository Url'] ?? '',
    lineOfCodeUrl: row['Line Of Code Url'] ?? '',
    semgrepPlatformLink: row['Semgrep Platform Link'] ?? '',
    branch: row.Branch ?? '',
    createdAt: row['Created At'] ?? '',
    lastOpenedAt: row['Last Opened At'] ?? '',
    ruleDescription: row['Rule Description'] ?? '',
    triageComment: row['Triage Comment'] ?? '',
    triageReason: row['Triage Reason'] ?? '',
  }
}
