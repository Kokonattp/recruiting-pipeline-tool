# UX Audit — จุดที่ควรแก้ทุก module

> สำหรับ agent ที่มาต่อ: ตรวจ + แก้ทีละข้อ, screenshot ดูจริงก่อน/หลัง, commit ย่อยต่อข้อ.
> กฎโปรเจกต์: `AGENTS.md` (no mock, btn-primary, .loga-card, .field, tsc+eslint ก่อน commit).

## ทั่วทั้งแอป
- [ ] **ปุ่ม disabled ต้องบอกเหตุผล** — ทำแล้วที่ Screener. เช็คที่เหลือ:
  - `jobs/jd-generator.tsx` ปุ่ม "บันทึก" / "สร้างรูป" disabled ตอน title ว่าง → บอก "ใส่ชื่อตำแหน่งก่อน"
  - `scraper/sourcing-flow.tsx` ปุ่ม approve disabled ตอน approving → มี busy text แล้ว (ok)
- [ ] **success feedback สม่ำเสมอ** — ตอนนี้ Scheduler มี msg, Sourcing มี approved state, แต่ Tracker (add/edit/delete) ไม่มี toast ยืนยัน → เพิ่ม feedback สั้น ๆ หรือใช้ revalidate ที่เห็นผลทันที (มีแล้ว)
- [ ] **mobile** — sidebar เป็น drawer แล้ว. เช็คว่าแต่ละหน้า content ไม่ล้นบนจอแคบ (board/table scroll-x, ฟอร์ม stack)

## Module 1 — Sourcing
- [ ] ปุ่ม source (LinkedIn/FB/...) ตอน **ไม่มี APIFY** ควรมี hint ว่า "ต้องเปิด Apify" หรือ tooltip (ตอนนี้กดได้แต่คืน 0 เงียบ ๆ — tally บอกแต่หลังค้น)
- [ ] ตอน Facebook เลือกแต่ไม่ใส่ group URL → ควรเตือนก่อนค้น (ตอนนี้ข้ามเงียบ ๆ)
- [ ] ระหว่าง runSourcing (ค้นหลายแหล่ง) ใช้เวลานาน → ปุ่มมี busy text แล้ว แต่ควรมี hint "อาจใช้เวลาสักครู่ (ค้นหลายแหล่ง)"
- [ ] shortlist ว่าง (ค้นไม่เจอ) → มี empty state แล้ว เช็คข้อความให้ช่วยเหลือ

## Module 2 — Screener
- [x] ปุ่ม disabled บอกเหตุผล (JD/CV) — ทำแล้ว
- [ ] PDF อัปโหลดแล้วประเมิน → ตอน AI กำลังทำ (busy) ควรมี skeleton/spinner ใน score area ไม่ใช่แค่ปุ่มเปลี่ยน text
- [ ] candidate dropdown "ไม่ผูกกับใคร" → ชัดแล้วว่าไม่บันทึก (ok)

## Module 3 — Tracker
- [ ] **drag-drop บนมือถือ** — dnd-kit pointer sensor อาจใช้ยากบนทัช → เช็ค/เพิ่ม touch หรือปุ่มเลื่อน stage สำรอง
- [ ] add/edit/delete candidate → ไม่มี success toast (ปิด dialog เฉย ๆ) → เพิ่ม feedback เบา ๆ
- [ ] filter (search/source) ตอนไม่เจอผล → ควรมี "ไม่พบผู้สมัครตามตัวกรอง" (ตอนนี้ board ว่างเฉย ๆ)

## Module 4 — Scheduler
- [ ] toggle ส่ง invite → ทำแล้ว (ข้อความเปลี่ยนตามสถานะ)
- [ ] conflict detection → เตือนแล้ว เช็คว่าปุ่มสร้างถูก disable ตอน conflict (มีใน canBook)
- [ ] ตอน Google ยังไม่ connect → hero state ชัดแล้ว (ok)
- [ ] calendar view ว่าง → empty state ok

## เช็คท้าย (ทุก module)
- [ ] loading.tsx + NavLoading ทำงานทุกหน้า (มีแล้ว)
- [ ] dark mode อ่านออกทุกหน้า (เช็ค contrast badge/pill บนพื้นดำ)
- [ ] error จาก action แสดงให้ user เห็น (ไม่ throw เงียบ) — actions ส่ง {ok,error} แล้ว เช็คว่า UI โชว์ครบ
