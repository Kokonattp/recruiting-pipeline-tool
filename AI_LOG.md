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

1. **score 3 แกนแยกกัน + มี rubric ชัด** — กันไม่ให้ AI ยุบทุกอย่างเป็น "vibe score" เดียว. (rubric หยาบ 8-10/5-7/0-4 เดิม ถูกอัปเป็น anchored rubric ละเอียด + temperature 0 ในรอบที่ 10 ดูท้ายไฟล์).
2. **reasoning ต้องอ้างหลักฐานจาก CV จริง** "Never invent experience the CV doesn't show" — กัน hallucination / คะแนนเฟ้อ.
3. **cultureFit สั่งให้ conservative** บอกตรงๆ ถ้าหลักฐานน้อย — เพราะ culture เดาจาก CV ยาก ไม่ควรมั่ว.
4. **prescreenQuestions เจาะ "gap/risk"** ไม่ใช่คำถาม generic ("เล่าตัวเอง") — ให้ตรงกับสิ่งที่ recruiter ต้องถามจริงตอนโทร.
5. output ผ่าน **tool-use schema + zod** (`SCREENING_TOOL_SCHEMA` คู่กับ `ScreeningSchema`) บังคับ JSON เป๊ะ ผูก 1:1 กับตาราง `screening_results`.

**PDF:** ตัดสินใจไม่ parse PDF เองด้วย pdf-parse (v2 ESM API ยุ่ง เสี่ยงพัง) — จะใช้ **Claude document input (base64)** ตอนลิงก์ key แทน robust กว่า. ตอนนี้รองรับ paste text ก่อน.

---

### Module 2 — prompt iteration จริง (v1 → v2 → v3)

**รอบนี้ทดสอบด้วย CV จริง:** CV ของตัวเอง (Nattawut Panjandee — Data Analyst, Supply Chain & Operations, ประสบการณ์ 7+ ปี ที่ Kerry Express / JD Central / CJ Express) เทียบกับ JD ที่จงใจเลือกให้ **ไม่ตรงสาย**: "Senior AI Workflow & Automation Engineer" (ต้องการ LLM orchestration, RAG, n8n/LangChain, event-driven integration) — อยากรู้ว่า AI จะ inflate คะแนนให้เพราะเห็นคำว่า Python/API/AI Agents ในสายที่ใกล้เคียงไหม หรือแยกออกจริงว่าไม่ใช่สายที่ JD ต้องการ.

**v1 — rubric หยาบ (8-10/5-7/0-4) + ไม่ตั้ง temperature**
- prompt: ให้คะแนน 3 แกนตรงๆ ไม่มี anchor ว่าอะไรคือ 8 vs 9, ไม่ล็อก temperature
- ปัญหาที่เจอ (ก่อนแก้จริงในรอบที่ 10): คะแนนมีโอกาสแกว่งรันซ้ำได้ไม่เท่าเดิม เพราะไม่ deterministic — อ่านบทความ HackerRank ATS แล้วเห็นว่าเราเสี่ยงปัญหาเดียวกัน

**v2 — เพิ่ม temperature 0 + anchored rubric ละเอียดต่อช่วงคะแนน**
- เปลี่ยน: ล็อก `temperature: 0` (deterministic), เขียน rubric บอกชัดว่า 9-10 ต้องเห็น "demonstrated depth" ไม่ใช่แค่ "listed", 5-6 คือมีประมาณครึ่งของ must-have
- ผลที่เปลี่ยนไป: คะแนนนิ่งขึ้น ไม่แกว่งเรื่อง phrasing เดิม — ทดสอบ CV จริงข้างต้นได้ Skills Fit 3/10 ทุกครั้งที่รันซ้ำ (ไม่ใช่ 3 บ้าง 6 บ้าง)
- ปัญหาที่ยังเหลือ: band (STRONG/CONSIDER/WEAK) ตอนนั้นยังให้ AI ตัดสินเอง ไม่ใช่คำนวณจากกฎ

**v3 (final) — แยก band ออกเป็นสูตรของเรา + บังคับ evidence-grounded reasoning**
- เปลี่ยน: เพิ่ม "Ground EVERY reasoning sentence in concrete evidence" + "Never invent experience the CV doesn't show — absence of evidence lowers the score, not raises it", ย้าย band ไปคำนวณใน `deriveRecommendation()` แทนให้ AI เดา (รอบที่ 11)
- output สุดท้าย: กับ CV จริงที่เทส — reasoning อ้างตรงว่า CV มีคำว่า "Python", "AI Agents", "API" ในลิสต์ skill แต่ **ไม่มีหลักฐานโปรเจกต์ที่ใช้ LLM/RAG/LangChain/n8n เลย** → ให้ Skills Fit 3/10 ไม่ใช่ให้ผ่านเพราะเห็น keyword คุ้นตา. Experience Fit 4/10 ชมว่ามี 7+ ปีจริงแต่ระบุชัดว่าเป็นสาย "logistics data analytics" ไม่ใช่ automation engineering — ไม่เหมาโบนัสจากแค่จำนวนปี. Culture Fit 5/10 ให้เครดิต cross-team signal จริงจาก CV แต่บอกตรงว่าไม่มี signal เฉพาะสาย engineering
- ข้อสังเกตของตัวเอง: สิ่งที่ประทับใจคือ AI ไม่ "หาทางให้ผ่าน" จากการเห็นคำใกล้เคียง (data/API) แต่แยกออกจากสิ่งที่ JD ต้องการจริง (LLM orchestration) ได้ถูกต้อง — พิสูจน์ว่า anchored rubric + "never invent" ทำงานตามที่ตั้งใจกับเคสที่ไม่ตรงสายชัดเจน ไม่ใช่แค่ทฤษฎีในรอบที่ 10

**edge case ที่เจอจริง:** CV กับ JD คนละสายชัดเจน (Data Analyst vs AI Engineer) — Claude ไม่ inflate คะแนน, แยก skill ที่ "มีคำ" กับ "demonstrated" ได้, prescreenQuestions เจาะ gap ตรงจุด (ถามตรงๆ ว่าเคยสร้าง LLM agent ใช้งานจริงหรือยัง เคยใช้ LangChain/n8n ไหม) ไม่ใช่คำถามทั่วไปแบบ "เล่าตัวเองหน่อย"

---

### บันทึก decision: token cost ของการอ่าน PDF (29 มิ.ย. 2026)

**คำถามที่จุดประเด็น:** ถ้าใช้จริงวันละหลายไฟล์ ให้ Claude อ่าน PDF เอง (base64 document) เปลือง token ไหม?

**สิ่งที่พบ:** Claude อ่าน PDF native = นับ **text + image ของแต่ละหน้า** → กิน token มากกว่าส่ง text ล้วนหลายเท่า (CV 2 หน้า ~4-6k tokens). วันละ 50 ใบบน Opus = ~$3-4.5/วัน.

**ทบทวน decision เดิม (รอบ Module 2):** เดิมเลือก "ไม่ parse เอง ให้ Claude อ่าน PDF" เพราะ robust — **ยังถูกสำหรับ CV ที่เป็น scan/รูป** แต่สำหรับ CV text ปกติมันแพงเกินจำเป็น.

**แผนปรับ (ถ้าจะใช้ production จริง):**
1. **extract text ก่อนด้วย `pdf-parse`** (มีใน devDeps แล้ว) → ส่งแค่ text ตัด image token ทิ้ง ~50-70%.
2. **ใช้ Haiku/Sonnet สำหรับ screening** แทน Opus — งานคัด CV ไม่ต้องใช้ Opus, ถูกกว่าหลายเท่า.
3. เหลือ Claude-อ่าน-PDF-เอง เป็น **fallback** เฉพาะตอน pdf-parse ดึง text ไม่ออก (scan).
4. prompt caching JD เมื่อคัดหลาย CV ต่อ JD เดียว.

