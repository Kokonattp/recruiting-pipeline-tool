# Recruiting Pipeline Tool

เครื่องมือช่วยทีม HR จัดการกระบวนการสรรหาบุคลากรครบวงจรใน codebase เดียว — ตั้งแต่ค้นหาผู้สมัคร, คัดกรองด้วย AI, ติดตามสถานะ, ไปจนถึงนัดสัมภาษณ์ — สำหรับการหาผู้สมัครตำแหน่ง **Senior AI Workflow & Automation Engineer**.

> Take-home assignment (Full Stack Developer). รายละเอียดการออกแบบเชิงลึกอยู่ใน [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 4 Modules

| # | Module | ทำอะไร |
|---|--------|--------|
| 1 | **Candidate Data Scraper** | รับ JD → AI สร้าง search query → scrape ผู้สมัครจากหลายแหล่ง (LinkedIn/JobsDB/JobThai/Facebook/Web) → AI normalize + rank → HR review & approve เข้าระบบ |
| 2 | **AI Resume Screener** | upload CV (PDF/text) + เลือก JD → Claude ให้คะแนน 3 ด้าน (Skills/Experience/Culture 0–10) + เหตุผล + คำถาม prescreen → score card |
| 3 | **Applicant Tracker** | CRUD ผู้สมัคร + Kanban board (drag-drop ย้าย stage) + list view + filter ตาม stage/ตำแหน่ง/แหล่งที่มา |
| 4 | **Interview Scheduler** | สร้างนัดผ่าน Google Calendar + Meet link อัตโนมัติ + conflict detection + แก้/ยกเลิก sync กลับ Tracker |

## Tech Stack

- **Next.js 16** (App Router, TypeScript) — full-stack ใน codebase เดียว, Server Actions
- **Supabase** — Postgres (data) + Storage (ไฟล์ CV) + Auth
- **Claude API** (`@anthropic-ai/sdk`) — structured output ผ่าน tool-use
- **Playwright + Docker** — scraper service (deploy แยก)
- **googleapis** — Google Calendar + Meet (conferenceData)
- **Tailwind + impeccable design system** — รองรับ light/dark theme, WCAG AA
- **zod** — validate ทุก input และ AI output

## Architecture (สรุป)

```
WEB APP (Next.js → Vercel)  ──HTTP──►  SCRAPER SERVICE (Playwright+Docker → Cloud Run)
        │ supabase-js
        ▼
SUPABASE (Postgres + Storage + Auth)
```

4 module เชื่อมกันเป็น pipeline เดียวผ่าน data model กลาง (`job_descriptions → candidates → applications → screening_results / interviews`). รายละเอียด data flow + เหตุผลการเลือก stack: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Setup

### ความต้องการ
- Node.js 20+
- บัญชี Supabase, Anthropic API key, Google Cloud OAuth credentials

### ขั้นตอน

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า environment variables
cp .env.example .env.local
# แล้วเติมค่าใน .env.local (ดูตารางด้านล่าง)

# 3. สร้าง schema ใน Supabase
#    รัน SQL ใน supabase/migrations/ ผ่าน Supabase SQL Editor (หรือ supabase CLI)

# 4. รัน dev server
npm run dev
# เปิด http://localhost:3000
```

### Environment variables

| ตัวแปร | ใช้ทำอะไร |
|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (server actions) |
| `ANTHROPIC_API_KEY` | Claude API (Module 1, 2) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (Module 4) |
| `SCRAPER_INGEST_SECRET` | shared secret ให้ scraper push ข้อมูลเข้า app |

## Scraper service (Module 1)

อยู่ใน `scraper/` — เป็น service แยก (Playwright + Docker) เพราะ headless browser รันบน Vercel serverless ไม่ได้. deploy บน **Google Cloud Run** (ใช้ Google account เดียวกับ Calendar API ใน Module 4). ดูวิธีรันใน `scraper/README.md`.

## โครงสร้างโปรเจกต์

```
src/lib/         แกนกลาง (supabase, claude, google, types) ใช้ร่วมทุก module
src/modules/     business logic แยกตาม 4 module
src/components/  UI ใช้ซ้ำ (design system)
src/app/         routing + หน้าจอ
scraper/         service scrape แยก (Playwright + Docker)
supabase/        schema migrations
docs/            ARCHITECTURE.md, PLAN_AND_ESTIMATE.md
AI_LOG.md        บันทึกการทำงานกับ AI
```

## Architecture Decisions (ย่อ)

- **supabase-js แทน ORM** — ลดชั้น setup, ได้ Storage/Auth ในตัว, local = prod ลดความเสี่ยง deploy
- **Scraper แยกเป็น service** — Playwright ต้องการ browser จริง, แยกออกทำให้ web app ขึ้น Vercel ได้สะอาด
- **AI ผ่าน tool-use (ไม่ใช่ free text)** — บังคับ structured output, validate ด้วย zod กัน hallucination พังระบบ
- **Design system (impeccable) + dark mode** — token เดียวทั้งระบบ กัน UI ไม่สม่ำเสมอ / AI-slop

_(เอกสารนี้จะอัปเดตเมื่องานคืบ — รวม live URL ตอน deploy)_
