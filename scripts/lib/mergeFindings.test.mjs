import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { discoverDateFolders, readFindingsForDates } from './discoverFindings.mjs'
import { mergeFindingsById } from './mergeFindings.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesRoot = path.join(__dirname, '../__fixtures__')

describe('mergeFindings', () => {
  it('dedupes by id keeping newest date folder', async () => {
    const dates = await discoverDateFolders(fixturesRoot)
    expect(dates).toEqual(['2026.10.01', '2026.10.02'])
    const buckets = await readFindingsForDates(fixturesRoot, dates)
    const merged = mergeFindingsById(buckets)
    expect(merged.findings).toHaveLength(2)
    const id100 = merged.findings.find((f) => f.id === '100')
    expect(id100.status).toBe('Fixed')
  })
})
