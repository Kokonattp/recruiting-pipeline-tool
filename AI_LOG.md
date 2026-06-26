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
**วิวัฒนาการ decision:** local CLI → Docker service บน cloud มี HTTP endpoint. session cookie LinkedIn/FB เก็บเป็น secret บน cloud (เข้ารหัส) ไม่ commit.
**host (อัปเดต):** เลือก **Google Cloud Run** (จากตอนแรกคิด Railway) — เหตุผล: ทำ Module 4 ต้องใช้ Google Cloud account อยู่แล้ว → ใช้ account เดียวคุมทั้ง Calendar API + scraper, free tier เยอะ, scale-to-zero ไม่เปลืองตอนไม่ใช้. Dockerfile อ่าน `$PORT` ที่ Cloud Run inject ได้เลย.

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

หัวใจของ AI Integration. prompt อยู่ใน `src/modules/screener/ai.ts`. หลักการที่ใส่ลง system prompt:

1. **score 3 แกนแยกกัน + มี rubric ชัด** (8-10 strong / 5-7 partial / 0-4 weak) — กันไม่ให้ AI ยุบทุกอย่างเป็น "vibe score" เดียว.
2. **reasoning ต้องอ้างหลักฐานจาก CV จริง** "Never invent experience the CV doesn't show" — กัน hallucination / คะแนนเฟ้อ.
3. **cultureFit สั่งให้ conservative** บอกตรงๆ ถ้าหลักฐานน้อย — เพราะ culture เดาจาก CV ยาก ไม่ควรมั่ว.
4. **prescreenQuestions เจาะ "gap/risk"** ไม่ใช่คำถาม generic ("เล่าตัวเอง") — ให้ตรงกับสิ่งที่ recruiter ต้องถามจริงตอนโทร.
5. output ผ่าน **tool-use schema + zod** (`SCREENING_TOOL_SCHEMA` คู่กับ `ScreeningSchema`) บังคับ JSON เป๊ะ ผูก 1:1 กับตาราง `screening_results`.

**PDF:** ตัดสินใจไม่ parse PDF เองด้วย pdf-parse (v2 ESM API ยุ่ง เสี่ยงพัง) — จะใช้ **Claude document input (base64)** ตอนลิงก์ key แทน robust กว่า. ตอนนี้รองรับ paste text ก่อน.

## Prompt iterations (Module 1 — query gen + ranking)

Module 1 มี AI 2 จุด (ใน `src/modules/scraper/ai.ts`):

**1. planQueries (JD → search query ต่อแหล่ง):** key insight — แต่ละ platform ค้นหาคนละแบบ ถ้าใช้ query เดียวยิงทุกที่จะได้ผลห่วย. เลย prompt ให้ Claude tailor query ต่อ source โดยใส่ตัวอย่างวิธีค้นของแต่ละที่ลงใน system (LinkedIn boolean / JobsDB keyword ไทย / Google site:). ให้คืน `rationale` ต่อ query ด้วย → โปร่งใส HR เห็นว่าทำไมค้นแบบนี้.

**2. rankCandidates (raw → normalize + rank):** prompt เน้น "อย่าแต่งประสบการณ์ที่ไม่มีในข้อมูล" (กัน hallucination), ให้ `fitScore` 0-100 + `reasons` (จุดแข็ง) + `concerns` (สิ่งที่ต้องเช็คตอนโทร) → HR ได้ recommendation ที่มีเหตุผล ไม่ใช่ raw noise. สั่ง drop entry ที่ข้อมูลน้อยเกินประเมิน.

ทั้ง 2 จุดใช้ tool-use + zod validate (helper `lib/claude.structured()`) บังคับ JSON เป๊ะ.

---

## Decisions อื่น (UX/tooling)

- **Font: เปลี่ยนเป็น Prompt** (Google Fonts, มีทั้ง Thai+Latin ในตัวเดียว) — ตาม impeccable product register "one family is often right", เลี่ยงผสม 2 ฟอนต์.
- **ตัด landing page ทิ้ง** — HR tool เปิดมาเข้า Tracker เลย (เหมือน Linear/Notion). จัด nav เรียงตาม workday flow (Tracker=home บนสุด).
- **Empty state เป็น onboarding** — โชว์ pipeline เปล่า + 2 วิธีเอา candidate เข้า (AI sourcing / manual) ไม่ใช่กล่องว่าง และ**ไม่มี mock candidate**.
- **State management: ไม่ใช้ Redux/RTK** — Next.js Server Component + Server Action + useState (local) พอ, RTK จะ over-engineer.
- **แบ่งงาน scraper service ให้ sub-agent ทำขนาน** — เพราะเป็น service แยกสมบูรณ์ (Playwright+Docker) ไม่แตะ design system, contract ชัด (RawCandidate/SearchQuery) → คุม consistency ได้. ส่วน UI ทำเองเพื่อรักษาสไตล์ให้เป็นเอกภาพ.
