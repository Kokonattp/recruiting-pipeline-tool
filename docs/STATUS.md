# สถานะโปรเจกต์ (handoff — สำหรับเริ่มแชทใหม่)

> อัปเดตล่าสุด: 29 มิ.ย. 2026 · repo: github.com/Kokonattp/recruiting-pipeline-tool (private) · build+deploy (Vercel) ผ่าน
>
> **ล่าสุด:** Google login gate (Supabase Auth), Sourcing fan-out (scraper + Claude web search พร้อมกัน), UI polish (impeccable+LOGA, dark), RLS, PDF token opt (Haiku), poster (gpt-image). **เหลือ: ตั้งค่า key/Supabase/Google ตาม `docs/SETUP.md` → redeploy → e2e → demo.**

## ความคืบหน้า ~90% (อัปเดต)

โค้ดครบ + feature เพิ่มตามภาพ idea เสร็จหมด build ผ่าน — **เหลือแค่เสียบ ENV + deploy + demo video** (ทำเองไม่ได้ ต้องการ key/การกระทำผู้ใช้).

**เพิ่มล่าสุด:** JD Generator (keyword→JD), Search Query Pack, Tracker stat bar + add-candidate modal + LOGA accents (ขอบการ์ดหนา/pill คะแนน/count สี), Screener PDF upload + JD picker, Scheduler Google OAuth + Calendar/Meet จริง + stage sync + cancel, CLAUDE.md/TODO.md.

## ✅ เสร็จแล้ว

- **Stack:** Next.js 16 (App Router, TS) + Supabase (Postgres+Storage+Auth) + Tailwind v4 + Prompt font. Deploy: Vercel (web) + Google Cloud Run (scraper).
- **Module 3 Tracker:** board/list view + drag-drop ย้าย stage (optimistic+persist) + onboarding (ไม่มี mock).
- **Module 1 Sourcing:** wizard 3 step (JD → AI gen query → ranked shortlist → approve เข้า Tracker). `src/modules/scraper/`.
- **Module 2 Screener:** form (paste CV+JD) → Claude score 3 ด้าน + reasoning + prescreen Q → score card. `src/modules/screener/`.
- **Module 4 Scheduler:** form สร้างนัด + agenda + conflict detection (pure fn) + google.ts (Calendar+Meet helper). `src/modules/scheduler/`.
- **Scraper service** (agent ทำ): `scraper/` — Playwright+Express+Docker. WEB(Bing)/JobsDB/JobThai ใช้ได้, LinkedIn/FB/JobBKK stub. **ทดสอบ e2e 29 มิ.ย.: ยิง /scrape จริง → WEB 10 + JobsDB 20 + JobThai 20 = 50 candidate, LinkedIn skip โดยไม่ crash, auth/health ผ่าน** (ดู AI_LOG รอบที่ 6).
- **Wiring DB:** `src/lib/mappers.ts` + queries จริง (tracker/scheduler/jobs) + CRUD actions + `/api/scrape-ingest` + seed JD. graceful empty เมื่อไม่มี env.
- **AI:** ทุกจุดใช้ `lib/claude.structured()` (tool-use + zod), รองรับ PDF (`pdfBlock`). model `claude-opus-4-8`.

## ⏳ เหลือทำ (พรุ่งนี้)

> ✅ **ทำเสร็จแล้ว (29 มิ.ย.)** — UI ที่เคยค้างทำครบ: add-candidate modal, JD picker (Sourcing+Screener), approve→Tracker, Screener PDF upload. scraper ทดสอบยิงจริงแล้ว.

1. **เสียบ ENV** (ดูด้านล่าง) → ลง `.env.local` ← *ต้องการ key จากผู้ใช้*
2. **รัน SQL ใน Supabase:** `supabase/migrations/0001_init.sql` + `0002_seed_job.sql` + สร้าง bucket `resumes` ← *ต้องการ project จากผู้ใช้*
3. **ทดสอบ data จริงไหล** ครบ pipeline (e2e) หลังเสียบ ENV: JD→scrape→rank→approve→tracker→screener→scheduler
4. **Deploy:** Vercel + Cloud Run (`gcloud run deploy` ใน scraper/) + ใส่ env บน Vercel
5. **Demo video ~3 นาที** + อัปเดต README ใส่ live URL

## 🚀 Deploy: 1 repo → 2 service แยก (สำคัญ — เคยงงจุดนี้)

repo เดียวแต่ deploy 2 ที่ เพราะแต่ละเจ้า build จาก **คนละโฟลเดอร์**:

```
recruiting-tool/  (1 repo)
├── src/ + package.json (root)  → Vercel มองตรงนี้ (Next.js)
└── scraper/                    → Cloud Run มองตรงนี้ (Docker)
                                  (อิสระ 100%: มี Dockerfile/package.json/tsconfig เอง,
                                   ไม่ import จาก src/ เลย — verify แล้ว)
```

**Web app → Vercel:**
- New Project → import repo → Root Directory = `/` (default) → ใส่ env ทั้งหมด → Deploy

**Scraper → Google Cloud Run:**
```bash
cd scraper                    # เข้าโฟลเดอร์ scraper ก่อน
gcloud run deploy recruiting-scraper \
  --source .                  # "." = แค่โฟลเดอร์ scraper, ไม่เห็น src/
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars SCRAPER_INGEST_SECRET=<secret ที่ตั้ง>
```
Cloud Run คืน URL → เอาไปใส่ใน Vercel env `SCRAPER_SERVICE_URL=https://...run.app`

**2 ส่วนคุยกันผ่าน HTTP (ไม่ใช่ import โค้ด):**
- Web → Scraper: `fetch(SCRAPER_SERVICE_URL + "/scrape")`
- Scraper → Web: `fetch(APP_URL + "/api/scrape-ingest")`
- auth: `SCRAPER_INGEST_SECRET` ต้องตั้งให้ **ตรงกันทั้ง 2 ฝั่ง**

## 🔑 ENV ที่ต้องการ (ผู้ใช้จะเอามาทีเดียว)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
SCRAPER_INGEST_SECRET=   (ตั้งเอง, ต้องตรงกับฝั่ง scraper service)
SCRAPER_SERVICE_URL=     (URL ของ Cloud Run scraper, หรือ http://localhost:4000 ตอน dev)
```

## กฎการทำงาน (อย่าลืม)

1. **ไม่มี mock/fake data** — data จริงจาก DB เท่านั้น, ว่าง→empty state
2. **วางแผนก่อน** ไม่เปลี่ยน stack/architecture ใหญ่เองกลางทาง
3. **commit ย่อยต่อ feature** ไม่ commit เดียว
4. **อัปเดต md ตลอด** (AI_LOG, ARCHITECTURE, README, STATUS นี้)
5. โค้ดสะอาด แยกชั้น (queries/actions/components) ไม่ spaghetti

## หมายเหตุ tech

- `npx tsc` ต้อง `cd recruiting-tool` ก่อน (ไม่งั้น npx ดึง tsc ผิดตัว)
- `scraper/` ถูก exclude จาก root tsconfig (มี tsconfig เอง)
- build: `npm run build` (Turbopack) — ผ่านล่าสุด
- dev: `npm run dev` → localhost:3000 (redirect → /tracker)
