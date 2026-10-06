# Semgrep Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a private-GitHub-Pages React dashboard that visualizes Semgrep findings from a CLI-generated URL hash payload (`#d=`), with MUI light/dark UI, overview + per-project views, and no committed raw CSV data.

**Architecture:** A Node CLI reads local `findings/YYYY.MM.DD/*.csv`, merges/dedupes into JSON v1, gzip+base64url-encodes into `#d=`. The Vite SPA decodes the hash once into React context and renders overview/project routes. Shared encode/decode lives in `shared/` for CLI + Vitest parity with the browser (`pako`).

**Tech Stack:** Vite 8, React 19, Material UI, React Router, Recharts, pako, Vitest, Node `zlib` (CLI), GitHub Actions Pages deploy.

## Global Constraints

- UI: Material UI with light/dark mode; color mode only in `localStorage`, never findings.
- Data ingestion: local Node CLI only (`yarn report:link`); no in-browser upload.
- Payload: hash only `#d=...` (gzip + base64url JSON v1).
- Hosting: private repo + GitHub Pages; Vite `base: '/investments-semgrep-dash/'`.
- Status filter: include **all** statuses in payload.
- Multi-date merge: all `YYYY.MM.DD` folders; dedupe by Semgrep `Id` (newest date wins); URL length fallback last **4 → 3 → 2 → 1** dates (~32k char limit).
- `findings/` gitignored; no payload files committed.
- `package.json` dependencies: **exact versions only** (no `^`, `~`, `*`, or range operators).

---

## File map (created or modified)

| Path | Responsibility |
|------|----------------|
| `shared/reportPayload.mjs` | v1 schema constants, gzip+base64url encode/decode, hash param parse/build |
| `shared/severity.mjs` | Severity order, normalize labels, count-by-severity helper |
| `shared/csvMap.mjs` | Map Semgrep CSV row object → finding JSON field names |
| `scripts/lib/discoverFindings.mjs` | List date folders, read CSVs per folder |
| `scripts/lib/mergeFindings.mjs` | Merge rows across dates, dedupe by `id` |
| `scripts/generate-report-url.mjs` | CLI entry: build URL, fallback dates, `--open` |
| `src/lib/decodeReportPayload.js` | Browser wrapper: `pako` + `shared/reportPayload.mjs` |
| `src/context/ReportContext.jsx` | Decode hash → `report` state; error states |
| `src/context/ColorModeContext.jsx` | MUI light/dark + `localStorage` key `semgrep-dash-color-mode` |
| `src/theme/theme.js` | `createTheme` light/dark |
| `src/utils/repoSlug.js` | `toRepoSlug(name)` / `fromRepoSlug(slug)` |
| `src/utils/aggregations.js` | Projects list, severity counts, top-N high+critical |
| `src/components/AppShell.jsx` | AppBar, theme toggle, outlet |
| `src/components/EmptyReportState.jsx` | No/invalid payload UX |
| `src/components/OverviewPage.jsx` | Stats, charts, project grid |
| `src/components/OverviewCharts.jsx` | Recharts donut/bar charts |
| `src/components/ProjectCard.jsx` | Card per repository |
| `src/components/ProjectPage.jsx` | Breadcrumb, accordions by severity |
| `src/components/FindingRow.jsx` | Single finding expandable detail |
| `src/components/SeverityChips.jsx` | Colored chips from counts |
| `src/App.jsx` | Router routes |
| `src/main.jsx` | Providers |
| `vite.config.js` | `base`, Vitest, `shared` alias |
| `.gitignore` | add `findings/` |
| `.github/workflows/deploy-pages.yml` | Build + deploy `dist` |
| `README.md` | Maintainer: CLI, Pages, privacy |

---

### Task 1: Repository hygiene, Vite base, Vitest

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `vitest.setup.js` (empty or minimal)

**Interfaces:**
- Produces: `import.meta.env.BASE_URL` = `/investments-semgrep-dash/` in dev/build; `yarn test` runs Vitest.

- [ ] **Step 1: Add `findings/` to `.gitignore`**

Append to `.gitignore`:

```
findings/
```

- [ ] **Step 2: Add `homepage` and scripts to `package.json`**

Set (use exact versions when adding deps in later tasks; fix existing carets on react/vite in this task per policy):

```json
"homepage": "https://danielvieira-nomad.github.io/investments-semgrep-dash",
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "report:link": "node scripts/generate-report-url.mjs"
}
```

