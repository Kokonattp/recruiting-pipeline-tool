# Recruiting Tool — Scraper Service

A standalone Playwright + Express service that scrapes candidate / job listings
from public job sites. It is **completely separate** from the Next.js app: own
`package.json`, own `tsconfig.json`, deployed as its own Docker container
(Railway / Render). The Next.js app calls `POST /scrape`, then ranks the raw
results with Claude.

## Contract

### `POST /scrape`

Request body:

```json
{
  "secret": "must equal env SCRAPER_INGEST_SECRET",
  "queries": [
    { "source": "JOBSDB", "query": "hotel front office bangkok", "rationale": "..." }
  ]
}
```

`source` is one of: `LINKEDIN | JOBSDB | JOBBKK | JOBTHAI | FACEBOOK | WEB | REFERRAL | MANUAL`.

Response body:

```json
{
  "candidates": [
    {
      "source": "JOBSDB",
      "sourceUrl": "https://...",
      "name": "optional",
      "headline": "optional",
      "snippet": "optional raw text blob"
    }
  ]
}
```

Auth: `secret` must equal `process.env.SCRAPER_INGEST_SECRET` or the endpoint
returns `401`.

### `GET /health`

Returns `{ "ok": true, "service": "recruiting-tool-scraper" }`.

## Source status

| Source     | Status        | Notes                                                                 |
| ---------- | ------------- | --------------------------------------------------------------------- |
| `WEB`      | Implemented   | Uses **Bing** search (Google blocks headless aggressively).           |
| `JOBSDB`   | Implemented   | Public job board (`th.jobsdb.com`). Returns job postings as leads.    |
| `JOBTHAI`  | Implemented   | Public job board (`jobthai.com`). Returns job postings as leads.      |
| `LINKEDIN` | Stub → `[]`   | Requires session + prohibited by ToS.                                 |
| `FACEBOOK` | Stub → `[]`   | Login wall + prohibited by ToS.                                       |
| `JOBBKK`   | Stub → `[]`   | Candidate search needs employer login.                                |
| `REFERRAL` | n/a           | Human-entered; nothing to scrape (skipped).                           |
| `MANUAL`   | n/a           | Human-entered; nothing to scrape (skipped).                           |

**Anti-bot reality (honest):** these are public sites that change their markup,
rate-limit, and sometimes serve CAPTCHAs/consent walls to automation. Each
source is wrapped in its own `try/catch` with a ~20s timeout — if one is blocked
or its layout shifts, it returns `[]` and the request still succeeds with results
from the others. Selectors will need occasional maintenance.

## Run locally

```bash
cd scraper
npm install
npx playwright install chromium   # only needed for local (non-Docker) runs
export SCRAPER_INGEST_SECRET=dev-secret
npm run dev                        # tsx watch, hot reload
```

Type-check / build:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc -> dist/
npm run start       # node dist/server.js
```

### Environment variables

| Var                     | Required | Default | Purpose                                      |
| ----------------------- | -------- | ------- | -------------------------------------------- |
| `SCRAPER_INGEST_SECRET` | yes      | —       | Shared secret; requests without it get 401.  |
| `PORT`                  | no       | `4000`  | HTTP port.                                    |

## curl example

```bash
curl -X POST http://localhost:4000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "dev-secret",
    "queries": [
      { "source": "WEB",     "query": "hotel front office manager bangkok resume" },
      { "source": "JOBSDB",  "query": "front office manager bangkok" },
      { "source": "JOBTHAI", "query": "front office manager bangkok" }
    ]
  }'
```

## Deploy to Railway

1. Push this repo to GitHub.
2. In Railway, **New Project → Deploy from GitHub repo**.
3. Set the **Root Directory** to `scraper/` (Settings → Build) so Railway uses
   this folder's `Dockerfile`. Railway auto-detects the Dockerfile and builds it.
4. Add the env var `SCRAPER_INGEST_SECRET` (Variables tab). Railway injects
   `PORT` automatically — the server reads it.
5. Deploy. Railway gives you a public URL; point the Next.js app's scraper URL at
   `https://<your-app>.up.railway.app`.

Render is equivalent: **New → Web Service**, root dir `scraper/`, Docker runtime,
add `SCRAPER_INGEST_SECRET`, and Render supplies `PORT`.

## Architecture

```
scraper/
  server.ts          Express app: /health, /scrape, auth, shared browser, per-source try/catch
  types.ts           RawCandidate / SearchQuery / Source — mirror of the Next.js contract
  browser.ts         Playwright context/page factory, User-Agent, timeouts, safe cleanup
  sources/
    index.ts         Source interface + registry (name -> implementation)
    web.ts           WEB     (Bing results)
    jobsdb.ts        JOBSDB  (public job board)
    jobthai.ts       JOBTHAI (public job board)
    _stub.ts         Factory for "requires session — not implemented" sources
    linkedin.ts      LINKEDIN stub
    facebook.ts      FACEBOOK stub
    jobbkk.ts        JOBBKK stub
```

Adding a source: create `sources/<name>.ts` exporting a `Source` (with
`name` + `async scrape(browser, query)`), then register it in
`sources/index.ts`. Each source is isolated and independently testable.
