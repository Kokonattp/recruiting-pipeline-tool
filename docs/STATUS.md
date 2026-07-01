# สถานะโปรเจกต์ (handoff — สำหรับเริ่มแชทใหม่)

> อัปเดตล่าสุด: 1 ก.ค. 2026 · repo: github.com/Kokonattp/recruiting-pipeline-tool (private) · build+deploy (Vercel) ผ่าน
>
> **ล่าสุด:** แก้ bug production ร้ายแรง — sub-attribute schema (`minItems: 3`) ทำให้ Claude API ปฏิเสธ request ด้วย 400 ทุกครั้ง (Screener ใช้งานไม่ได้เลยทั้งระบบ) แก้แล้ว deploy แล้ว ยืนยันใช้งานได้จริง

## ความคืบหน้า 100% — งานส่งครบแล้ว

โค้ดครบ + feature เพิ่มตามภาพ idea เสร็จหมด build ผ่าน + migration 0005–0007 รันครบบน production Supabase + demo video ส่งเรียบร้อย + production bug ล่าสุด (Claude tool schema 400) แก้และ verify แล้ว ไม่มีงานค้าง.

## ✅ เสร็จแล้ว

### Stack & Infrastructure
- **Stack:** Next.js 16 (App Router, TS) + Supabase (Postgres+Storage+Auth) + Tailwind v4 + Prompt font. Deploy: Vercel (web) + Google Cloud Run (scraper)
- **Auth:** Google login gate ผ่าน Supabase Auth, middleware try/catch กัน Vercel edge crash ตอน session หมด

### Module 1 — Candidate Sourcing
- Wizard 3 step: JD → AI query plan → ranked shortlist → approve เข้า Tracker
- **JD Generator:** keyword → Claude Sonnet สร้าง JD ฉบับเต็ม + spinner + skeleton loading
- **JD Manager tab:** list/edit/delete JD ที่บันทึกไว้, inline edit form (title/dept/level/skills/fulltext)
- **PDF Resume Intake:** drag & drop PDF (จำกัด 5MB/ไฟล์, รวม 7MB) → Claude อ่านแต่ละไฟล์ parallel (Promise.allSettled) → rank → approve
- **rankCandidates (ใช้ร่วมกัน CSV/PDF/live sourcing):** ห้าม AI ตัดผู้สมัครออกจาก shortlist เด็ดขาด — คะแนนต่ำได้ (fitScore <20 + เหตุผลใน concerns) แต่ทุกคนต้องปรากฏใน output เสมอ ให้ HR เห็นและตัดสินใจเอง ไม่ใช่ AI ซ่อนคนออกอย่างเงียบ ๆ
- **Source toggle:** LOGA style (border-2 + shadow)
- **JD textarea:** max-height 280px + resize-y กัน textarea ยาวผลักปุ่มออกนอกหน้าจอ
- **beforeunload guard:** เตือนก่อนออกจากหน้าขณะค้นหาอยู่
- **Performance:** web_search max_uses 8→4, rank top 20 candidates, maxTokens 8000→4000

