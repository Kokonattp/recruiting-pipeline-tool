# Recruiting Pipeline Tool — Project Guide

เครื่องมือช่วย HR สรรหาบุคลากรครบวงจร (4 module) ใน codebase เดียว. อ่าน `docs/ARCHITECTURE.md` สำหรับรายละเอียดเต็ม.

> ⚠️ Next.js 16 มี breaking changes จาก training data — อ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด Next-specific.

## สถาปัตยกรรม

```
src/app/        routing + หน้า (UI เท่านั้น ไม่มี business logic)
src/lib/        แกนกลาง: supabase, claude, google, web-search, pdf, openai, auth, types, mappers
src/middleware.ts  auth gate (redirect → /login ถ้าไม่มี session)
src/modules/    business logic แยกตาม module: jobs, scraper, screener, tracker, scheduler
src/components/ UI ใช้ซ้ำ (ui/, sidebar, page-header)
scraper/        service แยก (Playwright+Docker → Cloud Run) — อิสระจาก src/
supabase/       schema SQL migrations
```

## กฎการเขียนโค้ด (ยึดทุก module — กัน spaghetti)

1. **mutation → Server Action เสมอ** (`modules/*/actions.ts`), validate input ด้วย **zod** เสมอ
2. **DB access ผ่าน `modules/*/queries.ts` + `actions.ts`** เท่านั้น — ไม่กระจาย client ใน component
3. **หน้า `app/` เรียก action/query เท่านั้น** — ไม่มี business logic ในหน้า
4. **AI ทุกจุดผ่าน `lib/claude.structured()`** (tool-use + zod) — ไม่รับ free text ที่ไม่ validate
5. **row mapping ที่ `lib/mappers.ts`** เท่านั้น (snake_case ↔ camelCase)
6. **ไม่มี mock/fake data** — data จริงจาก DB, ว่าง → empty state
7. **UI**: design token ใน `globals.css` (OKLCH, light/dark), อ้าง token ไม่ฮาร์ดโค้ดสี. แนว Impeccable (กัน AI-slop) + LOGA accents ที่ board

## 4 Modules

| Module | path | ทำอะไร |
|--------|------|--------|
| 1 Sourcing | `modules/scraper/` + `modules/jobs/` | JD Generator → query plan → **fan-out (scraper + `lib/web-search.ts` พร้อมกัน)** / CSV → AI rank รวม → approve |
| 2 Screener | `modules/screener/` | CV (paste/PDF) + JD → Claude score 3 ด้าน + reasoning + prescreen Q |
| 3 Tracker | `modules/tracker/` | board/list + drag-drop stage + stat bar + CRUD |
| 4 Scheduler | `modules/scheduler/` | Google Calendar+Meet + conflict detection + sync stage |

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # localhost:3000 (redirect → /tracker)
npm run build        # production build (ต้อง cd recruiting-tool ก่อน)
npx tsc --noEmit     # type-check (cd recruiting-tool ก่อน ไม่งั้น npx ดึง tsc ผิดตัว)
```

- `scraper/` ถูก exclude จาก root tsconfig (มี tsconfig เอง)
- type-check ผ่าน + build ผ่าน เป็นเงื่อนไขก่อน commit
- commit ย่อยต่อ feature (ไม่ commit เดียว)

## Deploy

- **Web** → Vercel (root directory `/`)
- **Scraper** → Google Cloud Run (`cd scraper && gcloud run deploy`)
- **DB** → Supabase (รัน `supabase/migrations/*.sql` + bucket `resumes`)
- 2 service คุยกันผ่าน HTTP + `SCRAPER_INGEST_SECRET`. ดู `docs/STATUS.md`.
