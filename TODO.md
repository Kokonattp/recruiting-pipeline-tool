# TODO

## เสร็จแล้ว ✅
- [x] 4 module ครบ (Sourcing/Screener/Tracker/Scheduler) UI + logic + AI
- [x] JD Generator (keyword → JD ด้วย Claude) + **แก้ JD ได้ก่อนบันทึก**
- [x] Search Query Pack (AI สร้างคำค้นต่อแหล่ง + rationale)
- [x] Scraper service (Playwright+Docker) — WEB/JobsDB/JobThai **ทดสอบยิงจริงแล้ว (50 candidate)**
- [x] Tracker: board/list + drag-drop stage + stat bar + **เพิ่ม/แก้ไข/ลบ ครบ CRUD**
- [x] Screener: paste/PDF CV + score 3 ด้าน + **Report PDF (print/save)**
- [x] Scheduler: Google OAuth + Calendar/Meet + conflict + stage sync + **reschedule (เลื่อนนัด)**
- [x] CSV import ในหน้า Sourcing (intake path ที่ไม่ติด anti-bot)
- [x] JD → hiring poster image (OpenAI gpt-image-1, optional)
- [x] wiring DB (queries/CRUD/ingest/approve/persist) — build + type-check + lint ผ่าน
- [x] docs: README, ARCHITECTURE, AI_LOG, STATUS, CLAUDE.md

## เหลือทำ (ต้องการ ENV / การกระทำของผู้ใช้) — ทำแทนไม่ได้
- [ ] เสียบ `.env.local` (Supabase + Anthropic + Google OAuth + OpenAI[optional])
- [ ] รัน SQL ใน Supabase (`0001_init.sql` + `0002_seed_job.sql`) + bucket `resumes`
- [ ] **ทดสอบ e2e ที่ยังต้องมี key:** Module 2/3/4 + JD poster (Module 1 scrape ทดสอบแล้ว)
- [ ] Deploy: Vercel (web) + Cloud Run (scraper) + env ทั้ง 2 ที่
- [ ] อัปเดต README ใส่ live URL
- [ ] เสริม AI_LOG.md ด้วย prompt จริง + Claude output (ตอนมี Anthropic key)
- [ ] Demo video ~3 นาที (ใส่ candidate จริงให้ board เต็มก่อนอัด)

## optional ที่ยังไม่ทำ (ไม่บังคับในโจทย์)
- [ ] LinkedIn scrape ด้วย session cookie (ตอนนี้ stub — ToS/login)
- [ ] poster แบบผสม (GPT Image พื้นหลัง + HTML ข้อความ) ถ้าต้องการข้อความไทยคม

## ตัดแล้ว (ไม่ทำ — เหตุผล)
- Facebook/JobBKK scrape — ต้อง login + ผิด ToS, stub ไว้พร้อมคำอธิบาย