‹หมายเหตุของตัวเอง: จะทำ optimization นี้เลย หรือเก็บเป็น "future work" ใน README — ตัดสินใจตอน demo›
> เหตุผลที่บันทึก: เป็น trade-off robustness ↔ cost ที่ตัดสินใจจริง — ตรงกับสิ่งที่ตำแหน่งนี้ (AI Workflow Engineer) ต้องคิดเรื่อง cost ของ pipeline.

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

---

## รอบที่ 6 — ทดสอบ scraper จริง (e2e, 29 มิ.ย. 2026)

**ทำไมต้องทดสอบ:** เขียน scraper ไว้แต่ไม่เคยรันยิงเว็บจริง = แค่ "type-check ผ่าน" ไม่พอ. ต้องพิสูจน์ว่า scrape ได้ data จริง ไม่ใช่โดน anti-bot block หมด.

**วิธีทดสอบ:** รัน service local (`tsx server.ts`, PORT=4000, มี `SCRAPER_INGEST_SECRET`) แล้วยิง `POST /scrape` ด้วย 4 query (WEB / JOBSDB / JOBTHAI / LINKEDIN).

**ผลจริง (verified):**

| Source | ผล | หมายเหตุ |
|--------|-----|---------|
| WEB (Bing) | ✅ 10 results | title + snippet + link จริง |
| JOBSDB | ✅ 20 results | job posting จริง (บริษัท+จังหวัด) เช่น MUI Robotics, TISCO, SCG, True Corp |
| JOBTHAI | ✅ 20 results | job posting จริง |
| LINKEDIN | ⏭️ skip (0) | stub — log ชัด "requires session (auth + ToS)" ไม่ crash |

รวม **50 candidate จริง** จาก 1 request. `/health` ✅ + auth reject (secret ผิด → 401) ✅.

**สิ่งที่ยืนยันจากการทดสอบ:**
1. per-source try/catch ทำงานจริง — LINKEDIN stub ถูกข้ามโดยไม่ล้ม source อื่น (เห็นใน log: `[LINKEDIN] returned 0`, ตัวอื่นยังคืนผลครบ).
2. browser เดียวต่อ request + page แยกต่อ source → memory คุมได้บน container เล็ก.
3. data ที่ได้พร้อมส่งต่อให้ Claude `rankCandidates()` normalize+rank ต่อทันที.

**ข้อจำกัดที่ซื่อสัตย์:** ผลขึ้นกับ markup ของ Bing/JobsDB ณ วันรัน (selector อาจเปลี่ยน) + อาจโดน rate-limit ถ้ายิงถี่. design เลือกให้ "block = คืน [] ไม่ใช่ throw" จึงทนต่อความเปราะตรงนี้ได้ระดับหนึ่ง. LinkedIn/FB/JobBKK เป็น stub โดยตั้งใจ (ToS/auth) — ระบุชัดทั้งใน code comment และ README ไม่แกล้งทำว่า scrape ได้.

---

## รอบที่ 7 — ปิดช่องโหว่ requirement + feature เสริม (29 มิ.ย. 2026)

ตรวจ requirement เทียบ PDF ทีละบรรทัด เจอ 2 จุดที่ "เกือบครบ" แต่ขาดตามตัวอักษรโจทย์ → ปิดให้ครบ:

1. **Tracker edit candidate** — โจทย์เขียน "เพิ่ม/**แก้ไข**/ลบ" แต่มีแค่ add+delete. เพิ่ม `editCandidate` (zod, pattern เดียวกับ add) + **รวม add/edit dialog เป็น `CandidateForm` ตัวเดียว** (mode add|edit) แทนการเขียนฟอร์มซ้ำ — กัน duplication ตามกฎ code quality.
2. **Scheduler reschedule** — โจทย์เขียน "**เปลี่ยน**/ยกเลิกนัด" แต่มีแค่ cancel. เพิ่ม `rescheduleInterview` (patch Google event + status RESCHEDULED) + inline datetime UI.

**Feature เสริม (ตอบ "ทำเพิ่มถ้ามีเวลา"):**
- **Report PDF** (Module 2): เลือก **print-to-PDF ของ browser** แทนไลบรารี PDF (เช่น react-pdf). เหตุผล: zero dependency, ได้ผลลัพธ์เป็น vector คมชัด + ไทยไม่เพี้ยน (ปัญหาคลาสสิกของ pdf lib กับ font ไทย). ทำด้วย print CSS isolate `#screening-report` เท่านั้น.
- **JD แก้ก่อนบันทึก** (Module 1): เดิม AI ร่าง JD แล้ว save ตรง ๆ — เพิ่มโหมดแก้ทุก field (list ใช้ textarea บรรทัดละข้อ parse กลับเป็น array). human-in-the-loop: AI ร่าง คนตัดสินใจ.

## รอบที่ 8 — JD → hiring poster ด้วย GPT Image (ตัดสินใจที่ถกเยอะ)

**โจทย์จากผู้ใช้:** อยากได้ feature "สร้าง JD แล้ว generate รูปประกาศ" แบบ poster ที่เห็น (dark + gold).

**ถกทางเลือก 3 แบบ** (เขียน trade-off ให้ผู้ใช้เลือก ไม่ตัดสินเอง):
- A) HTML/React poster — ข้อความ (โดยเฉพาะไทย) **คมชัดเป๊ะ** เพราะเป็น DOM จริง, ไม่ต้อง key, แต่ภาพ "วาด" สู้ generative ไม่ได้.
- B) GPT Image ทั้งใบ — ภาพสวย cinematic แต่ **ข้อความในรูปเพี้ยน โดยเฉพาะภาษาไทย** (ข้อจำกัดจริงของ image model ทุกตัว).
- C) ผสม — GPT Image ทำพื้นหลัง + HTML วางข้อความทับ (สวย+คม แต่ซับซ้อนสุด).

**ผู้ใช้เลือก B (GPT Image ทั้งใบ).** เคารพการตัดสินใจ แต่**ไม่ซ่อนข้อจำกัด** — จัดการด้วย:
1. prompt สั่ง "minimal text, do NOT fill with paragraphs" + ใช้ภาษาอังกฤษบนรูป → ลดโอกาสตัวมั่ว.
2. **ใส่ caveat ใต้รูปใน UI ตรง ๆ**: "ข้อความบน AI image อาจไม่ถูกต้อง (โดยเฉพาะไทย) — ยึด JD ที่บันทึกเป็นหลัก". ไม่ปล่อยให้ HR เข้าใจผิดว่ารูปคือเอกสารทางการ.

**decision เชิงสถาปัตยกรรม:** แยก `lib/openai.ts` ออกจาก `lib/claude.ts` (คนละ provider/key) ใช้ `fetch` ตรง ไม่ลง SDK เพิ่ม. `OPENAI_API_KEY` เป็น **optional** — ไม่ใส่ feature อื่นยังทำงานครบ.

**บทเรียน:** generative image ≠ ทดแทน layout เสมอ. สำหรับเอกสารที่ข้อความสำคัญ ("ต้องอ่านออก") HTML มักเหนือกว่า image model — แต่เมื่อผู้ใช้ต้องการ "ภาพหวือหวา" จริง หน้าที่เราคือทำให้ได้ + ติดป้ายข้อจำกัดให้ชัด ไม่ใช่ขัดใจหรือแกล้งว่าไม่มีปัญหา.

## รอบที่ 9 — fan-out sourcing + auth (จากการคุยกับผู้ใช้)

**จุดเริ่ม:** ผู้ใช้ตั้งคำถามดี — "เพื่อนบอกให้ Claude ค้นเอง พิมพ์คำเดียวก็เจอคน ทำไมเราทำยาก?" ทำให้กลับไปอ่านโจทย์ใหม่.

**ตีความโจทย์ใหม่ (ไม่เข้าข้างของที่ทำไปแล้ว):** Module 1 เขียน "scrape**/search**" — slash แปลว่ารับทั้ง 2 วิธี, ไม่ได้บังคับ scrape HTML. + "ไม่จำกัดช่องทาง ยิ่งมากยิ่งดี". สรุป: **ทั้ง scraper และ Claude web search ผ่านโจทย์** แต่ scraper สื่อ "architecture depth" (Full Stack + code 30%) ได้มากกว่า การเรียก AI ขั้นเดียว.

