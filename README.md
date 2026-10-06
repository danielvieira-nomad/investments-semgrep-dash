# investments-semgrep-dash

Static Semgrep findings dashboard for the investments team. Raw CSV exports stay on your machine; share reports via CLI-generated URLs (`#d=` payload).

## Maintainer workflow

1. Place Semgrep combined exports under `findings/YYYY.MM.DD/*.csv` (folder name = snapshot date).
2. Run `npm run report:link` (optional `--open`, `--base-url <pages-url>`).
3. Share the printed URL with teammates who have **read access** to this private GitHub repo.

Never commit `findings/` or paste production CSVs into the repository.

## Development

```bash
npm install
npm run dev
npm run test
npm run build
```

For local preview with the same base path as GitHub Pages:

```bash
npm run build && npm run preview
```

Open a CLI-generated link against the preview origin (adjust `--base-url` if needed).

## GitHub Pages

- Enable **Pages** → source: **GitHub Actions**.
- Default site URL: `https://danielvieira-nomad.github.io/investments-semgrep-dash/`
- Vite `base` is `/investments-semgrep-dash/`.

## Privacy

- Payload in the URL hash is not encrypted; anyone with the full link can decode it.
- The static app contains no finding data until a hash is present.