Pin existing dependencies to exact versions currently resolved (remove `^` from all entries).

- [ ] **Step 3: Install Vitest**

Run:

```bash
npm install --save-exact vitest@3.2.4
```

(If a different exact version installs, use that version consistently in the file.)

- [ ] **Step 4: Configure Vite base + Vitest**

Replace `vite.config.js` with:

```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/investments-semgrep-dash/',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['shared/**/*.test.mjs', 'scripts/**/*.test.mjs', 'src/**/*.test.js'],
  },
})
```

- [ ] **Step 5: Verify**

Run: `npm run build`  
Expected: succeeds (still default App).

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json vite.config.js
git commit -m "chore: configure Pages base path, vitest, and ignore findings"
```

---

### Task 2: Shared payload codec (encode/decode + hash)

**Files:**
- Create: `shared/reportPayload.mjs`
- Create: `shared/reportPayload.test.mjs`

**Interfaces:**
- Produces:
  - `export const REPORT_PAYLOAD_VERSION = 1`
  - `export function encodeReportPayload(report, gzipSync)` → `string` (base64url)
  - `export function decodeReportPayload(encoded, gunzipSync)` → report object
  - `export function buildHashParam(encoded)` → `#d=${encoded}`
  - `export function parseHashParam(hash)` → `string | null`
  - `gzipSync`/`gunzipSync` injected so Node uses `zlib` and tests use `zlib`; browser uses `pako` in a thin wrapper later.

- [ ] **Step 1: Write failing tests**

Create `shared/reportPayload.test.mjs`:

```javascript
import { gzipSync, gunzipSync } from 'node:zlib'
import { describe, it, expect } from 'vitest'
import {
  REPORT_PAYLOAD_VERSION,
  encodeReportPayload,
  decodeReportPayload,
  buildHashParam,
  parseHashParam,
} from './reportPayload.mjs'

describe('reportPayload', () => {
  const sample = {
    v: REPORT_PAYLOAD_VERSION,
    generatedAt: '2026-10-06T12:00:00.000Z',
    includedDates: ['2026.10.06'],
    findings: [
      {
        id: '1',
        repositoryName: 'org/repo-a',
        severity: 'High',
        status: 'Open',
        ruleName: 'rule.a',
        confidence: 'High',
        category: 'security',
        repositoryUrl: '',
        lineOfCodeUrl: '',
        semgrepPlatformLink: '',
        branch: 'refs/heads/main',
        createdAt: '',
        lastOpenedAt: '',
        ruleDescription: 'desc',
        triageComment: '',
        triageReason: '',
      },
    ],
  }

  it('round-trips encode/decode', () => {
    const enc = encodeReportPayload(sample, gzipSync)
    expect(typeof enc).toBe('string')
    const out = decodeReportPayload(enc, gunzipSync)
    expect(out).toEqual(sample)
  })

  it('parseHashParam reads d from hash', () => {
    const enc = encodeReportPayload(sample, gzipSync)
    expect(parseHashParam(buildHashParam(enc))).toBe(enc)
    expect(parseHashParam('#d=abc')).toBe('abc')
    expect(parseHashParam('')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- shared/reportPayload.test.mjs`  
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `shared/reportPayload.mjs`**

```javascript
export const REPORT_PAYLOAD_VERSION = 1

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64')
}

export function encodeReportPayload(report, gzipSyncFn) {
  if (report.v !== REPORT_PAYLOAD_VERSION) {
    throw new Error(`Unsupported report version: ${report.v}`)
  }
  const json = JSON.stringify(report)
  const compressed = gzipSyncFn(Buffer.from(json, 'utf8'))
  return toBase64Url(compressed)
}

export function decodeReportPayload(encoded, gunzipSyncFn) {
  const buf = fromBase64Url(encoded)
  const json = gunzipSyncFn(buf).toString('utf8')
  const report = JSON.parse(json)
  if (report.v !== REPORT_PAYLOAD_VERSION) {
    throw new Error(`Unsupported report version: ${report.v}`)
  }
  return report
}

export function buildHashParam(encoded) {
  return `#d=${encoded}`
}

