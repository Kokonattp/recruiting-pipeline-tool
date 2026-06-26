# แผนงาน + ประเมินเวลา (คำนวณจริง)

Deadline โจทย์: **5 วัน**. ด้านล่างคือเวลาทำงานจริง (effort hours) ไม่ใช่เวลานาฬิกา — สมมติทำได้ ~6 ชม./วัน = งบรวม ~30 ชม.

## เกณฑ์ที่ต้องตอบ (จากรูปโจทย์)

| เกณฑ์ | น้ำหนัก | กลยุทธ์ |
|-------|---------|---------|
| Feature Completeness | 30% | ครบ 4 module ทำงานจริง — ห้ามมี module ที่เป็นแค่ UI เปล่า |
| Code Quality & Architecture | 30% | แยกชั้น lib/modules/components, zod ทุก input, naming ชัด, ARCHITECTURE.md |
| UX & Usability | 25% | impeccable design system + dark mode, flow HR สมเหตุสมผล, ไม่สับสน |
| AI Integration | 15% | tool-use structured output, prompt iterate จริง, AI_LOG.md |

> Code Quality + Feature = **60%** → ของต้องทำงานจริง + โครงสะอาด สำคัญสุด

## ตารางประเมินเวลา

| เฟส | งาน | ชม. | ตอบเกณฑ์ |
|-----|-----|----:|----------|
| **0. วางโครง** | create-next-app (เสร็จ) + ถอด Prisma→supabase-js | 1.0 | Code |
| | PRODUCT.md + DESIGN.md (impeccable init) | 1.0 | UX |
| | ARCHITECTURE.md + โครงโฟลเดอร์ lib/modules/components | 1.0 | Code |
| | Supabase: schema migration + storage + seed JD | 1.5 | Feature |
| | design token (light+dark) + layout + nav 4 module | 2.0 | UX |
| | **รวมเฟส 0** | **6.5** | |
| **1. Tracker** (แกนกลาง) | CRUD candidate + zod + queries | 2.0 | Feature/Code |
| | Kanban board (dnd-kit) + list view + filter | 3.0 | Feature/UX |
| | polish ด้วย impeccable + dark | 1.0 | UX |
| | **รวม** | **6.0** | |
| **2. Screener** (AI core) | upload CV (Storage) + PDF/text extract | 1.5 | Feature |
| | Claude tool-use prompt + zod + iterate | 2.5 | AI |
| | score card UI + ผูก application | 2.0 | UX/Feature |
| | **รวม** | **6.0** | |
| **3. Scraper** (เสี่ยงสุด) | Playwright service + Docker + 2-3 source (เริ่ม public) | 3.0 | Feature |
| | JD→query (Claude) + normalize+rank + ingest API | 2.0 | AI/Feature |
| | shortlist + เหตุผล + HR approve flow | 1.5 | UX |
| | **รวม** | **6.5** | |
| **4. Scheduler** | Google OAuth + Calendar + Meet (conferenceData) | 2.5 | Feature |
| | conflict detection + reschedule/cancel + sync stage | 2.0 | Feature/Code |
| | calendar/agenda view | 1.0 | UX |
| | **รวม** | **5.5** | |
| **5. ส่งงาน** | README + deploy (Vercel+Railway+Supabase) | 2.0 | บังคับ |
| | AI_LOG.md เก็บตลอดทาง + เรียบเรียง | 1.0 | bonus |
| | verify e2e + อัด demo video ~3 นาที | 2.0 | บังคับ |
| | **รวม** | **5.0** | |

### สรุปเวลา

| เฟส | ชม. |
|-----|----:|
| 0. วางโครง | 6.5 |
| 1. Tracker | 6.0 |
| 2. Screener | 6.0 |
| 3. Scraper | 6.5 |
| 4. Scheduler | 5.5 |
| 5. ส่งงาน | 5.0 |
| **รวมทั้งหมด** | **~35.5 ชม.** |
| buffer เผื่อ scraper โดน block / OAuth ตั้งนาน (+15%) | +5 |
| **รวม + buffer** | **~40 ชม. ≈ 5 วัน (8 ชม./วัน) หรือ 6-7 วัน (6 ชม./วัน)** |

## แมปลงปฏิทิน 5 วัน (8 ชม./วัน)

- **วัน 1:** เฟส 0 วางโครงจบ + เริ่ม Tracker
- **วัน 2:** Tracker จบ + เริ่ม Screener
- **วัน 3:** Screener จบ + เริ่ม Scraper
- **วัน 4:** Scraper จบ + เริ่ม Scheduler
- **วัน 5:** Scheduler จบ + README + deploy + demo video

## ความเสี่ยง (เรียงตามผลกระทบ)

1. **Scraper โดน anti-bot** (สูงสุด) → เริ่มแหล่ง public ง่าย (JobsDB/JobThai/Google) ให้ครบ pipeline ก่อน, source แบบ pluggable ถ้าตัวไหน block ก็ข้าม
2. **Google OAuth verify นาน** → ใช้ test-user mode ไม่ต้อง verify app
3. **เวลาไม่พอ** → ลำดับ Tracker→Screener ก่อน (ชัวร์+คะแนนสูง) แล้วค่อย Scraper/Scheduler

## ของที่ต้องการจากผู้ใช้ (blockers)

- [ ] **Supabase** project URL + anon key + service key (→ ทำ database ต่อได้)
- [ ] **Anthropic API key** (→ Module 2/1)
- [ ] **Google OAuth** client id/secret (→ Module 4)
- [ ] **session cookie** LinkedIn/FB (→ Module 1 แหล่งที่ต้อง login — ทำทีหลังได้)
