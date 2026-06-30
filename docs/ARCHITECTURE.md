# Architecture & Data Model — Recruiting Pipeline Tool

> เอกสารนี้คือ "การวางโครง" ของระบบ ก่อนเขียนโค้ด — ตอบเกณฑ์ **Code Quality & Architecture (30%)** ของโจทย์โดยตรง
> (Structure ชัด, naming อ่านได้, ไม่มี spaghetti code). เนื้อหาสรุปจะถูกย่อลง README.md ตอนส่ง.

## 1. ภาพรวม — รันที่ไหน

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  WEB APP  (Next.js 16)       │  HTTP  │  SCRAPER SERVICE (Docker)    │
│  • หน้าจอ HR + 4 module       │ ─────► │  • Playwright headless        │
│  • Server Actions / API       │ ◄───── │  • POST /scrape  → push DB    │
│  • เรียก Claude + Google API  │ ingest │  • shared secret auth         │
│  Git → Vercel (URL จริง)      │        │  Deploy: Google Cloud Run     │
└──────────────┬───────────────┘        └──────────────────────────────┘
               │ supabase-js
               ▼
      ┌────────────────────────────────────┐
      │  SUPABASE (cloud)                   │
      │  • Postgres (data)                  │
      │  • Storage (ไฟล์ CV)                │
      │  • Auth (login HR — ถ้าเปิดใช้)      │
      └────────────────────────────────────┘
```

**หลักการ:** ทุกอย่างอยู่บน cloud, free tier, push git → deploy อัตโนมัติ. Scraper แยกออกเพราะ Playwright รันบน Vercel serverless ไม่ได้ (browser หนัก + เกิน timeout).

## 2. Stack (ตัดสินใจแล้ว)

| ชั้น | เลือก | เหตุผล (เขียนลง README) |
|------|-------|------------------------|
| Framework | **Next.js 16 (App Router, TS)** | full-stack ใน codebase เดียวตามโจทย์, Server Actions ลด boilerplate API |
| Data | **supabase-js + Supabase Postgres** | DB + Storage(CV) + Auth ในเจ้าเดียว, ไม่ต้องตั้ง ORM/adapter |
| AI | **Claude API (@anthropic-ai/sdk)** | structured output ผ่าน tool-use, รุ่นล่าสุดตาม /claude-api |
| Scraper | **Playwright + Docker** | คุม session login, deploy แยกเป็น service |
| Calendar | **googleapis (OAuth + Calendar)** | สร้าง event + Meet link อัตโนมัติผ่าน conferenceData |
| UI | **Tailwind + impeccable design system + dark mode** | design token เดียวทั้งระบบ, รองรับ light/dark |
| Validation | **zod** | validate ทุก input/AI output — กัน runtime error |

## 3. Data Model (Postgres — Supabase)

ตารางกลางที่เชื่อม 4 module เป็น pipeline เดียว (ไม่ใช่ 4 หน้าแยก):

```
job_descriptions   id, title, department, seniority, raw_text,
                   required_skills[], nice_to_have[], created_at
candidates         id, name, email, phone, source(enum), source_url, headline,
                   raw_profile(jsonb), normalized(jsonb),
                   review_status(enum: pending|approved|rejected), created_at
applications       id, candidate_id→, job_id→, stage(enum), applied_at, source_tag
                   UNIQUE(candidate_id, job_id)      ← pipeline state ต่อ 1 ตำแหน่ง
scrape_runs        id, job_id→, query, source(enum), status(enum),
                   found_count, error, created_at     ← audit ของ Module 1
screening_results  id, application_id→ (unique), skills_fit, exp_fit, culture_fit (0-10),
                   reasoning(jsonb), strengths[], prescreen_questions[],
                   summary, model, created_at         ← output ของ Module 2
interviews         id, application_id→, scheduled_at, duration_min,
                   google_event_id, meet_link, status(enum), notes, created_at