export function parseHashParam(hash) {
  if (!hash) return null
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(raw)
  return params.get('d')
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- shared/reportPayload.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared/reportPayload.mjs shared/reportPayload.test.mjs
git commit -m "feat: add shared report payload codec"
```

---

### Task 3: Severity helpers + CSV row mapping

**Files:**
- Create: `shared/severity.mjs`
- Create: `shared/severity.test.mjs`
- Create: `shared/csvMap.mjs`
- Create: `shared/csvMap.test.mjs`

**Interfaces:**
- Produces:
  - `export const SEVERITY_ORDER` — array `['Critical','High','Medium','Low','Info']` (unknown severities sort last)
  - `export function normalizeSeverity(s)` → string
  - `export function countBySeverity(findings)` → `Record<string, number>`
  - `export function mapCsvRow(row)` → finding object (keys match design spec camelCase)

- [ ] **Step 1: Write failing severity tests**

`shared/severity.test.mjs` — assert order, `countBySeverity` totals.

- [ ] **Step 2: Implement `shared/severity.mjs`**

- [ ] **Step 3: Write failing csvMap test** with one fake CSV row object using Semgrep headers (`Id`, `Repository Name`, `Severity`, …).

- [ ] **Step 4: Implement `shared/csvMap.mjs`** mapping:

| CSV column | JSON field |
|------------|------------|
| Id | id |
| Repository Name | repositoryName |
| Severity | severity |
| Status | status |
| Rule Name | ruleName |
| Confidence | confidence |
| Category | category |
| Repository Url | repositoryUrl |
| Line Of Code Url | lineOfCodeUrl |
| Semgrep Platform Link | semgrepPlatformLink |
| Branch | branch |
| Created At | createdAt |
| Last Opened At | lastOpenedAt |
| Rule Description | ruleDescription |
| Triage Comment | triageComment |
| Triage Reason | triageReason |

- [ ] **Step 5: Run** `npm run test` — all PASS

- [ ] **Step 6: Commit** `feat: severity helpers and CSV row mapping`

---

### Task 4: Discover + merge findings (CLI library)

**Files:**
- Create: `scripts/lib/discoverFindings.mjs`
- Create: `scripts/lib/mergeFindings.mjs`
- Create: `scripts/lib/mergeFindings.test.mjs`
- Create: `scripts/__fixtures__/2026.10.01/sample.csv`
- Create: `scripts/__fixtures__/2026.10.02/sample.csv`

**Interfaces:**
- Produces:
  - `export async function discoverDateFolders(findingsRoot)` → `string[]` sorted `YYYY.MM.DD`
  - `export async function readFindingsForDates(findingsRoot, dates)` → `{ date, findings[] }[]`
  - `export function mergeFindingsById(dateBuckets)` → `{ includedDates, findings }` newest-wins per `id`

**Fixture content (synthetic only):**

- `2026.10.01/sample.csv`: header + row `Id=100`, `Severity=Low`
- `2026.10.02/sample.csv`: header + row `Id=100` (updated `Status=Fixed`) and `Id=101`

Expect merged length 2, id 100 from 2026.10.02.

- [ ] **Step 1: Write failing merge test**

- [ ] **Step 2: Implement merge + discover** (use `fs/promises`, `path`; date folder regex `^\d{4}\.\d{2}\.\d{2}$`; read all `*.csv` in each folder; parse CSV with a small dependency).

- [ ] **Step 3: Add CSV parser dependency**

Run: `npm install --save-exact csv-parse@5.6.0`

Use `csv-parse/sync` `parse` with `columns: true`, `skip_empty_lines: true`.

- [ ] **Step 4: Run** `npm run test -- scripts/lib/mergeFindings.test.mjs` — PASS

- [ ] **Step 5: Commit** `feat: discover and merge findings from date folders`

---

### Task 5: `generate-report-url` CLI

**Files:**
- Create: `scripts/generate-report-url.mjs`

**Interfaces:**
- Consumes: `discoverFindings`, `mergeFindingsById`, `encodeReportPayload`, `buildHashParam`, `REPORT_PAYLOAD_VERSION`
- Produces CLI stdout URL; stderr logs dates count and fallback.

- [ ] **Step 1: Implement CLI**

Logic:

1. `findingsRoot = path.resolve('findings')`
2. `dates = await discoverDateFolders(findingsRoot)`; if empty, exit 1 with message
3. `tryBuildUrl(dateSubset)`:
   - merge → `{ includedDates, findings }`
   - `report = { v: 1, generatedAt: new Date().toISOString(), includedDates, findings }`
   - `enc = encodeReportPayload(report, gzipSync)`
   - `url = baseUrl + '/' + buildHashParam(enc)` (normalize slashes)
   - return `{ url, len: url.length, includedDates, count: findings.length }`
4. Try subsets: all dates, then `dates.slice(-4)`, `slice(-3)`, `slice(-2)`, `slice(-1)` (unique attempts, skip duplicates)
5. Pick first with `len <= 32000`; else last attempt and print warning
6. Args: `--base-url` (default `process.env.REPORT_BASE_URL || package.json homepage`), `--open` uses `node:child_process` `exec` platform open

- [ ] **Step 2: Manual test** (maintainer machine only; do not commit output)

Run: `npm run report:link`  
Expected: prints URL containing `#d=`, logs finding count.

- [ ] **Step 3: Commit** `feat: add report URL generator CLI`

---

### Task 6: Core dependencies, theme, router shell

**Files:**
- Modify: `package.json`
- Create: `src/context/ColorModeContext.jsx`
- Create: `src/theme/theme.js`
- Create: `src/components/AppShell.jsx`
- Modify: `src/App.jsx`, `src/main.jsx`
- Remove or stop using: `src/App.css` boilerplate styles (minimal global reset only)

**Interfaces:**
- Produces: `ColorModeProvider`, `AppShell` with title "Semgrep — Investments", theme toggle, `<Outlet />`

- [ ] **Step 1: Install exact deps**

```bash
npm install --save-exact @mui/material@6.4.8 @emotion/react@11.14.0 @emotion/styled@11.14.0 @mui/icons-material@6.4.8 react-router-dom@7.5.0 pako@2.1.0 recharts@2.15.1
```

(Adjust exact patch if npm resolves newer compatible exact — record what installed.)

- [ ] **Step 2: Implement ColorModeContext** — `localStorage` key `semgrep-dash-color-mode`, values `light` | `dark`

- [ ] **Step 3: Implement theme.js** — `getTheme(mode)`

- [ ] **Step 4: AppShell** — MUI `AppBar`, `Toolbar`, `IconButton` (`Brightness4`/`Brightness7`), `Container`

- [ ] **Step 5: Router in App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
// basename import.meta.env.BASE_URL
// routes: / -> OverviewPage placeholder, /project/:repoSlug -> ProjectPage placeholder
```

- [ ] **Step 6: Run** `npm run dev` — app loads with MUI shell

- [ ] **Step 7: Commit** `feat: MUI shell, theme toggle, and router`

---

### Task 7: Browser decode + ReportContext

**Files:**
- Create: `src/lib/decodeReportPayload.js`
- Create: `src/context/ReportContext.jsx`
- Create: `src/lib/decodeReportPayload.test.js` (optional: test via node + pako inflate)

**Interfaces:**
- Produces:
  - `export function decodeReportPayloadBrowser(encoded)` 
  - `export function useReport()` → `{ status: 'loading'|'missing'|'error'|'ready', report?, error? }`
  - Reads `parseHashParam(window.location.hash)` on mount and `hashchange`

- [ ] **Step 1: decodeReportPayloadBrowser** — `import { inflate } from 'pako'`; wrap bytes for `decodeReportPayload` (implement gunzip via pako in shared or adapter):

```javascript
import { decodeReportPayload } from '@shared/reportPayload.mjs'
import { inflate } from 'pako'

export function decodeReportPayloadBrowser(encoded) {
  const bytes = /* base64url decode to Uint8Array */
  const jsonBuf = inflate(bytes)
  const json = new TextDecoder().decode(jsonBuf)
  return decodeReportPayload(/* pass string through shared parse path */)
}
```

Refactor if needed: add `decodeReportPayloadFromJson` or pass gunzip that uses pako in browser.

- [ ] **Step 2: ReportContext** — wrap app routes; children get `report` when `ready`

- [ ] **Step 3: Wire in main.jsx** — `ReportProvider` inside `ColorModeProvider`

- [ ] **Step 4: Commit** `feat: decode report payload from URL hash`

---

### Task 8: Empty state + aggregations + repo slug

**Files:**
- Create: `src/components/EmptyReportState.jsx`
- Create: `src/utils/repoSlug.js`
- Create: `src/utils/aggregations.js`
- Create: `src/utils/aggregations.test.js`

**Interfaces:**
- `toRepoSlug(repositoryName)` = `encodeURIComponent(repositoryName)`
- `groupFindingsByProject(findings)` → Map or array sorted by high+critical count
- `getOrgStats(findings)` → totals

- [ ] **Step 1: Tests for aggregations** with 3 fake findings across 2 repos

- [ ] **Step 2: EmptyReportState** — missing vs error vs unsupported version messages per spec

- [ ] **Step 3: Commit** `feat: report aggregations and empty states`

---

### Task 9: Overview page (cards + stats)

**Files:**
- Create: `src/components/SeverityChips.jsx`
- Create: `src/components/ProjectCard.jsx`
- Create: `src/components/OverviewPage.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useReport()` ready state
- `ProjectCard` navigates to `/project/${toRepoSlug(name)}` (hash preserved by browser)

- [ ] **Step 1: OverviewPage** — stat row, filter/sort by name (simple `useMemo`), grid of `ProjectCard`

- [ ] **Step 2: SeverityChips** — map severity to MUI `Chip` colors (theme palette error/warning/info)

- [ ] **Step 3: Manual check** — run CLI, paste hash on `npm run dev`, verify cards match project count

- [ ] **Step 4: Commit** `feat: overview page with per-project cards`

---

### Task 10: Overview charts (Recharts)

**Files:**
- Create: `src/components/OverviewCharts.jsx`
- Modify: `src/components/OverviewPage.jsx`

- [ ] **Step 1: Donut/pie** — counts by severity (org-wide)

- [ ] **Step 2: Horizontal bar** — top 10 repos by High+Critical count

- [ ] **Step 3: Status bar chart** — counts by status

- [ ] **Step 4: ResponsiveContainer** height ~280px; MUI `Paper` wrappers

- [ ] **Step 5: Commit** `feat: overview charts for severity and status`

---

### Task 11: Project detail page

**Files:**
- Create: `src/components/FindingRow.jsx`
- Create: `src/components/ProjectPage.jsx`

- [ ] **Step 1: ProjectPage** — match `repoSlug` to `repositoryName`; if none, not-found UI

- [ ] **Step 2: Group by severity** using `SEVERITY_ORDER`; MUI `Accordion` per severity with count in summary

- [ ] **Step 3: FindingRow** — links open in new tab (`rel="noopener"`); expandable rule description

- [ ] **Step 4: Breadcrumb** `Link` to `/` (hash unchanged)

- [ ] **Step 5: Commit** `feat: project detail grouped by severity`

---

### Task 12: Component tests (Vitest + RTL)

**Files:**
- Modify: `package.json`, `vite.config.js`
- Create: `src/components/OverviewPage.test.jsx`

- [ ] **Step 1: Install** `npm install --save-exact @testing-library/react@16.3.0 @testing-library/jest-dom@6.6.4 jsdom@26.1.0`

- [ ] **Step 2: Set Vitest environment jsdom for component tests**

- [ ] **Step 3: Test** — render `OverviewPage` with mock `ReportProvider` value (2 projects) → expect 2 project card titles

- [ ] **Step 4: Run** `npm run test` — all PASS

- [ ] **Step 5: Commit** `test: overview page renders project cards`

---

### Task 13: GitHub Actions deploy to Pages

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`

**Workflow content:**

```yaml
name: Deploy GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 1: Rename branch** `master` → `main` if still on master: `git branch -m main`

- [ ] **Step 2: README** — steps: enable Pages from GitHub Actions; add collaborators; run `npm run report:link`; never commit `findings/`

- [ ] **Step 3: Commit** `ci: deploy static site to GitHub Pages`

---

### Task 14: Final verification

- [ ] **Step 1:** `npm run lint` — fix issues

- [ ] **Step 2:** `npm run test` — all PASS

- [ ] **Step 3:** `npm run build` && `npm run preview` — open CLI URL with hash, click through project

- [ ] **Step 4:** Confirm no `findings/` in `git status`

- [ ] **Step 5: Commit** any remaining fixes — `chore: polish dashboard for release`

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| MUI light/dark | 6 |
| CLI-only ingestion | 4, 5 |
| Hash `#d=` payload | 2, 5, 7 |
| Private Pages + base path | 1, 13 |
| All statuses | 4 (no filter) |
| Merge + URL fallback | 4, 5 |
| Overview cards + severity | 9 |
| Project detail by severity | 11 |
| Charts | 10 |
| Error states | 8, 7 |
| No findings in git | 1 |
| Tests | 2–4, 8, 12 |
| `findings/` local only | 1, 5 |

No TBD placeholders in task steps. Chart library locked: **Recharts**. CSV glob: `findings/<date>/*.csv`.
