# Cafe 1000

A static collection of dining receipt numbers **000-999**, updated through pull requests by the collection owner. The numbered board, search, filters, missing-number list, date-based journal, progress charts, and CSV export all work in the browser. There is no API, database, login, or runtime application server.

**The source of truth is `data/receipts.csv`.** Builds validate this file and embed a snapshot into static HTML and JavaScript in `out`. The site is read-only; receipts are added via PR by the collection owner.

## Update receipts through a PR

The collection owner creates a branch and edits `data/receipts.csv`, using a text editor to preserve leading zeros:

```csv
number,count,date
007,3,2026-08-15
007,1,2026-08-16
142,1,
999,2,2026-08-20
```

- **Add:** append a row for new receipts, or increase the count on the matching number/date row. Repeated rows are additive; do not accidentally count the same receipt twice.
- **Correct:** edit the count/date on the relevant row. Delete a row to remove those receipts. Revert the merged change in a new PR to undo it.
- **Date:** use the date printed on the receipt in `YYYY-MM-DD` format. Leave blank if unknown. A date applies to every copy in that row.
- **Number/count:** numbers are 000-999 (1-3 digits accepted); counts must be whole numbers of zero or more. Zero rows are ignored. A header-only file is a valid empty collection.

Run `npm run validate:receipts`, open a PR explaining the change, and merge after review. The site changes only after the merged commit is rebuilt and deployed; reload the browser afterward. Git history and PRs replace the former in-app audit/undo history.

Receipt additions and corrections are handled in the Git host by the collection owner, not through controls on the site.

CSV accepts a required `number` header and optional `count` (default 1) and `date` headers. Invalid rows, invalid calendar dates, unknown/duplicate columns, and fractional/negative counts fail the entire build. The collection is limited to 100,000 receipts and 1 MB of CSV text. The same number on multiple dates is still one unique number. **Duplicates = total receipts - unique numbers.**

**Export CSV** downloads the deployed snapshot, including zero-count rows for missing numbers. It is a full snapshot, not a set of additions: replacing the source file with it preserves that deployed collection, while appending it doubles receipts and also duplicates the header. Do not replace newer source changes with an older deployed export.

## Run locally

Requires **Node.js 24.15 or newer in the Node 24 release line** and npm.

```powershell
npm ci
npm run dev
```

Open **http://localhost:3000**. Development mode rebuilds when source files change. To preview the actual static export:

```powershell
npm run build
npm start
```

`npm start` serves only `out` on `127.0.0.1:3000`; it does not invoke Next.js, access SQLite, or handle mutations. Use `npm start -- --port 3100` to choose another port. Rebuild after editing CSV before previewing a new snapshot.

## Configuration and hosting

Rename the collection in `src/lib/site.ts`. Optional build settings can be supplied as environment variables or in `.env.local`:

```powershell
$env:CAFE_REPOSITORY_URL = 'https://github.com/your-team/cafe-1000'
$env:CAFE_BASE_PATH = '/cafe-1000'
npm run build
npm start
```

`CAFE_REPOSITORY_URL` is an HTTPS repository link (GitHub, Azure DevOps, or another Git host), shown in the header. Omit it until a repository exists. Do not put credentials or secrets in either setting.

Leave `CAFE_BASE_PATH` empty for an origin root or custom domain. For a project site at `https://your-team.github.io/cafe-1000/`, use `/cafe-1000`. The build bakes this path into asset URLs; use the same setting for the local preview, then open `http://localhost:3000/cafe-1000/`.

Deploy **only the contents of `out`** to any static host. Never upload the project root, `.env` files, `data` directory, or old database backups. Build tools need Node; the deployed site does not. Configure the host to serve `index.html` for directories and avoid long caching of HTML so new receipts appear after deployment.

**Privacy changes:** there is no application-level access control. Anyone who can load the hosted site can read/download all included receipt numbers and dates. A private Git repository does not necessarily make its website private. Choose a hosting service with access restrictions if the collection must remain team-only. `robots: noindex` is not security. For hosts that support response headers, set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.

## GitHub PR checks and optional Pages deployment

This folder must first be added to a Git repository and connected to your chosen Git host; no remote is assumed or created automatically. GitHub Actions is provided as a default, but the build commands work in other CI systems too.

`.github/workflows/static-site.yml` validates every PR, runs unit/browser checks against the exported files, and uploads `out` as a build artifact. Make **Validate and build** a required branch-protection check and require PR approval on `main`.

GitHub Pages deployment is **off by default**, to avoid accidentally publishing a formerly private collection. After choosing its visibility:

1. In repository **Settings > Pages**, select **GitHub Actions** as the source.
2. Set the Actions variable `CAFE_BASE_PATH` to `/your-repository-name` for a project URL, or leave it empty for a root/custom-domain site.
3. Set the Actions variable `CAFE_DEPLOY_PAGES` to `true`. Configure approval for the `github-pages` environment if needed.
4. Push/merge to `main` or run the workflow manually from `main`. Only successful builds of `main` can deploy; PRs cannot.

For other hosts, deploy `out` after a successful merged-branch build. If your default branch is not `main`, adjust the workflow's push trigger and deployment conditions.

## Existing collection migration

The active local collection was migrated to CSV with its original counts and receipt dates: **404 on 2024-10-23** and **700 on 2026-08-05**, one copy each. The local SQLite files and backups are untouched and remain Git-ignored. The app no longer reads or writes them. Authentication tokens, members, personal links, and old event history are not part of the static export.

Unknown receipt dates remain unknown. The timeline includes dated receipts only, with an explicit note for undated receipts still included in the board's totals. The former "date added" timeline and member-attributed activity are replaced by the receipt-date journal and Git history; migration does not invent timestamps or authors.

## Development

```powershell
npm run validate:receipts
npm test
npm run lint
npm run test:e2e
npm run typecheck
```

`test:e2e` builds first, then runs Playwright against **only the exported static files** on port 3107. If Chromium is missing, install it with `npx playwright install chromium`. Tests never modify the collection or access its old SQLite database.
