# สถานะโปรเจกต์ (handoff — สำหรับเริ่มแชทใหม่)

> อัปเดตล่าสุด: 1 ก.ค. 2026 · repo: github.com/Kokonattp/recruiting-pipeline-tool (private) · build+deploy (Vercel) ผ่าน
>
> **ล่าสุด:** UX polish ครบทุก module — spinner ทุกปุ่ม async, poster persist ลง DB, JD manager edit/delete/poster, PDF resume intake, beforeunload guard ระหว่างค้นหา, perf tuning (web search + image generation)

## ความคืบหน้า ~98%

โค้ดครบ + feature เพิ่มตามภาพ idea เสร็จหมด build ผ่าน — **เหลือแค่ demo video + รัน migration SQL ใน Supabase**

## ✅ เสร็จแล้ว

### Stack & Infrastructure
- **Stack:** Next.js 16 (App Router, TS) + Supabase (Postgres+Storage+Auth) + Tailwind v4 + Prompt font. Deploy: Vercel (web) + Google Cloud Run (scraper)
- **Auth:** Google login gate ผ่าน Supabase Auth, middleware try/catch กัน Vercel edge crash ตอน session หมด

### Module 1 — Candidate Sourcing
- Wizard 3 step: JD → AI query plan → ranked shortlist → approve เข้า Tracker
- **JD Generator:** keyword → Claude Sonnet สร้าง JD ฉบับเต็ม + spinner + skeleton loading
- **JD Manager tab:** list/edit/delete JD ที่บันทึกไว้, inline edit form (title/dept/level/skills/fulltext)
- **PDF Resume Intake:** drag & drop PDF → Claude อ่านแต่ละไฟล์ parallel (Promise.allSettled) → rank → approve
- **Hiring Poster:** gpt-image-2 medium quality 1024×1024, persist base64 ลง DB (poster_base64 column), overlay skills chips + contact จาก JD จริง บน AI background, download ได้
- **Source toggle:** LOGA style (border-2 + shadow)
- **JD textarea:** max-height 280px + resize-y กัน textarea ยาวผลักปุ่มออกนอกหน้าจอ
- **beforeunload guard:** เตือนก่อนออกจากหน้าขณะค้นหาอยู่
- **Performance:** web_search max_uses 8→4, rank top 20 candidates, maxTokens 8000→4000

### Module 2 — Screener
- Form paste CV + JD → Claude Sonnet score 3 ด้าน (skills/exp/culture) + reasoning + prescreen Q
- PDF upload ผ่าน Supabase Storage + `pdfBlock()` ให้ Claude อ่านโดยตรง
- JD picker จาก saved jobs

### Module 3 — Tracker
- Kanban board + list view + drag-drop ย้าย stage (optimistic+persist)
- Stat bar (สรุป pipeline progress)
- Add/delete candidate modal
- Onboarding hero: LOGA card style (เหลือง+ดำ)

### Module 4 — Scheduler
- Form สร้างนัด + Google Calendar + Meet link จริง
- Conflict detection (pure function)
- Reschedule / cancel interview
- View toggle (calendar/list): LOGA style
- Empty state: LOGA dashed card

### UX / Design
- **Spinner ทุกปุ่ม async:** Screener (ประเมิน), Tracker dialog (บันทึก), Scheduler (สร้างนัด, ยืนยันเวลาใหม่), PDF Import (จัดอันดับ, อนุมัติ), JD Manager (บันทึก), Sourcing (ค้นหา, เริ่มค้น)
- **LOGA cards** ครบทุก module: border-2 border-ink + shadow-[Xpx_Xpx_0px_0px_var(--ink)]
- Brand: Hotel Plus เหลือง+ดำ, design token OKLCH, dark mode

### AI Model Tiering
- **Opus 4.8:** rank candidates + web search (judgment ยาก)
- **Sonnet 4.6:** JD gen, query plan, screen CV (content/structure)
- ทุก AI output ผ่าน `structured()` + zod validate

### DB Migrations
| Migration | สิ่งที่เพิ่ม |
|-----------|------------|
| 0001_init.sql | schema หลัก (job_descriptions, candidates, applications, screening_results, interviews) |
| 0002_seed_job.sql | seed JD ตัวอย่าง |
| 0003_enable_rls.sql | Row Level Security |
| 0004_screening_confidence.sql | confidence + recommendation columns |
| 0005_job_poster.sql | poster_base64 column ใน job_descriptions |

## ⏳ เหลือทำ

1. **รัน migration 0005** ใน Supabase SQL Editor:
   ```sql
   alter table job_descriptions add column if not exists poster_base64 text;
   ```
2. **Demo video ~3 นาที** — M1→M3→M2→M4 happy path (ต้องทำเอง)

## 🚀 Deploy: 1 repo → 2 service

```
recruiting-tool/
├── src/ + package.json  → Vercel (Next.js)
└── scraper/             → Google Cloud Run (Docker + Playwright)
```

**Web app → Vercel:** Root Directory = `/` → ใส่ env → Deploy

**Scraper → Cloud Run:**
```bash
cd scraper
gcloud run deploy recruiting-scraper --source . --region asia-southeast1 --allow-unauthenticated --set-env-vars SCRAPER_INGEST_SECRET=<secret>
```

## 🔑 ENV ที่ต้องการ

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
SCRAPER_INGEST_SECRET=
SCRAPER_SERVICE_URL=
```

## กฎการทำงาน

1. ไม่มี mock/fake data — data จริงจาก DB เท่านั้น, ว่าง→empty state
2. commit ย่อยต่อ feature ไม่ commit เดียว
3. `npx tsc` ต้อง `cd recruiting-tool` ก่อน
4. `scraper/` ถูก exclude จาก root tsconfig (มี tsconfig เอง)