**decision: ทำทั้งคู่ แบบ fan-out.** ผู้ใช้เสนอ design เอง — "หน้างานค้นทีเดียว แต่เบื้องหลังทำพร้อมกัน". ตรงกับ pattern ของ AI Workflow Engineer พอดี (orchestrate หลาย source แบบ parallel). `runSourcing` ยิง scraper + web search ด้วย `Promise.allSettled` → merge → rank ครั้งเดียว. แหล่งไหนล่ม/ไม่ได้ตั้งค่าก็ข้าม (tally บอก HR) → web search ทำงานบน Vercel ได้แม้ไม่ deploy scraper.

**กัน hallucinate:** Claude web search อาจแต่งชื่อคน → บังคับทุก candidate ต้องมี `sourceUrl` จริงจากผลค้น, ตัดตัวที่ไม่มี URL ทิ้ง. + human-in-the-loop เดิม (HR approve).

**Auth (ผู้ใช้ขอ login):** เลือก **Supabase Auth (Google) เป็น gate ที่ขอบแอป** ไม่ใช่ rewrite data layer. เหตุผล: tool นี้ใช้ทีม HR เดียว → "login ด้วยบัญชีที่อนุญาต" คือ policy ทั้งหมด, ไม่ต้อง per-user RLS. ทุก query ยังผ่าน service_role เหมือนเดิม (ไม่พังของที่ทำงานอยู่). middleware กั้นทุก route, degrade graceful ถ้าไม่มี env. แยกชัดจาก Google Calendar OAuth (Module 4) ที่เป็นคนละ flow คนละ callback.

**บทเรียน:** "วิธีที่ง่ายกว่า" ของผู้ใช้/เพื่อนมักมีแก่น — หน้าที่เราคืออ่านโจทย์ให้ตรง แล้วหาทางที่ได้ทั้งความง่าย (web search บน live) และความลึก (scraper architecture) ไม่ใช่เลือกข้างเดียวเพราะลงแรงไปแล้ว.

## รอบที่ 10 — กันปัญหา "vibe-check scoring" (จากเคส HackerRank ATS)

**ที่มา:** ผู้ใช้ส่งบทความ — HackerRank open-source ATS ให้คะแนน resume เดิมแกว่ง 66-99 ใน 100 รอบ. ถ้า HR ตั้ง cutoff 85 คนเดิมผ่านบ้างตกบ้าง "ตามดวงของ LLM". บทเรียนของผู้เขียน: LLM เก่ง parse → structured data แต่ถ้าให้ "ตัดสิน 18 หรือ 24 คะแนน" โดยไม่มี rubric แน่น มันกลายเป็น vibe-check.

**ตรวจตัวเอง (ไม่เข้าข้าง):** Module 2 เราโดน 2 ใน 3 ของปัญหานี้ —
1. 🔴 ไม่ได้ตั้ง `temperature` → Claude สุ่มทุกครั้ง = คะแนนแกว่งได้เหมือนกัน.
2. 🟡 มี rubric แต่หยาบ (8-10/5-7/0-4 ไม่บอกว่าอะไรคือ 8 vs 9) → แกนที่ต้อง judgment (culture/exp) แกว่ง.
3. 🟢 เราดีกว่าตรงมี `reasoning` อ้างหลักฐานทุกแกน (HackerRank เป็น black box) → ตรงนี้รักษาไว้.

**สิ่งที่ทำ (4 อย่าง):**
1. **`temperature: 0`** สำหรับ screening — deterministic: CV เดิม → คะแนนเดิมเสมอ. (ใน `lib/claude.ts` ทำให้ temperature กับ extended-thinking exclusive กัน เพราะ API บังคับ).
2. **Rubric แบบ anchored ต่อช่วงคะแนน** — บอกชัดว่า 9-10 ต้องเห็นอะไร, 7-8 ต่างยังไง → ลด judgment สุ่ม. เน้น "demonstrated depth ไม่ใช่แค่ listed" (กันคนที่แค่พิมพ์ skill เยอะ).
3. **`confidence` (HIGH/MED/LOW)** — บังคับ AI บอกเองถ้า CV บางเกินจะตัดสิน. low-confidence high-score = อันตรายกว่า "ไม่แน่ใจอย่างซื่อสัตย์".
4. **`recommendation` band (STRONG/CONSIDER/WEAK) แทน single cutoff** — UI เขียนตรง ๆ ว่า "คะแนนนี้เป็นตัวช่วยจัดลำดับ ไม่ใช่เกณฑ์ตัดอัตโนมัติ" → กัน HR เอาเลขเดียวมา gate (ปัญหาหลักของบทความ).

**ทำไมสำคัญกับตำแหน่งนี้:** AI Workflow Engineer ไม่ใช่แค่ "เรียก LLM ให้ทำงาน" แต่ต้องรู้ว่า**ผลของ LLM เปราะตรงไหน แล้วออกแบบ guardrail**. เคสนี้คือตัวอย่างจริงของ "ใช้ AI ผิดจุด → กรองคนด้วยความสุ่ม". เราเลือก deterministic + anchored rubric + human-in-the-loop ชัด (band ไม่ใช่ gate) — ตอบโจทย์ "structured และ useful จริง ไม่ใช่ generic" ตรง ๆ.

**ข้อจำกัดที่ซื่อสัตย์:** temperature 0 ลดความแกว่ง**มาก** แต่ไม่ใช่ 0% (LLM ยังมี non-determinism เล็กน้อยจาก infra). และ rubric ดีขึ้นแต่ exp axis ยัง "แยก junior/senior ได้ไม่ละเอียดพอ" (ปัญหาเดียวกับที่บทความชี้) — งานต่อไปถ้ามีเวลา: ให้ AI ดึง years-of-experience เป็นตัวเลขก่อน แล้ว map เป็นคะแนนด้วย logic ของเรา ไม่ใช่ให้ LLM เดาคะแนนตรง ๆ.

## รอบที่ 11 — band ต้องมาจาก "กฎเรา" ไม่ใช่ AI เดา (ผู้ใช้จับได้)

**ผู้ใช้ถาม:** "band STRONG/CONSIDER/WEAK ใช้อะไรคัด?" → ไปดูโค้ดแล้วเจอว่า **ผมให้ AI ตัดสิน band เอง** ในรอบที่ 10. นี่ย้อนแย้งกับเจตนาตัวเอง: เพิ่งตั้ง temp 0 + anchored rubric เพื่อกัน "AI เดา" แต่ band ดันเปิดให้ AI เดาอีกชั้น = แกว่งได้เหมือนเดิม.

**แก้:** แยกหน้าที่ให้ชัด — **AI ทำสิ่งที่มันเก่ง** (อ่าน CV → คะแนน 3 แกน + confidence), **band คำนวณด้วยสูตรของเรา** (`deriveRecommendation` ใน types.ts):
- total = skills+exp+culture (เต็ม 30) · ≥22 STRONG · 14-21 CONSIDER · <14 WEAK
- **confidence LOW → CONSIDER เสมอ** (ไม่ว่าคะแนนเท่าไหร่) → คนต้องดู ตรงเจตนา human-in-the-loop

**ผลที่ได้:** band นิ่ง 100% (เลขเดิม → band เดิม), โปร่งใส (อธิบาย HR ได้ว่ามาจากเกณฑ์ไหน). LLM variance ถูกจำกัดไว้แค่ชั้นให้คะแนน (ซึ่ง temp 0 คุมแล้ว) ไม่ลามมาชั้นตัดสิน. (อัปเดต 1 ก.ค.: เพิ่ม `vitest` + unit test จริงให้ `deriveRecommendation` แล้ว — 8 เคส ครอบคลุมทุก boundary รวม LOW-confidence override — ดู `src/modules/screener/types.test.ts`.)