### Module 2 — Screener
- Form paste CV + JD → Claude Sonnet score 3 ด้าน (skills/exp/culture) + reasoning + prescreen Q
- **Score card:** radar triangle (SVG, zero-dependency) สรุปภาพรวม 3 แกนเป็นรูปทรงเดียว ก่อนอ่านการ์ดรายละเอียด + สีเปลี่ยนแดงอัตโนมัติถ้าทุกแกนต่ำ (ไม่ตรงสายชัดเจน) — ไม่พิมพ์ลง PDF report (เน้นข้อความ)
- **Sub-attribute breakdown (FM attribute-sheet style):** แต่ละแกนมี 3 sub-attribute (0-10) อธิบายว่าทำไมถึงได้คะแนนนั้น — Skills เป็น label แบบ dynamic ตาม must-have ของ JD, Experience/Culture เป็น label คงที่ (Seniority/Scope, Domain Match, Track Record · Collaboration, Communication, Leadership/Mentorship) ให้คะแนนโดย AI อิสระจากคะแนนแกนหลัก (ไม่ใช่ที่มาของคะแนนรวม) — ผลเก่าก่อน migration 0007 ไม่มี breakdown นี้ (แสดงแค่การ์ดปกติ)
- PDF upload ส่งเป็น base64 ตรงผ่าน Server Action — extract text ก่อนด้วย `pdf-parse` (ถูกกว่า), fallback เป็น Claude native PDF read (`pdfBlock()`) เฉพาะ CV แบบ scan/รูป
- JD picker จาก saved jobs
- เลือกผู้สมัครจาก dropdown → ผล screening บันทึกเข้าโปรไฟล์นั้นอัตโนมัติพร้อมกับประเมิน (ปุ่มเดียว), มี banner ยืนยันชัดเจนหลังบันทึกสำเร็จ vs โหมดทดสอบ (ไม่ผูกใคร = ไม่บันทึก)
- Body size limit 10MB (`next.config.ts`) + client-side guard กันไฟล์ใหญ่เกินก่อนอัปโหลด (CV เดี่ยว 7MB, PDF batch import 5MB/ไฟล์)

### Module 3 — Tracker
- Kanban board + list view + drag-drop ย้าย stage (optimistic+persist)
- Stat bar (สรุป pipeline progress)
- Add/delete candidate modal
- Onboarding hero: LOGA card style (เหลือง+ดำ)
- **Filter bar ครบตาม requirement:** ค้นหาชื่อ, filter ตาม Stage, ตำแหน่งงาน (job), แหล่งที่มา + ปุ่มล้างตัวกรอง

### Module 4 — Scheduler
- Form สร้างนัด + Google Calendar + Meet link จริง
- Conflict detection (pure function)
- Reschedule / cancel interview
- View toggle (calendar/list): LOGA style
- Empty state: LOGA dashed card

### UX / Design
- **Spinner ทุกปุ่ม async:** Screener (ประเมิน), Tracker dialog (บันทึก), Scheduler (สร้างนัด, ยืนยันเวลาใหม่), PDF Import (จัดอันดับ, อนุมัติ), JD Manager (บันทึก), Sourcing (ค้นหา, เริ่มค้น)
- **Inline confirm dialog** แทน `window.confirm` ทุกที่ (JD Manager ลบ JD, Tracker ลบผู้สมัคร) — LOGA style dropdown
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
| 0005_job_poster.sql | poster_base64 column (migration ยังอยู่ใน DB แต่ feature ถูกปิดแล้ว) — รันบน production แล้ว |
| 0006_sourcing_shown.sql | ตาราง `sourcing_shown` (dedupe candidate ที่เคยแสดงแล้ว) — รันบน production แล้ว |
| 0007_screening_sub_attributes.sql | `screening_results.sub_attributes` (jsonb, default `'{}'`) — FM-style breakdown ต่อแกน — รันบน production แล้ว |

## 📊 ประเมินคะแนน (self-audit)

| เกณฑ์ | คะแนน | หมายเหตุ |
|--------|:-----:|---------|
| Feature Completeness 30% | **30/30** | ครบ 4 module + filter stage/position/source/search ครบ + Scheduler แนบ prescreen Q ลง Calendar |
| Code Quality & Architecture 30% | **27/30** | แยกชั้น actions/queries/components, zod ทุก input/AI output, commit ย่อย, naming ชัด |
| UX & Usability 25% | **23/25** | spinner ทุกปุ่ม, inline confirm, empty states, LOGA consistent, beforeunload guard |
| AI Integration 15% | **14/15** | tool-use + zod ทุกจุด, model tiering (Opus/Sonnet), web search จริง, screen 3 ด้าน + reasoning + prescreen Q |
| **รวม** | **~94/100** | ครบทุกส่วนรวม demo video — คะแนนที่เหลือขึ้นกับกรรมการประเมิน ไม่ใช่งานค้างฝั่งเรา |

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
