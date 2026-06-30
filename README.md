# Recruiting Pipeline Tool

เครื่องมือช่วยทีม HR จัดการกระบวนการสรรหาบุคลากรครบวงจรใน codebase เดียว — ตั้งแต่ค้นหาผู้สมัคร, คัดกรองด้วย AI, ติดตามสถานะ, ไปจนถึงนัดสัมภาษณ์ — สำหรับการหาผู้สมัครตำแหน่ง **Senior AI Workflow & Automation Engineer**.

> Take-home assignment (Full Stack Developer). รายละเอียดการออกแบบเชิงลึกอยู่ใน [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 4 Modules

| # | Module | ทำอะไร |
|---|--------|--------|
| 1 | **Candidate Data Scraper** | รับ JD → AI สร้าง search query → **คลิกเดียว ยิงทุกแหล่งพร้อมกัน** (scraper เว็บไซต์งาน + Claude web search) → AI normalize + rank รวม → HR review & approve เข้าระบบ |
| 2 | **AI Resume Screener** | upload CV (PDF/text) + เลือก JD → Claude ให้คะแนน 3 ด้าน (Skills/Experience/Culture 0–10) + เหตุผล + คำถาม prescreen → score card |
| 3 | **Applicant Tracker** | CRUD ผู้สมัคร + Kanban board (drag-drop ย้าย stage) + list view + filter ตาม stage/ตำแหน่ง/แหล่งที่มา |
| 4 | **Interview Scheduler** | สร้างนัดผ่าน Google Calendar + Meet link อัตโนมัติ + conflict detection + แก้/ยกเลิก sync กลับ Tracker |

## Tech Stack

- **Next.js 16** (App Router, TypeScript) — full-stack ใน codebase เดียว, Server Actions, middleware auth gate
- **Supabase** — Postgres (data, RLS) + Storage (ไฟล์ CV) + **Auth (Google login)**
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
npm install
cp .env.example .env.local   # เติมค่า (ดู docs/SETUP.md)
# รัน SQL ใน supabase/migrations/ (0001, 0002, 0003, 0004) + สร้าง bucket resumes
npm run dev                  # http://localhost:3000
```

> 📖 **คู่มือตั้งค่าเต็ม (Supabase, Google login, Calendar OAuth, deploy) อยู่ใน [`docs/SETUP.md`](docs/SETUP.md)** — ทำตามทีละ STEP

### Environment variables

| ตัวแปร | ใช้ทำอะไร |
|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (server actions) |
| `ANTHROPIC_API_KEY` | Claude API (Module 1, 2) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (Module 4) |
| `GOOGLE_REDIRECT_URI` | Calendar OAuth callback URL |
| `SCRAPER_INGEST_SECRET` | shared secret ให้ scraper push ข้อมูลเข้า app |
| `SCRAPER_SERVICE_URL` | Cloud Run scraper URL (optional, for JobsDB/JobThai) |
| `ENABLE_APIFY` / `APIFY_TOKEN` | LinkedIn/Facebook via Apify (optional, off by default) |
| `OPENAI_API_KEY` | Hiring poster generation (optional) |

## Scraper service (Module 1)

อยู่ใน `scraper/` — เป็น service แยก (Playwright + Docker) เพราะ headless browser รันบน Vercel serverless ไม่ได้. deploy บน **Google Cloud Run** (ใช้ Google account เดียวกับ Calendar API ใน Module 4). ดูวิธีรันใน `scraper/README.md`.

**สถานะแหล่งข้อมูล (ทดสอบยิงจริงแล้ว):**

| แหล่ง | สถานะ | หมายเหตุ |
|------|------|---------|
| WEB (Bing) | ✅ live | ทดสอบ: คืน 10 ผลจริง |
| JobsDB | ✅ live | ทดสอบ: คืน 20 job posting จริง |
| JobThai | ✅ live | ทดสอบ: คืน 20 ผลจริง |
| LinkedIn / Facebook / JobBKK | 🔶 stub โดยตั้งใจ | ต้อง auth session + ติด ToS — ระบุชัดใน code, คืน `[]` ไม่ crash |

> ออกแบบให้ source แยกไฟล์ละแหล่ง + per-source try/catch — แหล่งหนึ่งโดน anti-bot block จะคืน `[]` ไม่ล้มทั้ง request. (รายละเอียดการทดสอบ e2e: [`AI_LOG.md`](AI_LOG.md) รอบที่ 6)

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