**บทเรียน:** "ให้ AI ทำให้หมด" เป็นกับดัก. งานที่เป็น **logic ตายตัว (mapping คะแนน→band)** ควรเป็นโค้ด ไม่ใช่ prompt — เร็วกว่า ถูกกว่า ตรวจสอบได้ และไม่มี variance. ขอบเขตที่ดี: AI = judgment (อ่าน/ประเมิน), โค้ด = rule (คำนวณ/ตัดสินใจตามเกณฑ์). ผู้ใช้ช่วยจับ inconsistency นี้ได้ดี.

## รอบที่ 14 — Apify (LinkedIn/Facebook) → Firecrawl (JobsDB/JobThai): เลือกเครื่องมือให้ตรงกับปัญหาจริง (1 ก.ค. 2026)

**คำถามที่จุดประเด็น:** ผู้ใช้เสนอ Firecrawl มาแทน Apify — ถามตรงๆ ว่า "ใช้แทนได้ไหม" ก่อนจะสมัคร Apify account ที่สอง.

**วิเคราะห์ก่อนตัดสินใจ (สำคัญกว่าตัวเครื่องมือ):** ปัญหาของ LinkedIn/Facebook ไม่ใช่ "ขาดเครื่องมือ scrape ที่ดี" แต่คือ **login wall** — ทั้งสองแพลตฟอร์มต้อง authenticated session ถึงจะเห็นผล search จริง. Firecrawl เป็น generic scraper (ไม่มี session ของ LinkedIn/FB ให้) จึงเจอ login wall เหมือนที่ Playwright เจอ — เปลี่ยนเครื่องมือไม่ได้แก้ปัญหานี้. ส่วน Apify's `harvestapi/linkedin-profile-search` ใช้ได้เพราะเป็น specialized actor ที่มี session pool ของตัวเอง ไม่ใช่ generic scrape.

ในทางกลับกัน **JobsDB/JobThai เป็นหน้า public job-search ไม่มี login wall** — โค้ด Playwright เดิม (`scraper/sources/jobsdb.ts`, `jobthai.ts`) แค่ `page.goto(url)` แล้วอ่าน DOM การ์ดผลลัพธ์เท่านั้น ไม่มี session ผูกไว้เลย. Firecrawl ทำสิ่งเดียวกันได้โดยไม่ต้องมี headless browser/Docker/Cloud Run deploy ของตัวเอง.

**ตัดสินใจ:**
1. **แทน Playwright scraper service ด้วย Firecrawl** สำหรับ JobsDB/JobThai — เรียก `/v2/scrape` ตรงจาก Next.js app (`src/lib/sourcing-apis.ts`), formats `["markdown","links"]`, regex จับ `[title](url)` ที่ href ตรงกับ host + `/job` — ลด architecture ทั้งก้อน (ไม่ต้อง deploy service แยกอีกต่อไป)
2. **ตัด LinkedIn + Facebook ออกจากทุกที่** (ไม่ใช่แค่ปิด flag แบบเดิม) — ทั้ง UI toggle, `runSourcing()`, `/api/sourcing-stream`, และ prompt ของ `planQueries()` — เพราะไม่มีทางแก้ปัญหา login wall ด้วยเครื่องมือที่มีตอนนี้ การเก็บ toggle ที่กดแล้วไม่ทำงานไว้จะสับสนกว่าตัดออกตรงๆ
3. เก็บโค้ด Playwright service เดิม (`scraper/`) ไว้เป็น reference ไม่ลบ แต่ระบุชัดใน README ว่าเป็น dead code ไม่ได้ deploy แล้ว

**บทเรียน:** ก่อนเปลี่ยนเครื่องมือ ต้องแยกให้ออกว่าปัญหาคือ "เครื่องมือไม่ดีพอ" หรือ "โจทย์มีข้อจำกัดที่เครื่องมือประเภทนี้แก้ไม่ได้เลย" (login wall เป็นแบบหลัง) — ถ้าไม่แยก จะเสียเวลาสมัคร/ตั้งค่าเครื่องมือใหม่ซ้ำๆ โดยได้ผลลัพธ์เหมือนเดิม.

## รอบที่ 12 — ยอมรับว่า band เคลมเกินจริง (ผู้ใช้ท้วงตรง)

**ผู้ใช้ถาม:** "band มันต่างจาก 'ดูคะแนนรวมเอง' ยังไง แทบไม่ต่างไหม?" → **ถูก.** ผมต้องแยกให้ชัดว่าอะไร *มีมูลค่าจริง* อะไรแค่ *ระบายสี*:

- ✅ **มีมูลค่าจริง:** `temperature 0` (แก้แกว่งจริง) · `anchored rubric` (ลด AI เดาจริง) · `confidence LOW → บังคับ CONSIDER` (อันนี้ทำสิ่งที่ "ดูคะแนนเอง" ทำไม่ได้ — คะแนนสูงแต่ข้อมูลน้อย ไม่ปล่อยผ่าน).
- 🟡 **แค่ UX ไม่ใช่ innovation:** band STRONG/CONSIDER/WEAK เอง = แค่ระบายสีคะแนนรวมให้ HR อ่านเร็ว. `if total>=22` ก็คือ cutoff อยู่ดี ถ้าตัด band ทิ้งแล้วโชว์คะแนนรวม+confidence ก็ได้ผลใกล้กัน. **ผมเคยพูดเกินจริงในรอบ 10-11 ว่ามันแก้ปัญหา HackerRank — จริง ๆ ตัวที่แก้คือ temp 0 + rubric + confidence ไม่ใช่ band.**

**ตัดสิน:** เก็บ band ไว้ในฐานะ UX helper (HR เห็น 🟢 เข้าใจเร็วกว่าเลข) แต่**ไม่เคลมว่าเป็นจุดเด่นเชิงเทคนิค**. คำที่ถูกต้องเวลาพูด/เขียน README: "กันคะแนนแกว่งด้วย temp 0 + anchored rubric + confidence-gated band" ไม่ใช่ "คิดค้น band system".

**บทเรียน (meta):** ระวัง overclaim ของตัวเอง. ผู้ใช้ที่จับได้ว่า "อันนี้แทบไม่ต่าง" ช่วยให้ไม่ไปพูดเกินจริงตอน demo — ซึ่งถ้ากรรมการจับได้เองจะเสียความน่าเชื่อถือมากกว่าการยอมรับขอบเขตของงานตั้งแต่แรก.

## รอบที่ 13 — เลือก model ตามความยากของงาน (ผู้ใช้ทักว่า Opus เปลือง)

**ผู้ใช้ทัก:** "ใช้ Opus หมดเลยไม่เปลืองไปใช้ไหม?" → ถูก. เดิม Opus ทำทุกงาน AI = แพงเกินจำเป็นสำหรับงานที่ไม่ต้องใช้ Opus.

**ตัดสิน — แบ่ง 3 ชั้นตามความยาก:**
| งาน | model | เหตุผล |
|-----|-------|--------|
| Rank candidates, AI web search | **Opus 4.8** | judgment ยากสุด (เทียบหลายคน / ค้น+สังเคราะห์เว็บสด) |
| JD Generator, Search query | **Sonnet 4.6** | generation well-scoped — ไม่ต้อง Opus, ถูกกว่า ~5 เท่า |
| Screen CV | **Sonnet 4.6** | judgment แต่ bounded ด้วย rubric+temp0 (รอบ 10) |

**ไม่ใช้ Haiku สำหรับ judgment เลย** — Haiku เหมาะ extract/classify ตรง ๆ ไม่เหมาะ "ให้คะแนนคน". ส่วน image (poster) ทำ model id ตั้งผ่าน env `OPENAI_IMAGE_MODEL` (default gpt-image-1) — ถ้า OpenAI ออกรุ่นใหม่ไม่ต้องแก้โค้ด.

**ทำไมสำคัญกับตำแหน่ง:** AI Workflow Engineer ต้องคุม **cost ของ pipeline** ไม่ใช่จับ Opus ยัดทุกที่. การ map "ความยากงาน → model tier" คือ skill ตรงตำแหน่ง. ผู้ใช้ช่วยจับจุดนี้ได้ดี.

