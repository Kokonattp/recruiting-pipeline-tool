# TODO

## เสร็จแล้ว ✅
- [x] 4 module ครบ (Sourcing/Screener/Tracker/Scheduler) UI + logic + AI
- [x] **Google login gate** (Supabase Auth + middleware) — ทั้งแอปต้อง login ก่อน
- [x] JD Generator (keyword → JD ด้วย Claude) + **แก้ JD ได้ก่อนบันทึก**
- [x] **Sourcing one-click fan-out**: scraper + AI web search (Claude) ยิงพร้อมกัน → rank รวม
- [x] Scraper service (Playwright+Docker) — WEB/JobsDB/JobThai **ทดสอบยิงจริงแล้ว (50 candidate)**
- [x] Tracker: board/list + drag-drop stage + stat bar + **เพิ่ม/แก้ไข/ลบ ครบ CRUD**
- [x] Screener: paste/PDF CV (extract text + Haiku, ลด token) + score 3 ด้าน + **Report PDF**
- [x] Scheduler: Google Calendar/Meet จริง + conflict + stage sync + **reschedule**
- [x] CSV import ในหน้า Sourcing (intake path ที่ไม่ติด anti-bot)
- [x] JD → hiring poster image (OpenAI gpt-image-1, optional)
- [x] **UI polish**: impeccable + LOGA accents (hero empty state, การ์ดขอบหนา/เงาแข็ง, hue pills, module icons), dark mode
- [x] **Security: RLS** ทุกตาราง (0003) — ปิด public API
- [x] wiring DB (queries/CRUD/ingest/approve/persist) — build + type-check + lint ผ่าน
- [x] docs: README, ARCHITECTURE, AI_LOG, STATUS, CLAUDE.md, **SETUP.md**

## เหลือทำ (ต้องการ ENV / การกระทำของผู้ใช้) — ทำแทนไม่ได้
> 📖 ทุก step ละเอียดอยู่ใน **`docs/SETUP.md`**

- [ ] STEP 1: Supabase — รัน SQL `0001` + `0002` + `0003_enable_rls` + bucket `resumes`
- [ ] STEP 2: env บน Vercel (Supabase + Anthropic) — ⚠️ URL ห้ามมี `/rest/v1/`
- [ ] STEP 3: เปิด Google provider ใน Supabase (login gate)
- [ ] STEP 4: Google Calendar OAuth (Module 4)
- [ ] ทดสอบ e2e ครบ pipeline + เติม AI_LOG (Module 2 prompt iteration จริง)
- [ ] Deploy scraper (optional) + อัปเดต README ใส่ live URL
- [ ] Demo video ~3 นาที (ใส่ candidate จริงให้ board เต็มก่อนอัด)

## optional ที่ยังไม่ทำ (ไม่บังคับในโจทย์)
- [ ] LinkedIn scrape ด้วย session cookie (ตอนนี้ stub — ToS/login)
- [ ] poster แบบผสม (GPT Image พื้นหลัง + HTML ข้อความ) ถ้าต้องการข้อความไทยคม

## ตัดแล้ว (ไม่ทำ — เหตุผล)
- Facebook/JobBKK scrape — ต้อง login + ผิด ToS, stub ไว้พร้อมคำอธิบาย
