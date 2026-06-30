<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules (READ FIRST — for any agent continuing this work)

> Full guide: **`CLAUDE.md`**. Current state + what's left: **`docs/STATUS.md`** & **`TODO.md`**.
> Why things are the way they are (decisions, dead ends): **`AI_LOG.md`**. Brief: **`docs/ASSIGNMENT_BRIEF.md`**.

Recruiting Pipeline Tool — HR hiring app, 4 modules in one Next.js codebase (Module 1 Sourcing,
2 Screener, 3 Tracker, 4 Scheduler). Hard rules — breaking these undoes deliberate work:

1. **NO mock/fake data, ever.** Real data from Supabase; empty → an empty/onboarding state.
2. **mutations → Server Actions** (`modules/*/actions.ts`), validate every input with **zod**.
   DB access only via `modules/*/queries.ts` + `actions.ts` (service-role client `lib/supabase.ts`).
3. **AI model tiering** (`lib/claude.ts`): Opus only for the hard judgment (rank candidates,
   web search); Sonnet 4.6 for JD-gen / query / screening. Don't put Opus everywhere; don't swap
   the provider (whole system is Claude tool-use + structured output).
4. **Sourcing runs in Vercel** — GitHub + LinkedIn/Facebook (Apify) + AI web search are plain
   APIs in `lib/sourcing-apis.ts` / `lib/web-search.ts`. The Playwright `scraper/` service is
   OPTIONAL (only job boards). **Apify is OFF unless `ENABLE_APIFY=true`** — it's pay-per-event,
   don't enable it casually.
5. **Screener scoring is deterministic** (temperature 0 + anchored rubric + confidence). The
   recommendation band is computed by OUR rule (`deriveRecommendation`), not the LLM. Don't make
   the model guess the band — that reintroduces the variance we removed (see AI_LOG round 10-12).
6. **Brand: Hotel Plus yellow + black** + LOGA cards (`.loga-card`) + impeccable. On yellow use
   black ink (`--primary-ink`). Tokens in `globals.css` (OKLCH, light/dark) — never hard-code colors.
7. **Workflow:** small commit per feature; `npx tsc --noEmit` + `npx eslint` must pass before every
   commit; end commit messages with the Co-Authored-By trailer. Commit/push only what's asked.

Run: `npm run dev` (web) · `cd scraper && npx tsx server.ts` (scraper) · `npx tsc --noEmit` (cd into
the dir first). Setup/keys: **`docs/SETUP.md`**.