**หมายเหตุ provider:** ทั้งระบบผูกกับ Claude (tool-use + structured output). เปลี่ยนไป GPT = รื้อ integration ใหม่หมด เสี่ยงสูงตอนใกล้ส่ง — ไม่ทำ. (Codex/GPT ใช้เป็นเครื่องมือ *เขียนโค้ด* ได้ คนละเรื่องกับ model ในตัวระบบ.)

## รอบที่ 15 — bug จริง: upload CV พังเงียบเพราะ Server Action body limit (1 ก.ค. 2026)

**อาการที่เจอ:** กด "ประเมินด้วย AI" หลังอัปโหลด PDF จริง (มีรูปถ่าย + formatting) แล้วขึ้น error กำกวม "การประเมินใช้เวลานานเกินไปหรือเกิดข้อผิดพลาดที่เซิร์ฟเวอร์" ทุกครั้ง — ดูจาก UI อย่างเดียวเหมือนเป็น timeout ของ Claude API แต่ไม่ใช่.

**หาสาเหตุจริง (ไล่จาก client → action → Claude):** โค้ด `screenResume()`/`extractPdfText()`/`structured()` ไม่มีปัญหา logic เลย — ตัวที่พังคือ **Next.js Server Action มี default body size limit 1MB** (ไม่ได้ตั้งใน `next.config.ts` มาแต่แรก). PDF จริงพอแปลง base64 (เพิ่มขนาด ~33%) เกิน 1MB ง่ายมาก → request ถูก reject **ก่อน** ถึง `runScreening()` เลย ฝั่ง client เห็นแค่ fetch เจ๊งเฉยๆ ตกไปที่ catch-all message ใน `screener-flow.tsx` ที่เขียนไว้ดักเคส timeout — ข้อความเลย "โกหก" สาเหตุจริงโดยไม่ตั้งใจ.

**แก้:**
1. `next.config.ts` → `experimental.serverActions.bodySizeLimit: "10mb"`.
2. เพิ่ม client-side size guard **ทุกจุดที่ upload ไฟล์แบบ base64** ไม่ใช่แค่จุดที่เจอ bug — ไล่หาด้วย grep ทั้ง repo เจอ 3 จุด: `screener-flow.tsx` (CV เดี่ยว, cap 7MB), `pdf-import.tsx` (Module 1 รับหลายไฟล์พร้อมกัน — เสี่ยงสุดเพราะไม่มี guard เลยมาก่อน, cap 5MB/ไฟล์ + 7MB รวม), `csv-import.tsx` (เสี่ยงต่ำเพราะส่งเป็น parsed text ไม่ใช่ base64 แต่ใส่กันไว้ 5MB).

**บทเรียน:** error message ที่ catch-all เขียนไว้ "เผื่อกรณี X" จะกลายเป็นกับดักถ้าไปดักสาเหตุอื่นที่ไม่ใช่ X ด้วย — เห็น error ต้องไล่ดูโค้ดจริงว่า throw จากไหน ไม่ใช่เชื่อข้อความหน้าจอเป๊ะๆ. และเวลาเจอ bug จากจุดเดียว ให้เช็คว่ามี "จุดคล้ายกัน" ที่ pattern เดียวกันหลบอยู่ที่อื่นในโค้ดไหม (ในเคสนี้เจอ pdf-import.tsx ที่เสี่ยงกว่าจุดที่ถูก report อีก).

### ทดสอบจริงหลังแก้ — Module 2 CV จริง vs JD ไม่ตรงสาย (1 ก.ค. 2026)

**เทสด้วย:** CV จริงของผู้ใช้เอง (Nattawut Panjandee — Data Analyst, Supply Chain & Operations, ประสบการณ์ 7+ ปี ที่ Kerry Express / JD Central / CJ Express) เทียบกับ JD **"Senior AI Workflow & Automation Engineer"** (ต้องการ LLM orchestration, RAG, n8n/LangChain, event-driven integration) — จงใจเลือก JD ที่ไม่ตรงสายเพื่อดูว่า AI inflate คะแนนให้คนไม่เข้าเกณฑ์ไหม.

**ผลที่ได้ (ตรงตามคาด ไม่มี hallucination):**
- Skills Fit **3/10** — reasoning ชี้ตรงว่า CV มีคำว่า "Python", "AI Agents", "API" ในลิสต์ skill แต่ **ไม่มีหลักฐานโปรเจกต์จริงที่ใช้ LLM/RAG/LangChain/n8n เลย** — แยก "listed" กับ "demonstrated" ได้ตามที่ rubric รอบที่ 10 ตั้งใจไว้
- Experience Fit **4/10** — ชม 7+ ปีประสบการณ์จริง แต่ระบุชัดว่าเป็นสาย "logistics data analytics" ไม่ใช่ "backend/platform/automation engineering" — ไม่เหมาโบนัสให้จากแค่จำนวนปี
- Culture Fit **5/10** — ให้เครดิตหลักฐาน cross-team จริงจาก CV (ทำงานข้าม Warehouse/Supply Chain/Provider) แต่บอกตรงว่าไม่มี signal เฉพาะสาย engineering (ไม่มี mentorship/OSS)
- band = **"ค่าเฉลี่ยไม่ตรง"** (ไม่ inflate ให้ผ่าน), confidence ปานกลาง
- prescreenQuestions **เจาะ gap ตรงจุด** ไม่ใช่คำถามทั่วไป — ถามตรงๆ ว่าเคยสร้าง LLM agent ที่ใช้งานจริงหรือยัง, เคยใช้ LangChain/n8n ไหม, ทำไมถึงเปลี่ยนสายมา AI/automation

**สิ่งที่ยืนยันจากการทดสอบนี้:** rubric anchored + "never invent experience" (รอบที่ 10) ทำงานตามที่ตั้งใจกับเคสจริงที่ไม่ตรงสายชัดเจน — AI ไม่พยายาม "หาทางให้ผ่าน" จากการมีคำ keyword ปนอยู่ในสายงานที่ใกล้เคียง (data/API) แต่แยกออกจากสายที่ JD ต้องการจริงๆ (LLM orchestration) ได้ถูกต้อง.

## รอบที่ 16 — "บันทึกหรือยัง?" ไม่ชัด (ผู้ใช้ทดสอบเองแล้วงงจริง)

**ผู้ใช้ถาม:** ทดสอบ Module 2 เองแล้วถามตรงๆ "ผูกกับรายชื่อผู้สมัครยังไง ไม่เห็นปุ่มบันทึกผล" — ทดสอบจริงแล้วไปไม่ถูก ไม่ใช่แค่สงสัยเฉยๆ.

**สาเหตุ:** design เดิม (ตั้งแต่แรก) ให้ "ประเมิน" กับ "บันทึก" เป็น action เดียวกัน — เลือกผู้สมัครจาก dropdown บนสุดแล้วกด "ประเมินด้วย AI" ครั้งเดียวจบทั้งคู่ (`runScreening()` ใน `actions.ts` upsert ทันทีถ้ามี `applicationId`). สัญญาณเดียวที่บอกว่าจะบันทึกคือ ข้อความเล็ก ๆ สีเขียวข้าง dropdown ("✓ คะแนนจะบันทึกเข้าผู้สมัครนี้") ซึ่งอยู่ *ก่อน* กดปุ่ม — พอกดปุ่มไปแล้วไม่มีอะไรยืนยัน *หลัง* บันทึกเสร็จ ผู้ใช้เลยไม่มั่นใจว่าจริง ๆ บันทึกไปหรือยัง.

**ทางเลือกที่คุยกัน:** (1) แค่เพิ่ม banner ยืนยันหลังบันทึกสำเร็จ (2) เปลี่ยนปุ่มให้พูดตรง ๆ ว่า "ประเมิน + บันทึก" (3) ทำทั้งสองอย่าง. **ผู้ใช้เลือก (1)** — คงปุ่มเดิม "ประเมินด้วย AI" ไว้ (label เดี่ยว ไม่ทำให้ flow ซับซ้อนขึ้น) แค่เพิ่มการยืนยันหลังจบงาน.

