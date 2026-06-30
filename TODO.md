# TODO

## เสร็จแล้ว ✅
- [x] 4 module ครบ (Sourcing/Screener/Tracker/Scheduler) UI + logic + AI
- [x] **Google login gate** (Supabase Auth + middleware) — ทั้งแอปต้อง login ก่อน
- [x] JD Generator (keyword → JD ด้วย Claude) + **แก้ JD ได้ก่อนบันทึก**
- [x] **Sourcing one-click fan-out**: scraper + AI web search (Claude) ยิงพร้อมกัน → rank รวม
- [x] Scraper service (Playwright+Docker) — WEB/JobsDB/JobThai **ทดสอบยิงจริงแล้ว (50 candidate)**
- [x] Tracker: board/list + drag-drop stage + stat bar + **เพิ่ม/แก้ไข/ลบ ครบ CRUD**
- [x] Screener: paste/PDF CV (extract text + Sonnet 4.6) + score 3 ด้าน + **Report PDF** + **กัน vibe-check (temp 0 + anchored rubric + confidence + band ไม่ใช่ cutoff)**
- [x] Scheduler: Google Calendar/Meet จริง + conflict + stage sync + **reschedule**
- [x] CSV import ในหน้า Sourcing (intake path ที่ไม่ติด anti-bot)
- [x] JD → hiring poster image (OpenAI gpt-image-1, optional)
- [x] **UI polish**: impeccable + LOGA accents (hero empty state, การ์ดขอบหนา/เงาแข็ง, hue pills, module icons), dark mode
- [x] **Rebrand Hotel Plus**: เหลือง+ดำ, H+ logo + favicon, sidebar พื้นดำ, nav เรียง 1→2→3→4, dark-mode readability
- [x] **AI model tiering**: Opus เฉพาะ rank+websearch / Sonnet 4.6 = JD+query+screen (คุม cost)
- [x] **Security: RLS** ทุกตาราง (0003) — ปิด public API
- [x] wiring DB (queries/CRUD/ingest/approve/persist) — build + type-check + lint ผ่าน
- [x] docs: README, ARCHITECTURE, AI_LOG, STATUS, CLAUDE.md, **SETUP.md**

## เหลือทำ (ต้องการ ENV / การกระทำของผู้ใช้) — ทำแทนไม่ได้
> 📖 ทุก step ละเอียดอยู่ใน **`docs/SETUP.md`**

- [ ] STEP 1: Supabase — รัน SQL `0001` + `0002` + `0003` + `0004` + bucket `resumes`
- [ ] STEP 2: env บน Vercel (Supabase + Anthropic) — ⚠️ URL ห้ามมี `/rest/v1/`
- [ ] STEP 3: เปิด Google provider ใน Supabase (login gate)
- [ ] STEP 4: Google Calendar OAuth (Module 4)
- [ ] ทดสอบ e2e ครบ pipeline + เติม AI_LOG (Module 2 prompt iteration จริง)
- [ ] Deploy scraper service บน Cloud Run (optional, JobsDB/JobThai) — ดู `docs/SETUP.md` STEP 7
- [ ] เปิด Apify สำหรับ LinkedIn/Facebook (optional, pay-per-event) — ดู `docs/SETUP.md` STEP 5
- [ ] อัปเดต README ใส่ live URL หลัง deploy
- [ ] Demo video ~3 นาที (ใส่ candidate จริงให้ board เต็มก่อนอัด)

## วิธีทำ optional ที่ยังเลือกไว้

### Deploy scraper service (Cloud Run)
1. ติดตั้ง/ล็อกอิน `gcloud` และเลือก Google Cloud project เดียวกับ Calendar API
2. เปิด service: `run.googleapis.com` และ `cloudbuild.googleapis.com`
3. รัน deploy จากโฟลเดอร์ `scraper/` พร้อม `SCRAPER_INGEST_SECRET`
4. เอา Cloud Run Service URL ไปใส่ Vercel env `SCRAPER_SERVICE_URL`
5. ใส่ `SCRAPER_INGEST_SECRET` ค่าเดียวกันใน Vercel แล้ว redeploy
6. เช็ก `/health` และทดสอบ Sourcing โดยเลือก JobsDB/JobThai

### เปิด Apify (LinkedIn/Facebook)
1. สมัคร/เข้า Apify แล้ว copy Personal API token
2. ใส่ Vercel env `ENABLE_APIFY=true` และ `APIFY_TOKEN=<token>`
3. ถ้าต้อง override LinkedIn actor ให้ใส่ `APIFY_LINKEDIN_ACTOR`
4. Redeploy Vercel
5. ตอนใช้ LinkedIn เลือก source LinkedIn ใน Sourcing; ตอนใช้ Facebook ต้องใส่ group URL
6. หลัง demo แนะนำปิด `ENABLE_APIFY` เพราะ actor คิดเงินต่อครั้ง

## ตัดแล้ว (ไม่ทำ — เหตุผล)
- JobBKK scrape — ต้อง employer login, stub ไว้พร้อมคำอธิบาย
