import { parse } from 'csv-parse/sync'
import fs from 'node:fs/promises'
import path from 'node:path'
import { mapCsvRow } from '../../shared/csvMap.mjs'

const DATE_FOLDER_RE = /^\d{4}\.\d{2}\.\d{2}$/

export async function discoverDateFolders(findingsRoot) {
  const entries = await fs.readdir(findingsRoot, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && DATE_FOLDER_RE.test(e.name))
    .map((e) => e.name)
    .sort()
}

async function readCsvFilesInFolder(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })
  const csvFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.csv'))
    .map((e) => path.join(folderPath, e.name))
  const findings = []
  for (const file of csvFiles) {
    const content = await fs.readFile(file, 'utf8')
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    })
    for (const row of rows) {
      findings.push(mapCsvRow(row))
    }
  }
  return findings
}

export async function readFindingsForDates(findingsRoot, dates) {
  const buckets = []
  for (const date of dates) {
    const folderPath = path.join(findingsRoot, date)
    const findings = await readCsvFilesInFolder(folderPath)
    buckets.push({ date, findings })
  }
  return buckets
}