**แก้:**
1. `ScreenResult` (`actions.ts`) เพิ่ม field `saved: boolean` — backend บอกตรง ๆ ว่า upsert สำเร็จจริงไหม ไม่ใช่ให้ client เดาจาก `applicationId` ที่ตัวเองส่งไปเฉย ๆ (กันเคส persist ล้มเหลวแต่ AI ประเมินผ่าน).
2. `screener-flow.tsx` เพิ่ม state `savedFor` (ชื่อผู้สมัครที่บันทึกไปแล้ว) หลังผลออกมา render banner สองแบบแยกกันชัด: เขียว "✓ บันทึกผลเข้าโปรไฟล์ {ชื่อ} เรียบร้อย — ดูได้ที่ Tracker" ถ้าบันทึกจริง, เทา "โหมดทดสอบ — ยังไม่ถูกบันทึก" ถ้าไม่ได้เลือกผู้สมัคร.

**บทเรียน:** สัญญาณ "จะเกิดอะไรขึ้น" (ก่อนกด) ไม่เพียงพอ ต้องมีสัญญาณ "เกิดขึ้นแล้ว" (หลังกด) ด้วยเสมอสำหรับ action ที่ mutate state ถาวร (บันทึกลง DB) — โดยเฉพาะ flow ที่ "ประเมิน" กับ "บันทึก" ถูกซ่อนไว้เป็น action เดียวกันเพื่อความเร็ว (1 ปุ่มจบ) ต้องชดเชยด้วย feedback ที่ชัดกว่าฟอร์มปกติที่แยก 2 ปุ่ม.

## รอบที่ 17 — bug จริง: จัดอันดับ Module 1 แล้ว "หาย" เงียบ ๆ ไม่ error ไม่มีชื่อ (1 ก.ค. 2026)

**อาการที่เจอ:** ทดสอบ "นำเข้า Resume" (Module 1, PDF import) ด้วย CV จริงตัวเดียวกับที่ผ่านมา — กด "จัดอันดับด้วย AI (1 ไฟล์)" แล้ว**ไม่มี error ขึ้นเลย** แต่ก็ไม่มีชื่อผู้สมัครโผล่มาให้เลือกเช่นกัน เห็นแค่ปุ่ม "อนุมัติ 0 คน → Tracker" สีเทา — ต่างจาก bug ของ Module 2 ก่อนหน้า (รอบที่ 15) ตรงที่ครั้งนี้ **ไม่มี error message ใด ๆ** ให้ไล่ตามเลย เป็นเคส "สำเร็จแต่ผลว่างเปล่า" ล้วน ๆ.

**หาสาเหตุ (ไล่ยืนยันด้วยการรันจริง ไม่เดา):**
1. ตรวจ `RankedCandidateSchema` (`types.ts:41`) พบ `sourceUrl: z.string().url().nullable()` — ตั้งสมมติฐานว่า Claude อาจคืน `""` แทน `null` สำหรับ candidate จาก MANUAL/PDF (ไม่มี URL จริง) แล้ว zod reject เงียบ ๆ
2. ทดสอบยืนยันด้วย `RankResultSchema.safeParse()` ตรง ๆ (นอก live API เพราะ key ในเครื่องหมดอายุ) — **ยืนยันว่า `sourceUrl: ""` ทำให้ validate fail จริง** ("Invalid URL") แต่ `null` ผ่าน. แก้จุดนี้ไปเป็นการป้องกันเชิงป้องกัน (defensive fix) แล้ว
3. **แต่ผู้ใช้ยืนยันว่าไม่มี error ขึ้นเลย** — แปลว่า root cause จริงไม่ใช่ zod error (ถ้าเป็น zod error จะเห็น error message สีแดงตาม `aiError()` ที่ `pdf-import.tsx` โชว์อยู่แล้ว) แต่คือ **`rankCandidates()` สำเร็จแล้วคืน `shortlist: []`** — Claude ตัดสินใจ "drop" candidate ออกจากผลลัพธ์ทั้งที่ CV (Data Analyst) กับ JD ที่เลือกไว้ (Data Analyst) ตรงกันชัดเจน ไม่ควรถูกตัดตามเจตนาของ prompt เดิมด้วยซ้ำ — prompt เดิมอนุญาตให้ AI ใช้ judgment ตัดสินใจ drop เองได้ ("Only drop entries that are clearly irrelevant") ซึ่งเปิดช่องให้เกิดพฤติกรรมแบบนี้โดยไม่มีทางรู้ว่า AI ใช้เหตุผลอะไรตัดสินใจ (ไม่มี field อธิบายว่าทำไมถึงไม่อยู่ใน output — เพราะมันหายไปเลย ไม่ใช่ concern ที่บอกไว้)

**ผู้ใช้ตัดสิน:** "เอาทุกคนแม้ไม่ตรงสาย" — เปลี่ยนกฎจาก **"AI ใช้ judgment เลือกตัดคนที่ไม่ตรงสายจริง ๆ ออก"** เป็น **"ห้ามตัดใครออกจาก output เด็ดขาด ไม่ว่าคะแนนต่ำแค่ไหน"**. เหตุผลของ decision นี้: การให้ AI มีอำนาจ "ซ่อน" candidate ทั้งคนออกจาก HR โดยไม่มีร่องรอย เป็นความเสี่ยงที่แย่กว่าการโชว์คนคะแนนต่ำให้เห็น — คนนั้นอาจจะเข้าเกณฑ์จริงในมุมที่ AI มองไม่เห็น (เช่น กำลังจะเปลี่ยนสาย, HR รู้จักเป็นการส่วนตัว) การไม่ให้เห็นเลยตัดโอกาสตัดสินใจของมนุษย์ทิ้งไปทั้งหมด — ย้อนกลับไปหลักการเดียวกับรอบที่ 11 ("AI = judgment, โค้ด/มนุษย์ = ตัดสินใจสุดท้าย") แต่คราวนี้ปัญหาคือ "AI ไม่ควรมีสิทธิ์ตัดสินใจแม้แต่ว่าใครควร 'ปรากฏ' ให้เห็นหรือไม่".

**แก้:**
1. `rankCandidates()` prompt (`ai.ts`) เปลี่ยนจาก "only drop clearly irrelevant" → **"NEVER drop a candidate... every entry in the input must appear exactly once in the output shortlist"** — ให้คะแนนต่ำได้ (fitScore <20) แต่ห้ามหายไปจาก output เด็ดขาด ครอบคลุมทุก source ไม่ใช่แค่ MANUAL (เพราะ `rankCandidates()` ใช้ร่วมกันทั้ง CSV import, PDF import, และ live web-search sourcing — แก้จุดเดียวกระทบทั้ง 3 flow)
2. `pdf-import.tsx` เพิ่ม guard เผื่อ AI ยังพลาดทำตามไม่ครบ (safety net ไม่ใช่ fix หลัก): ถ้า `shortlist.length === 0` ทั้งที่ `ok: true` ให้ขึ้นข้อความอธิบายตรง ๆ แทนที่จะเงียบเป็นปุ่ม "อนุมัติ 0 คน" ที่ไม่มีคำอธิบาย
3. `types.ts` เก็บ fix zod `sourceUrl` empty-string→null ไว้ด้วย (พบระหว่างไล่สาเหตุ แม้จะไม่ใช่ root cause ของเคสนี้ แต่เป็น bug จริงที่ยืนยันแล้วว่าเกิดได้ — ป้องกันไว้ก่อน)

**บทเรียน:** เมื่อ symptom คือ "เงียบหายไปเลย ไม่มี error" ต้องแยกให้ออกว่าเป็น (a) validation ล้มเหลว throw แล้ว error หาย เพราะ UI ไม่โชว์ หรือ (b) logic สำเร็จแต่ผลลัพธ์ที่ได้ "ว่างเปล่าโดยตั้งใจ" จาก judgment ของ AI เอง — สองเคสนี้แก้คนละจุด อย่ารีบสรุปว่าใช่ (a) เพราะมันมีร่องรอยเป็น error message ให้ตามง่ายกว่า ต้องถามผู้ใช้ยืนยันอาการจริงก่อนฟันธง สมมติฐานแรก (zod empty-string) พิสูจน์แล้วว่ามีจริงแต่ไม่ใช่สาเหตุของเคสนี้ — เก็บไว้เป็น defensive fix ไม่ใช่ fix ตัวที่แก้ปัญหาจริง.

