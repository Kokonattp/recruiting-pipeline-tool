# AI Work Log

> โจทย์อยากเห็น **"คิดอย่างไรเมื่อทำงานคู่กับ AI"** ไม่ใช่ว่าใช้ AI เก่งแค่ไหน.
> ไฟล์นี้บันทึก decision จริง, ทางที่ลองแล้วไม่เวิร์ก, และเหตุผลที่เปลี่ยนใจ — ตามลำดับเวลา.
> เครื่องมือ: **Claude Code (Opus 4.8)** — เลือกแทน Claude Cowork เพราะแก้ codebase ตรงๆ / คุม git / รัน test ได้.

---

## รอบที่ 1 — ตีความโจทย์ & กลยุทธ์

**สิ่งที่คิด:** โจทย์กว้างมากสำหรับ 5 วัน. อ่านน้ำหนักคะแนนเป็นเข็มทิศ — Code Quality (30) + Feature (30) = 60% → "ทำงานได้จริง + โครงสะอาด" สำคัญกว่า feature หวือหวา. AI Integration แค่ 15% แต่เป็นหน้าตางาน.

**ข้อสรุปสำคัญ:** 4 module ต้องเชื่อมเป็น **pipeline เดียวผ่าน data model กลาง** ไม่ใช่ 4 หน้าแยกกัน. นี่คือหัวใจของคะแนน architecture.

## รอบที่ 2 — Scraper: scrape จริง ไม่ mock

**ถกกับผู้ใช้:** ตอนแรก AI (ผม) เสนอ mock candidate data เพื่อความเร็ว. **ผู้ใช้ปฏิเสธ — ต้อง scrape จริง.** ถูกต้อง: โจทย์เขียน "scrape จาก LinkedIn/JobsDB/..." ตรงๆ.

**ตัดสิน:** Playwright headless browser, ทุกแหล่ง, source แบบ pluggable (1 ไฟล์/แหล่ง) เผื่อแหล่งไหนโดน anti-bot ก็ข้ามได้โดยไม่พังตัวอื่น.

## รอบที่ 3 — Scraper รันที่ไหน

**ปัญหา technical:** Playwright รันบน Vercel serverless ไม่ได้ (browser หนัก + เกิน timeout).
**วิวัฒนาการ decision:** local CLI → (สุดท้าย) **Docker service บน cloud** (Railway/Render) มี HTTP endpoint. session cookie LinkedIn/FB เก็บเป็น secret บน cloud (เข้ารหัส) ไม่ commit.

## รอบที่ 4 — Data layer: ทิ้ง Prisma

**ลองแล้วไม่เวิร์ก:** Prisma 7 ใหม่มาก — local dev server lock ค้าง, connect template1 ไม่ได้, pglite ยัง experimental, ต้องใช้ driver adapter. เสียเวลาหลายรอบ.

**ตัดสิน (ผู้ใช้เลือก):** ทิ้ง Prisma → ใช้ **supabase-js + Supabase**. เหตุผลที่ดีกว่าแค่หนีบั๊ก: Supabase ให้ Postgres + **Storage (เก็บไฟล์ CV จริงใน Module 2)** + Auth ในเจ้าเดียว.

**บทเรียน:** อย่าฝืนใช้ tool ที่เพิ่ง major-bump ถ้ามันขวางงาน — เลือกตัวที่ลดความเสี่ยง deploy (local = prod).

## รอบที่ 5 — UI: ใช้ design system จริง กัน AI-slop

ติดตั้ง skill **impeccable** (design system + hook ตรวจ AI-slop อัตโนมัติ) + มี loga-board-design.
รัน `impeccable init` → ทำ interview → ได้ **PRODUCT.md** (register=product, personality=มืออาชีพ/แม่นยำ/น่าเชื่อถือ, anti-ref=ไม่เอา SaaS template โหล).

**decision สี:** palette script สุ่มได้ crimson (hue 20°). **ไม่ใช้ตรงๆ** — แดงสื่อ urgency เกินไปสำหรับ tool ที่ HR จ้องทั้งวัน. เขียน scene sentence → เลือก **bg ขาวบริสุทธิ์ + ink เข้ม เป็นหลัก, เก็บ crimson ไว้เป็น accent เฉพาะ reject/urgent** (สีมีความหมาย ไม่ใช่ตกแต่ง). + รองรับ **dark theme**.

**เลือก impeccable เป็น design system:** เพราะ register ของงานเป็น *product* (tool ที่ HR ใช้ทำงานทุกวัน) — แนวสะอาด/แน่น/พรีเมียมแบบ Linear ตรงกับ personality "มืออาชีพ แม่นยำ น่าเชื่อถือ" ใน PRODUCT.md และเลี่ยง AI-slop ได้ (impeccable มี hook ตรวจให้อัตโนมัติ).

---

## Prompt iterations (Module 2 — Resume Screener)

> หัวใจของ AI Integration. จะบันทึก prompt แต่ละเวอร์ชัน + ทำไมต้องแก้ + edge case ที่เจอ เมื่อเริ่มลงมือ Module 2.

_(จะเติมเมื่อทำ Module 2)_

## Prompt iterations (Module 1 — query gen + ranking)

_(จะเติมเมื่อทำ Module 1)_
