# Semgrep findings dashboard — design spec

**Date:** 2026-10-06  
**Status:** Approved in brainstorming  
**Repo:** `investments-semgrep-dash` (Vite + React)

## Goals

- Replace paid Semgrep dashboard seats with a team-facing **static report** hosted on **private GitHub Pages** under the maintainer’s personal account (`danielvieira-nomad`).
- **Never commit raw findings**; CSVs live only in local `findings/`.
- Teammates open **shareable URLs** where the report payload is **gzip + base64url** in the URL **hash** (`#d=...`), decoded entirely in the browser.

## Non-goals

- In-browser CSV upload (workflow is CLI-only).
- Server-side storage, APIs, or databases.
- Encryption of payload (encoding is not secrecy; link handling is the access control for data).

## Constraints & decisions

| Topic | Decision |
|--------|----------|
| UI | [Material UI](https://mui.com/material-ui/) with light/dark mode |
| Data ingestion | Local Node CLI reads `findings/` |
| Payload location | Hash only (`#d=...`) — not sent on HTTP request to Pages |
| Hosting | Private repo + private GitHub Pages; teammates need **read** access |
| Status filter | **All** statuses in payload |
| Multi-date merge | Try **all** `YYYY.MM.DD` folders; dedupe by Semgrep `Id` (newest snapshot wins); if URL too long, fall back to last **4 → 3 → 2 → 1** dates |
| Persistence | No `localStorage` / IndexedDB for findings; optional `localStorage` only for color mode |

## Architecture

### Components

1. **`scripts/generate-report-url.mjs`** (npm script e.g. `yarn report:link`)
   - Discover `findings/YYYY.MM.DD/*.csv` (combined Semgrep export).
   - Sort dates ascending; merge rows; dedupe by `Id` keeping row from newest date folder.
   - Map to compact JSON schema `v: 1`.
   - gzip → base64url → append to site URL as hash param `d`.
   - Enforce max URL length (~32k char safety margin); reduce included dates per fallback rule.
   - Print URL to stdout; optional `--open`, `--base-url`.

2. **`src/lib/payload`**
   - Parse hash, decode, validate version, return typed in-memory model.
   - No network calls with payload.

3. **React app**
   - MUI shell, React Router with Vite `base: '/<repo>/'`.
   - Routes: `/` overview, `/project/:repoSlug` detail.
   - Shareable URL: `https://<user>.github.io/<repo>/project/<slug>#d=<payload>`.

4. **Repository hygiene**
   - `findings/` in `.gitignore`.
   - Published artifact is static `dist/` only (no embedded CSV).

### Data flow

```
findings/*.csv (local) → CLI → URL#d=payload
                                      ↓
Teammate browser → load private Pages (auth) → JS decode hash → React state → UI
```

### Payload schema (v1)

```json
{
  "v": 1,
  "generatedAt": "ISO-8601",
  "includedDates": ["2026.10.06"],
  "findings": [
    {
      "id": "string",
      "repositoryName": "string",
      "severity": "string",
      "status": "string",
      "ruleName": "string",
      "confidence": "string",
      "category": "string",
      "repositoryUrl": "string",
      "lineOfCodeUrl": "string",
      "semgrepPlatformLink": "string",
      "branch": "string",
      "createdAt": "string",
      "lastOpenedAt": "string",
      "ruleDescription": "string",
      "triageComment": "string",
      "triageReason": "string"
    }
  ]
}
```

Field set may be trimmed only if URL limits require it; prefer keeping links and triage fields.

### Routing & `repoSlug`

- `repoSlug` = URL-encoded `Repository Name` from CSV (e.g. `nomad-bank/investments-foo` → encodeURIComponent).
- Client-side navigation must preserve `location.hash` when moving between overview and project routes.

## UI specification

### Empty / no payload

- No `#d` or invalid payload: explain that reports are opened via CLI-generated links; no upload.

### Overview (`/`)

- App bar: title, chip with `includedDates`, theme toggle.
- Summary: total findings, project count, severity breakdown (chips or mini chart).
- Charts (v1): org-wide severity chart; top ~10 projects by High+Critical; status breakdown.
- Project grid: **one MUI Card per `repositoryName`** with severity counts (primary), optional status hint, link to repo URL; click → project route.

### Project detail (`/project/:repoSlug`)

- Breadcrumb to overview.
- Repo-level severity summary and included dates.
- Findings grouped by severity (accordion or tabs, Critical first).
- Each finding: rule name, severity, status, confidence, category, branch, dates, external links; rule description expandable.

### Theming

- MUI `ThemeProvider` + `CssBaseline`.
- Toggle light/dark in app bar; persist mode in `localStorage` only.

## CLI behavior

- Default base URL: from `package.json` `homepage` or `--base-url` (GitHub Pages origin + repo base path).
- Log: included dates, finding count, final URL length warning if fallback applied.
- Do not write payload files into the repo by default.

## Error handling (app)

| Condition | UX |
|-----------|-----|
| Missing hash | Empty state |
| Decode/parse failure | MUI `Alert`: invalid link |
| Unsupported `v` | Unsupported version message |
| Unknown slug | Not found + link home |
| Zero findings | Neutral empty state |

## Deployment

- **GitHub Actions:** install deps, `yarn build`, deploy `dist` to GitHub Pages.
- **Vite** `base` matches repository name for project Pages.
- Collaborators require repo read access to load the app.

## Security notes

- Payload in hash is visible to anyone with the full URL (Slack, history, screenshots).
- Hash avoids sending bulk data in the HTTP request path/query to Pages.
- Do not add third-party analytics that read `location.hash`.
- Do not commit `findings/` or generated payload artifacts.

## Testing

- Unit: encode/decode round-trip with small JSON fixture; CLI merge/dedupe with synthetic CSV fixtures under `scripts/__fixtures__/` (no production data).
- Component: overview card count; project page severity grouping from mock payload.
- Manual: CLI against local `findings/`, open link via `vite preview` with correct `base`.

## Dependencies (planned)

- `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`
- `react-router-dom`
- `pako` (browser gzip); Node `zlib` in CLI
- One chart library (Recharts or MUI X Charts)
- Exact versions in `package.json` (no range prefixes per project policy)

## Open items for implementation plan

- Final chart library choice.
- Exact CSV filename glob per date folder.
- GitHub Actions workflow filename and Pages environment setup.