## รอบที่ 18 — score card เป็น radar chart (ไอเดียผู้ใช้, 1 ก.ค. 2026)

**ผู้ใช้เสนอ:** เห็น score card 3 การ์ดแยก (Skills/Exp/Culture) แล้วถามว่า "ทำเป็นแบบเกมฟุตบอล (FIFA/FM) ดีไหม" — สนุกกว่าดูตัวเลขเรียงกัน.

**ชั่งน้ำหนักก่อนทำ:** PRODUCT.md (รอบที่ 5) กำหนด personality ของแอปไว้ชัดว่า "มืออาชีพ แม่นยำ น่าเชื่อถือ" เพราะเป็น tool ที่ HR ใช้ตัดสินใจเรื่องจ้างงานจริง — สไตล์ FIFA/FM เต็มรูปแบบ (stat card นักเตะ, ป้ายเรตติ้งจี๊ดจ๊าด) เสี่ยงดึง tone ไปทาง "เกม/บันเทิง" ขัดกับความรู้สึก "นี่คือการประเมินคนจริงจัง" เสนอ 3 ทางเลือกให้ผู้ใช้ชั่งน้ำหนักเอง (คงเดิม / radar chart / FIFA เต็มรูปแบบ) แทนที่จะตัดสินใจแทน.

**ผู้ใช้เลือก radar/pentagon chart** — จุดกึ่งกลาง: ได้ "เห็นรูปทรงเดียวจบ" แบบเกม (สนุกกว่าอ่านตัวเลข 3 การ์ดแยก) แต่ยังเป็น business dashboard visualization ไม่ใช่ของเล่น.

**ทำ:** เพิ่ม `RadarTriangle` ใน `score-card.tsx` — pure SVG ไม่พึ่ง chart library (ตาม pattern zero-dependency ที่เลือกไว้ตั้งแต่ report PDF ในรอบที่ 7) วาดสามเหลี่ยม 3 แกน (Skills/Exp/Culture ที่ 12/4/8 นาฬิกา) พร้อม grid ring อ้างอิงสเกล 25/50/75/100%, สีเปลี่ยนเป็นสีแดง (`--score-low`) อัตโนมัติถ้าทุกแกน ≤3 (คนไม่ตรงสายชัดเจน). วางไว้ข้างการ์ด 3 แกนเดิม (ไม่ลบของเดิม เพราะยังต้องอ่าน reasoning ข้อความ) และใส่ `no-print` เพราะรายงาน PDF เน้นอ่านข้อความชัดเจนอยู่แล้ว (decision เดิมจากรอบที่ 7 เรื่อง print-to-PDF).

**ทดสอบก่อนส่ง:** เปิด dev server จริง + Playwright screenshot หน้า `/screener` ก่อน แต่ต้องเรียก AI จริงถึงจะมีผลลัพธ์ให้ดู radar — ไม่อยากเรียก AI จริงเพื่อทดสอบ UI ล้วนๆ (เปลืองและ API key ในเครื่องหมดอายุพอดี) เลยสร้างหน้า preview ชั่วคราว render `ScoreCard` ตรงด้วยข้อมูล mock (ตัวเลขเดียวกับตัวอย่างที่ผู้ใช้ส่งมา: 9/9/7) เพื่อยืนยันภาพจริงในเบราว์เซอร์ แล้วลบหน้า preview + สคริปต์ screenshot ทิ้งทั้งหมดก่อน commit — ไม่ทิ้งร่องรอย debug ไว้ใน repo.

**บทเรียน:** ไอเดียเชิงเปรียบเทียบจากผู้ใช้ ("ทำเป็นแบบ X ดีไหม") มักมีแก่นที่ดี (ในที่นี้คือ "อยากเห็นภาพรวมเร็วกว่าตัวเลขแยก") แต่ตัวอย่างอ้างอิง (FIFA) อาจไม่ใช่ทางที่เหมาะสมกับ tone ของ product เสมอไป — หน้าที่คือแยกแก่นความต้องการออกจากตัวอย่างที่ยกมา แล้วเสนอทางที่ตอบแก่นนั้นโดยเข้ากับ personality ที่ตั้งไว้ตั้งแต่ต้น ไม่ใช่รับทำตามตัวอย่างตรงๆ หรือปฏิเสธเพราะกลัวไม่เข้า tone.

## รอบที่ 19 — sub-attribute แบบ FM attribute sheet ใต้แต่ละแกน (ผู้ใช้ต่อยอด, 1 ก.ค. 2026)

**ผู้ใช้ถามต่อจากรอบที่ 18:** "ถ้ามีเกณฑ์ย่อยข้างในมาช่วยขยายความว่าทำไมถึง 9 ถึง 7 จะขัดกับส่วนไหนไหม จะช่วยมองภาพออกไหม" — เชิงสำรวจ ยังไม่ให้แก้ทันที.

**ตอบก่อนลงมือ (สำรวจ 2 คำถามของผู้ใช้):**
1. ขัดไหม — ไม่ขัด zod/`structured()` (รองรับ nested schema อยู่แล้ว) แต่มีความเสี่ยงเดิมที่เคยแก้ไปแล้ว 2 รอบ (10-11) กลับมาได้: ยิ่งมีจุดตัดสินใจย่อยเยอะ ยิ่งเพิ่มความเสี่ยง drift แม้ temp=0 จะช่วยลดก็ตาม + ถ้าคะแนนรวมแกนกับผลรวม sub-score ไม่ตรงกันจะดูไม่น่าเชื่อถือทันที (ต้องตัดสินใจว่า sub-score derive คะแนนรวมหรือ AI ให้แยกกัน).
2. ช่วยมองภาพไหม — ขึ้นกับรูปแบบ: ถ้าเป็น bullet evidence (แค่เปลี่ยน format ของ reasoning เดิม) ช่วยชัวร์ ถ้าเป็นคะแนนย่อยจริง ช่วยเห็น "อ่อนตรงไหนในแกนนั้น" แต่แลกกับความหนาแน่นข้อมูลที่เพิ่มขึ้น.

**ผู้ใช้ชี้แจงเจตนา:** ไม่ใช่ bullet ข้อความ อยากได้ "ค่าพลังแบบ Football Manager" จริง — sub-attribute ต้องมีตัวเลขของตัวเอง (เช่น Passing 15) ไม่ใช่แค่ label+สี.

**คำถามที่ผู้ใช้ถามกลับ (สำคัญ, ควรบันทึกไว้):** "อ่านจาก CV จะรู้ได้ยังไงว่าควรเป็นตัวเลขเท่าไหร่" — คำตอบคือกลไกเดียวกับคะแนนหลัก 3 แกนที่มีอยู่แล้ว (anchored rubric, รอบที่ 10): AI ไม่ได้เดา แต่เทียบ evidence ใน CV กับคำอธิบายของแต่ละช่วงคะแนนที่เขียนกำกับไว้ใน prompt ตรงๆ, sub-attribute แค่ต้องมี rubric แบบเดียวกันแต่แคบลง (จุดตัดสินใจเพิ่มจาก 3 เป็น 9 จุด ไม่ใช่กลไกใหม่).