enum stage   : APPLIED → SCREENING → PRESCREEN_CALL → FIRST_INTERVIEW → OFFER → HIRED / REJECTED
enum source  : LINKEDIN | JOBSDB | JOBBKK | JOBTHAI | FACEBOOK | WEB | REFERRAL | MANUAL
```

**เส้นเลือดของระบบ (data flow):**
```
Module 1 Scraper  → สร้าง candidate (review_status=pending)
HR approve        → สร้าง application (stage=APPLIED)
Module 2 Screener → สร้าง screening_result ผูกกับ application
Module 3 Tracker  → ย้าย application.stage
Module 4 Scheduler→ สร้าง interview แล้ว sync application.stage กลับ
```

## 4. โครงโค้ด (กัน spaghetti — แยกชั้น UI / logic / data)

```
recruiting-tool/
├── PRODUCT.md / DESIGN.md          ← design system context (impeccable)
├── docs/ARCHITECTURE.md            ← ไฟล์นี้
├── AI_LOG.md                       ← บันทึกการทำงานกับ AI (bonus ของโจทย์)
├── README.md                       ← setup + architecture decision (บังคับ)
├── supabase/migrations/*.sql       ← schema (version-controlled)
├── src/
│   ├── lib/                        ← แกนกลาง ใช้ร่วมทุก module
│   │   ├── supabase.ts             client (server + browser)
│   │   ├── claude.ts               Claude API + structured-output helper
│   │   ├── google.ts               OAuth + Calendar/Meet
│   │   └── types.ts                shared types (จาก DB schema)
│   ├── modules/                    ← business logic แยกตาม 4 module
│   │   ├── tracker/   (actions.ts, queries.ts, types.ts)
│   │   ├── screener/  (actions.ts, prompt.ts, types.ts)
│   │   ├── scraper/   (actions.ts, ranking.ts, types.ts)
│   │   └── scheduler/ (actions.ts, conflict.ts, types.ts)
│   ├── components/ui/              ← UI ใช้ซ้ำ (button, card, pill, badge) — design system
│   └── app/                        ← routing + หน้าจอเท่านั้น (ไม่มี business logic)
│       ├── (dashboard)/tracker | screener | scraper | scheduler /page.tsx
│       └── api/scrape-ingest/route.ts   ← endpoint ให้ scraper ยิงผลเข้ามา
└── scraper/                        ← service แยก (Playwright + Docker)
    ├── sources/{linkedin,jobsdb,jobthai,jobbkk,facebook,web}.ts  ← pluggable
    ├── server.ts                   ← POST /scrape
    └── Dockerfile
```

**กฎที่ยึดทุก module (consistency = ไม่ spaghetti):**
- mutation → **Server Action** เสมอ; validate input/AI output ด้วย **zod** เสมอ
- หน้า `app/` เรียก action เท่านั้น — ไม่มี logic ในหน้า
- ดึง UI จาก `components/ui` เดียว — ไม่ต่างหน้าต่างสไตล์
- naming: ภาษาอังกฤษ, ชัดเจน, ไฟล์ตามหน้าที่ (`actions` / `queries` / `prompt` / `conflict`)

## 5. Dark theme

design token เป็น CSS variable (OKLCH) สอง set: `:root` (light) + `[data-theme="dark"]`.
ทุก component อ้าง token เท่านั้น (ไม่ฮาร์ดโค้ดสี) → สลับ theme = สลับ data-attribute. มี toggle + จำค่าใน localStorage + เคารพ `prefers-color-scheme`.

## 6. Module 1 — Sourcing Flow & Streaming Logic

### ขั้นตอน

```
HR กรอก JD → สร้าง query plan (Claude) → เริ่มค้นหา → แสดงผล realtime → rank → อนุมัติ
```

### Streaming Architecture (`/api/sourcing-stream` — SSE)

การค้นหาไม่ใช่ Server Action ธรรมดา แต่เป็น **Route Handler ที่ stream ผ่าน SSE** เพราะต้องส่ง candidate กลับมาทีละคนขณะที่แต่ละ source ยังทำงานอยู่

```
Client (sourcing-flow.tsx)
  POST /api/sourcing-stream
  ├── read SSE stream
  │     data: { type: "raw", source, candidates[] }   ← แสดงทันที
  │     data: { type: "ranking" }                      ← spinner
  │     data: { type: "ranked", shortlist[] }          ← เปลี่ยนหน้า
  │     data: { type: "error", message }
  │     data: { type: "done" }
  └── render ทุก chunk ทันที ไม่รอ response เสร็จ

Server (route.ts)
  ├── fan-out ทุก source พร้อมกัน (Promise.all)
  ├── แต่ละ source: withTimeout(sourceCall, 20s)
  ├── handleSource() → dedup → push raw[] → send "raw" event → check earlyExit
  └── race: earlyExit vs Promise.all(tasks)
```

### Early-Exit Logic

```
ได้ candidate ≥ 5 คน (dedup แล้ว)
  → earlyResolve() fires
  → Promise.race ออกทันที
  → rank ทันที ไม่รอ source ที่เหลือ

ยังไม่ครบ 5 คน
  → รอ Promise.all(tasks) — ทุก source ตอบหรือ timeout ภายใน 20s
  → rank ด้วยทุกคนที่หาได้

source ไหน timeout หรือ error
  → send { type: "sourceError" } แล้วไปต่อ (ไม่ล้ม flow)
```

### ขอบเขตเวลา (Vercel Hobby — limit 60s)

| ขั้นตอน | เวลาสูงสุด |
|---------|-----------|
| Query plan (Claude) | ~5s |
| Source fan-out | 20s (per-source timeout) |
| Rank (Claude) | ~10s |
| รวม worst-case | ~35s ✅ |

## 7. AI Integration (เกณฑ์ 15% — prompt ดี, structured, ไม่ generic)

- **Module 2 (หัวใจ):** Claude ให้คะแนน 3 ด้าน + reasoning ผ่าน **tool-use schema** (บังคับ JSON เป๊ะ) ไม่ใช่ free text. iterate prompt กับ CV จริง บันทึกลง AI_LOG.md
- **Module 1:** Claude แปลง JD → search query ต่อแหล่ง, และ normalize+rank candidate พร้อมเหตุผล
- ทุก AI output ผ่าน zod validate ก่อนเข้า DB → กัน hallucination พังระบบ

### Scraper service — ความจริงของแต่ละแหล่ง (honest)

อยู่ใน `scraper/` (service แยก Playwright+Docker, deploy Google Cloud Run). source แบบ pluggable (1 ไฟล์/แหล่ง) ถ้าตัวไหนพัง try/catch แยกไม่ล้มทั้ง request.

| Source | สถานะ | หมายเหตุ |
|--------|-------|----------|
| WEB | ✅ ใช้ได้ | ใช้ **Bing** (Google บล็อก headless หนัก) |
| JOBSDB / JOBTHAI | ✅ ใช้ได้ | เป็น public job board → ได้ job posting เป็น lead (ฝั่ง public ไม่ใช่ open CV database) |
| LINKEDIN / FACEBOOK | 🔶 optional API | ใช้ Apify/Web Search; ถ้าไม่ตั้ง token จะ skip โดยไม่ล้ม flow และไม่เก็บ cookie ผู้ใช้ |
| JOBBKK | ⏸ stub | candidate search ต้อง employer login |

> ความจริงของ anti-bot: เว็บเปลี่ยน markup/rate-limit/CAPTCHA ได้ — selector เป็น best-effort. การแยก source + try/catch + timeout คือ design ที่รับมือกับความจริงนี้.

## 7. Deliverables (จากโจทย์ — เช็กให้ครบ)

| ส่ง | สถานะ | ที่อยู่ |
|-----|-------|--------|
| GitHub repo + commit history อ่านได้ | ✅ | commit ย่อยต่อ feature |
| README.md (setup + architecture decision) | ✅ | `/README.md` |
| Demo video ~3 นาที ครบ 4 module | ⏳ | อัดท้ายงาน |
| AI Log (.md บันทึกการทำงานกับ AI) | ✅ | `/AI_LOG.md` |
| Live URL (free tier) | ✅ | Vercel + Supabase |
