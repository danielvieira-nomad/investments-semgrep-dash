import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import {
  REPORT_PAYLOAD_VERSION,
  buildHashParam,
  encodeReportPayload,
} from '../shared/reportPayload.mjs'
import { discoverDateFolders, readFindingsForDates } from './lib/discoverFindings.mjs'
import { mergeFindingsById } from './lib/mergeFindings.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const MAX_URL_LENGTH = 32000

function readPackageHomepage() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  )
  return pkg.homepage ?? 'http://localhost:4173/investments-semgrep-dash'
}

function parseArgs(argv) {
  let baseUrl = process.env.REPORT_BASE_URL || readPackageHomepage()
  let open = false
  let findingsRoot = path.join(repoRoot, 'findings')
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--open') open = true
    else if (arg === '--base-url' && argv[i + 1]) {
      baseUrl = argv[++i]
    } else if (arg === '--findings' && argv[i + 1]) {
      findingsRoot = path.resolve(argv[++i])
    }
  }
  return { baseUrl, open, findingsRoot }
}

function uniqueSubsets(allDates) {
  const subsets = [
    allDates,
    allDates.slice(-4),
    allDates.slice(-3),
    allDates.slice(-2),
    allDates.slice(-1),
  ]
  const seen = new Set()
  return subsets.filter((s) => {
    const key = s.join(',')
    if (!s.length || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function compactFindingsForUrl(findings, maxDescriptionLength) {
  if (maxDescriptionLength === Infinity) return findings
  return findings.map((f) => ({
    ...f,
    ruleDescription:
      maxDescriptionLength <= 0
        ? ''
        : f.ruleDescription.length > maxDescriptionLength
          ? `${f.ruleDescription.slice(0, maxDescriptionLength)}…`
          : f.ruleDescription,
  }))
}

async function tryBuildUrl(findingsRoot, dates, baseUrl, maxDescriptionLength) {
  const buckets = await readFindingsForDates(findingsRoot, dates)
  const { includedDates, findings } = mergeFindingsById(buckets)
  const compacted = compactFindingsForUrl(findings, maxDescriptionLength)
  const report = {
    v: REPORT_PAYLOAD_VERSION,
    generatedAt: new Date().toISOString(),
    includedDates,
    findings: compacted,
  }
  const encoded = encodeReportPayload(report, gzipSync)
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const url = `${normalizedBase}/${buildHashParam(encoded)}`
  return { url, len: url.length, includedDates, count: findings.length }
}

async function main() {
  const { baseUrl, open, findingsRoot } = parseArgs(process.argv)
  const allDates = await discoverDateFolders(findingsRoot)
  if (!allDates.length) {
    console.error(`No date folders found under ${findingsRoot}`)
    process.exit(1)
  }

  const subsets = uniqueSubsets(allDates)
  let result = null
  const descriptionLimits = [Infinity, 500, 200, 0]
  for (const subset of subsets) {
    for (const limit of descriptionLimits) {
      result = await tryBuildUrl(findingsRoot, subset, baseUrl, limit)
      if (result.len <= MAX_URL_LENGTH) break
    }
    if (result.len <= MAX_URL_LENGTH) break
  }

  if (result.len > MAX_URL_LENGTH) {
    console.warn(
      `Warning: URL length ${result.len} exceeds ${MAX_URL_LENGTH}; sharing may fail in some clients.`,
    )
  }

  console.error(
    `Included dates: ${result.includedDates.join(', ')} | Findings: ${result.count} | URL length: ${result.len}`,
  )
  console.log(result.url)

  if (open) {
    const cmd =
      process.platform === 'darwin'
        ? 'open'
        : process.platform === 'win32'
          ? 'start'
          : 'xdg-open'
    exec(`${cmd} "${result.url}"`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
