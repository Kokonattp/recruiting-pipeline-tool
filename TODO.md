# TODO

## เสร็จแล้ว ✅
- [x] 4 module ครบ (Sourcing/Screener/Tracker/Scheduler) UI + logic + AI
- [x] JD Generator (keyword → JD ด้วย Claude)
- [x] Search Query Pack (AI สร้างคำค้นต่อแหล่ง + rationale)
- [x] Scraper service (Playwright+Docker) — WEB/JobsDB/JobThai
- [x] Tracker: board/list + drag-drop stage + stat bar + add-candidate
- [x] Screener: paste/PDF CV + score 3 ด้าน
- [x] Scheduler: Google OAuth + Calendar/Meet + conflict + stage sync
- [x] wiring DB (queries/CRUD/ingest/approve/persist) — build ผ่าน
- [x] docs: README, ARCHITECTURE, AI_LOG, STATUS, CLAUDE.md

## เหลือทำ (ต้องการ ENV / การกระทำของผู้ใช้)
- [ ] เสียบ `.env.local` (Supabase + Anthropic + Google OAuth)
- [ ] รัน SQL ใน Supabase (`0001_init.sql` + `0002_seed_job.sql`) + bucket `resumes`
- [ ] ทดสอบ data จริงไหลครบ pipeline (e2e)
- [ ] Deploy: Vercel (web) + Cloud Run (scraper) + env ทั้ง 2 ที่
- [ ] อัปเดต README ใส่ live URL
- [ ] เสริม AI_LOG.md ด้วย prompt จริง + Claude output (ตอนมี Anthropic key)
- [ ] Demo video ~3 นาที

## ทำเพิ่มถ้ามีเวลา (optional)
- [ ] LinkedIn scrape ด้วย session cookie (ตอนนี้ stub — ToS/login)
- [ ] Import CSV UI ในหน้า Sourcing (มี action `importCsvAndRank` แล้ว)
- [ ] Generate Report PDF (ภาพ idea มี แต่ไม่บังคับในโจทย์)
- [ ] reschedule (เปลี่ยนเวลานัด) — ตอนนี้มี cancel แล้ว

## ตัดแล้ว (ไม่ทำ — เหตุผล)
- Facebook/JobBKK scrape — ต้อง login + ผิด ToS, stub ไว้พร้อมคำอธิบาย