**ตัดสินใจ (ถามผู้ใช้ทีละจุด แทนเดาเอง):**
- คะแนนแกนหลักกับ sub-score: **AI ให้ทั้งคู่แยกกันอิสระ** ไม่คำนวณจากกัน (sub-score เป็นแค่ breakdown ประกอบเหตุผล ไม่ใช่ที่มาของคะแนนรวม) — ยอมรับความเสี่ยงที่ตัวเลขอาจไม่ tie กันเป๊ะ 100% แลกกับการให้ AI ใช้ nuance ที่เห็นจาก CV โดยรวมได้เต็มที่ ไม่ถูกบังคับด้วยสูตร
- สเกล: **0-10** (เหมือนคะแนนหลัก ไม่ใช้ 0-20 แบบ FM จริงเพื่อลดจำนวนสเกลที่ต้องเทียบกันในหน้าเดียว)
- จำนวน: **3 sub-attribute ต่อแกน** (รวม 9 ตัวเลขย่อยทั้งการ์ด)
- ชื่อ sub-attribute ของ **Skills: dynamic ตาม JD** (AI เลือกเอง 3 must-have ที่สำคัญสุดจาก JD นั้นๆ — candidate หลายคนใน JD เดียวกันเทียบกันได้สบาย, แต่ JD ต่างกันชื่อจะเปลี่ยน) ส่วน **Experience/Culture: ชื่อคงที่ตายตัว** (Seniority/Scope, Domain Match, Track Record · Collaboration, Communication, Leadership/Mentorship) เพราะ 2 แกนนี้ไม่ผูกกับ skill เฉพาะทาง ควรเทียบข้าม JD ได้เหมือนกันเสมอ.

**ทำ:**
1. `types.ts` — เพิ่ม `SubAttributeSchema` (label+score 0-10) และ `subAttributes: { skills[3], experience[3], culture[3] }` เข้า `ScreeningSchema` (required) + `SCREENING_TOOL_SCHEMA` คู่กัน
2. `ai.ts` — เพิ่ม rubric ใหม่ในระบบ prompt สั่งชัดว่า sub-attribute "explain the axis score, do not derive it" (กันไม่ให้ AI พยายามบังคับให้ sub-score เฉลี่ยออกมาตรงกับคะแนนหลักเป๊ะ ซึ่งจะเสียความหมายของ nuance ที่ตั้งใจให้มี) พร้อม anchored logic แยกต่อกลุ่ม (skills ใช้ logic เดียวกับ skillsFit, culture บอกชัดให้ default ต่ำถ้าไม่มีหลักฐาน mentorship)
3. **DB migration ใหม่** `0007_screening_sub_attributes.sql` — เพิ่ม column `sub_attributes jsonb default '{}'`, idempotent + backward compatible (แถวเก่าไม่มีค่า อ่านเป็น "ไม่มี breakdown" ไม่ error)
4. `lib/types.ts` (`ScreeningResult`) + `lib/mappers.ts` (`toScreening`) — เพิ่ม `subAttributes` เป็น **optional** เพราะ interface นี้ map จาก DB row ที่อาจเป็นข้อมูลเก่าก่อน migration
5. `screener/actions.ts` — persist `sub_attributes` ตอน upsert
6. `score-card.tsx` — เพิ่ม `SubAttributeRow` (FM attribute-sheet style: label สั้น + bar เส้นเล็ก + ตัวเลข) render ต่อท้าย reasoning ในแต่ละ `Axis` การ์ด. เปลี่ยน prop type ของ `ScoreCard` จาก `Screening` (import ตรง, required ทุกฟิลด์) เป็น `ScoreCardData` (structural interface ที่ประกาศเอง, `subAttributes` optional) เพราะ component ต้อง render ได้ทั้งผลจาก AI สดๆ (Module 2, ครบทุกฟิลด์) และผลเก่าที่โหลดจาก DB ผ่าน Tracker (Module 3, `ScreeningResult` ที่อาจไม่มี sub-attribute) — สอง type เดิมไม่ compatible กันตรงๆ ถ้าไม่ทำ interface กลาง

**ทดสอบก่อนส่ง:** ใช้ pattern เดิมจากรอบที่ 18 (preview route ชั่วคราว + Playwright screenshot ด้วยข้อมูล mock) ยืนยันภาพจริงว่า sub-attribute แสดงถูกต้องใต้แต่ละการ์ด ก่อนลบ scaffolding ทิ้งทั้งหมด.

**บทเรียน:** ผู้ใช้ทวนคำถามเดิม ("อ่านจาก CV รู้ได้ยังไง") ซ้ำ 2 รอบก่อนจะเข้าใจตรงกันว่ากลไกคือ rubric ไม่ใช่การเดา — สะท้อนว่าอธิบาย "ทำไมตัวเลขนี้เชื่อถือได้" สำคัญพอๆ กับตัวฟีเจอร์เอง โดยเฉพาะ tool ที่ output เป็นตัวเลขตัดสินคน ถ้าผู้ใช้เองยังไม่มั่นใจว่าตัวเลขมาจากไหน ต่อให้ฟีเจอร์ทำงานถูกก็ไม่ควรส่งมอบโดยไม่อธิบายให้ชัดก่อน.

## รอบที่ 20 — bug จริง: sub-attribute schema พัง Screener ทั้งระบบบน production (1 ก.ค. 2026)

**อาการที่เจอ:** หลัง deploy รอบที่ 19 (sub-attribute breakdown) ไปแล้ว ทดสอบจริงบน production พบว่า "ประเมินด้วย AI" ล้มเหลว **ทุกครั้ง ไม่ว่า CV/JD อะไรก็ตาม** — error โชว์ตรง ๆ บนหน้าจอ: `400 {"type":"invalid_request_error","message":"tools.0.custom: For 'array' type, 'minItems' values other than 0 or 1 are not supported (got: [2, 5])"}`. ต่างจาก bug ก่อนหน้า (รอบ 15, 17) ตรงที่ครั้งนี้ error โผล่ตรงๆ ไม่ต้องไล่หา — Claude API เองเป็นคนบอกสาเหตุ.

**สาเหตุ:** `SCREENING_TOOL_SCHEMA` (`types.ts`) ที่เพิ่งเพิ่มในรอบที่ 19 ใส่ `minItems: 3, maxItems: 3` ให้ array ของ sub-attribute ทั้ง 3 แกน (skills/experience/culture) เพื่อบังคับว่าต้องมีครบ 3 รายการเป๊ะ — แต่ **Claude's tool-use JSON schema รองรับ `minItems` แค่ค่า 0 หรือ 1 เท่านั้น** ค่าอื่นถูก reject ทันทีด้วย 400 ก่อนโมเดลจะเริ่มประมวลผลเลย ทำให้ `runScreening()` throw ทุกครั้ง ไม่ว่า input จะเป็นอะไร — เป็นข้อจำกัดของ API ที่ไม่ได้ระบุชัดใน docs ทั่วไป ต้องเจอ error จริงถึงจะรู้.

**แก้:** เอา `minItems`/`maxItems` ออกจาก JSON schema ทั้ง 3 จุด — ย้ายการบังคับ "ต้องมีเป๊ะ 3 รายการ" ไปเป็น 2 ชั้นแทน (1) คำอธิบายในฟิลด์ `description` ของ schema เอง ("EXACTLY 3 items...") ให้ AI อ่านแล้วทำตาม (2) `zod` (`.length(3)`) ที่ `ScreeningSchema` re-validate ผลลัพธ์หลัง Claude ตอบกลับมาอยู่แล้วเป็นด่านสุดท้ายจับความผิดพลาดถ้า AI ไม่ทำตาม.

**บทเรียน:** API ของ provider มีข้อจำกัดที่ไม่ได้ intuitive เสมอ (เช่น "ทำไม array ถึงบังคับความยาวไม่ได้") — เจอ 400 error ต้องอ่าน error message ให้ละเอียดก่อนเดา เพราะ Claude บอกสาเหตุตรง ๆ ในข้อความอยู่แล้ว (`minItems values other than 0 or 1 are not supported`) ไม่ต้อง debug อ้อม. และ feature ใหม่ที่เพิ่ง merge ควรทดสอบยิง production จริงทันทีหลัง deploy ก่อนจะประกาศว่า "เสร็จสมบูรณ์" — ในรอบที่แล้วบันทึกไว้ว่างานเสร็จ 100% ทั้งที่ยังไม่ได้ยืนยันว่า production ใช้งานได้จริงกับ feature ที่เพิ่งเพิ่ม (ทดสอบแค่ mock data ในเบราว์เซอร์ ไม่ใช่ end-to-end ผ่าน Claude จริง) — ช่องว่างนี้คือสิ่งที่ทำให้ bug หลุดไปถึงมือผู้ใช้.
