# โจทย์ (สรุปจาก PDF) — Recruiting Pipeline Tool

> Take-home Assignment · Full Stack Developer · ตำแหน่งที่หา: **Senior AI Workflow & Automation Engineer**
> สร้าง web application ช่วยทีม HR จัดการสรรหาบุคลากรตั้งแต่ต้นจนจบ ในหนึ่ง codebase

## เงื่อนไข

| หัวข้อ | รายละเอียด |
|--------|-----------|
| ระยะเวลา | 5 วัน นับจากได้รับ |
| รูปแบบ | Take-home — ทำคนเดียว ไม่มีการเฝ้าดู |
| เครื่องมือ | เลือก stack ได้อิสระ ไม่มีข้อกำหนด |

## สิ่งที่โจทย์ต้องการวัดจาก output

1. ออกแบบ architecture และ data model อย่างไร
2. เลือก integrate AI เข้ามาตรงจุดไหน และ prompt อย่างไร
3. UX ที่สร้างขึ้นใช้งานง่ายในบริบทของคน HR มากน้อยแค่ไหน
4. ใช้ Claude Cowork เป็น productivity tool ในการทำงานจริงได้ไหม *(optional – bonus)*

---

## Module ที่ต้องสร้าง — ครบทั้ง 4 (ไม่มีข้อ optional)

### Module 1: Candidate Data Scraper
**Context:** HR เสียเวลามากในการรวบรวมข้อมูล candidate จากหลายแหล่ง ต้องการระบบช่วย scrape และ normalize เข้าสู่ระบบอัตโนมัติ

- รับ input เป็น JD หรือ criteria (ทักษะ, ประสบการณ์, ตำแหน่ง)
- ระบบ generate search query อัตโนมัติจาก JD แล้ว scrape/search candidate จากแหล่งที่กำหนด (LinkedIn, JobsDB, JobBKK, JobThai, Facebook Group, ฯลฯ — ไม่จำกัดช่องทาง ยิ่งมากยิ่งดี)
- Normalize และ rank ผู้สมัครที่พบ โดยใช้ AI วิเคราะห์ JD ความเข้ากันได้ของตำแหน่ง present ให้ HR
- แสดง shortlist พร้อมเหตุผลว่าทำไม candidate แต่ละคนเหมาะ
- HR ตรวจสอบและ approve ก่อน push เข้า Applicant Tracker (human-in-the-loop ยังอยู่ แต่เป็น review ไม่ใช่ data entry)

### Module 2: AI Resume Screener
**Context:** HR ใช้เวลามากในการอ่าน CV ทีละใบ ต้องการระบบให้คะแนนผ่านเกณฑ์ (scoring) และ summary อัตโนมัติ

- Upload CV (PDF หรือ paste plain text) พร้อมเลือก JD ของบริษัทที่ต้องการ match
- เรียก Claude API เพื่อประเมินและ return structured output — score 3 ด้าน (0–10): Skills fit, Experience fit, Culture/communication fit — พร้อม reasoning สั้น ๆ แต่ละด้าน
- Link ผู้สมัครแต่ละคนเข้ากับ JD ที่สมัคร
- แสดงผลเป็น score card ที่อ่านง่าย พร้อม flag จุดแข็ง / แนะนำจุดที่ต้องถามเพิ่มในการโทรสัมภาษณ์ครั้งแรก (prescreen call)
- มีการสรุปรายงานให้กับทีมงานที่จะเข้าสัมภาษณ์ (ซึ่งมักประกอบไปด้วย HR และ Manager ของแผนก)

### Module 3: Applicant Tracker
**Context:** HR ต้องการเห็นภาพรวมของผู้สมัครทุกคน ว่าแต่ละคนอยู่ขั้นตอนไหนของ pipeline

- เพิ่ม / แก้ไข / ลบผู้สมัครได้ (ชื่อ, email, เบอร์โทร, วันที่สมัคร, แหล่งที่มา เช่น LinkedIn / JobsDB / Referral)
- Filter ผู้สมัครตาม stage, position, หรือแหล่งที่มาได้
- แสดง pipeline stage แบบ dashboard หรือ list view — (ออกแบบ stage ต่าง ๆ เช่น: Applied → Screening → Pre-Screen Call → First Interview → Offer → Hired / Rejected)
- ย้าย stage ได้ด้วย drag-and-drop หรือ dropdown

### Module 4: Interview Scheduler
**Context:** ทีม HR นัดสัมภาษณ์ผ่านโทรศัพท์ ต้องการ create meeting ผ่าน Google Meet อัตโนมัติ

- ออกแบบระบบสร้างนัดหมายสัมภาษณ์ผ่าน Google Meeting Calendar แบบอัตโนมัติ พร้อมแนบคำอธิบายเพิ่มเติม (description) เกี่ยวกับคำถามที่ต้องถามเพิ่มนอกเหนือจากใน resume (จาก Module 1)
- แจ้งเตือนเมื่อมีการนัดซ้อนกัน (conflict detection)
- เปลี่ยน / ยกเลิกนัดได้ พร้อม update สถานะใน Applicant Tracker โดยอัตโนมัติ

---

## สิ่งที่ต้องส่ง

| ส่วน | รายละเอียด | Required |
|------|-----------|:--------:|
| GitHub Repo | Commit history ที่อ่านได้ — ไม่ใช่ commit เดียว | ✅ บังคับ |
| README.md | Setup instructions + อธิบาย architecture decision ที่ตัดสินใจเอง | ✅ บังคับ |
| Demo Video | ~3 นาที walkthrough ทุก module — Loom หรือ MP4 | ✅ บังคับ |
| Cowork Log | ไฟล์ .md หรือ .txt บันทึก prompt ที่ใช้ + Claude output + สิ่งที่แก้ต่อ | ⭐ Bonus |
| Live URL | Deploy บน free tier (Vercel, Render, Railway ฯลฯ) | ⭐ Bonus |

> **Cowork Log คืออะไร:** ไฟล์บันทึก session การใช้ Claude Cowork ระหว่างทำ assignment — เราไม่ได้ต้องการเห็นว่าคุณใช้ AI เก่งแค่ไหน แต่ต้องการเห็นว่า **คุณคิดอย่างไร** เมื่อทำงานคู่กับ AI

---

## เกณฑ์การประเมิน

| หัวข้อ | น้ำหนัก | สิ่งที่ดู |
|--------|:------:|----------|
| Feature Completeness | 30% | ครบ 4 module, ทำงานได้จริงตาม requirement |
| Code Quality & Architecture | 30% | Structure ชัด, naming อ่านได้, ไม่มี spaghetti code |
| UX & Usability | 25% | ใช้งานได้จริงในบริบท HR, ไม่สับสน, flow สมเหตุสมผล |
| AI Integration | 15% | Prompt ดี, output structured และ useful จริง ไม่ใช่ generic |

> หมายเหตุ: ไม่มีการหักคะแนนหากเลือก stack ที่ไม่คุ้นเคย — เราสนใจวิธีคิดและวิธีแก้ปัญหา ไม่ใช่ภาษาที่ใช้
