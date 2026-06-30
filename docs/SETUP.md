# คู่มือตั้งค่า (Setup) — ทำตามทีละ Step

สิ่งที่ผู้ใช้ต้องทำเอง (ต้องการ key/บัญชี) เพื่อให้ระบบทำงานครบ. โค้ดพร้อมแล้วทั้งหมด.

> ลำดับความสำคัญ: **STEP 1-2 (Supabase + Anthropic)** ทำให้ 3/4 module ใช้ได้ →
> **STEP 3 (Auth)** login → **STEP 4 (Calendar)** Module 4 → **STEP 5/6** optional.

---

## STEP 1 — Supabase Database

1. [supabase.com](https://supabase.com) → **New Project** (ตั้ง DB password, region = Singapore)
2. **SQL Editor → New query** → รันทีละไฟล์ (จาก `supabase/migrations/`):
   - `0001_init.sql` (ตาราง)
   - `0002_seed_job.sql` (JD ตัวอย่าง)
   - `0003_enable_rls.sql` (ปิด public API — security)
   - `0004_screening_confidence.sql` (คอลัมน์ confidence/recommendation ของ Screener)
3. **Storage → New bucket** → ชื่อ `resumes`
4. **Project Settings → API** → จด: Project URL, anon key, service_role key

---

## STEP 2 — Environment Variables (Vercel หรือ `.env.local`)

ดู `.env.example` เป็นแม่แบบ. ตัวที่ขึ้นต้น `NEXT_PUBLIC_` = เปิดเผยได้; ที่เหลือเป็นความลับ.

| Key | จาก | ความลับ? |
|-----|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API (base URL เปล่า ๆ — **ไม่มี** `/rest/v1/`) | 🟢 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API (กด Mark as Safe ใน Vercel ได้) | 🟢 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API | 🔴 |
| `ANTHROPIC_API_KEY` | console.anthropic.com (ต้องเติมเครดิต) | 🔴 |

> ⚠️ จุดพลาดบ่อย: `NEXT_PUBLIC_SUPABASE_URL` ต้องเป็น `https://xxxx.supabase.co` **เท่านั้น** —
> ห้ามมี `/rest/v1/` ต่อท้าย (client เติมเอง) ไม่งั้น query 404 ทุกครั้ง.

---

## STEP 3 — Google Login (Supabase Auth) 🔐

> 📖 ละเอียดทั้ง Login + Calendar รวมในไฟล์เดียว: **[`docs/GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md)**

ทำให้ทั้งแอปต้อง login ด้วย Google ก่อนเข้า. โค้ดพร้อม (middleware + /login).

### A. เปิด Google provider ใน Supabase
1. Supabase → **Authentication → Providers → Google** → Enable
2. คัดลอก **Callback URL** ที่แสดง (เช่น `https://xxxx.supabase.co/auth/v1/callback`)

### B. สร้าง OAuth client (Google Cloud)
3. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
4. **Create Credentials → OAuth client ID → Web application** (ชื่อ `recruiting-login`)
5. **Authorized redirect URIs** → ใส่ **Callback URL จากข้อ 2**
6. Create → copy **Client ID** + **Client Secret**

### C. กรอกกลับ Supabase + ตั้ง URL
7. Supabase (ข้อ 1) → วาง Client ID + Secret → Save
8. Supabase → **Authentication → URL Configuration**:
   - **Site URL** = `https://recruiting-pipeline-tool.vercel.app`
   - **Redirect URLs** (Add): `https://recruiting-pipeline-tool.vercel.app/**` และ `http://localhost:3000/**`

### ทดสอบ
เปิดเว็บ → เด้งไป `/login` → กด "เข้าสู่ระบบด้วย Google" → เลือกบัญชี → กลับเข้า Tracker + เห็นอีเมลมุมล่างซ้าย = ✅

---

## STEP 4 — Google Calendar (Module 4 Scheduler) 📅

ต่างจาก STEP 3 — อันนี้คือ "เชื่อม Calendar เพื่อสร้างนัด Meet" ไม่ใช่ login.

1. Google Cloud (project เดิม) → **Library → Google Calendar API → Enable**
2. **OAuth consent screen** → External → กรอกข้อมูล → **Test users → ใส่อีเมลตัวเอง** (สำคัญ!)
3. **Credentials → Create OAuth client ID → Web application** (ชื่อ `recruiting-calendar`)
4. **Authorized redirect URIs** → ใส่ 2 อัน:
   - `http://localhost:3000/api/google/callback`
   - `https://recruiting-pipeline-tool.vercel.app/api/google/callback`
5. copy Client ID/Secret → ใส่ env:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` = `https://recruiting-pipeline-tool.vercel.app/api/google/callback` (live) หรือ localhost (dev)

> 🔑 มี OAuth client **2 ตัว คนละ callback**: login → `...supabase.co/auth/v1/callback`,
> calendar → `...vercel.app/api/google/callback`. อย่าสับสน.

### ทดสอบ
หน้า Scheduler → "เชื่อมต่อ Google Calendar" → อนุญาต → สร้างนัด → ได้ Meet link จริง + sync stage.

---

## STEP 5 — Apify (LinkedIn + Facebook sources, optional) 🔗

ทำให้ Module 1 ค้น **LinkedIn profiles + Facebook job-groups** ได้จริง. รันใน Vercel
(ไม่ต้อง deploy scraper) — เป็น API call ไม่ใช่ browser. ข้ามได้ถ้าใช้แค่ GitHub/Web Search.

1. สมัคร [apify.com](https://apify.com) (free tier ~$5 เครดิต/เดือน)
2. **Settings → Integrations → API tokens** → copy token (`apify_api_...`)
3. Vercel → Environment Variables:
   - `APIFY_TOKEN` = token จากข้อ 2
   - (optional) `APIFY_LINKEDIN_ACTOR` = actor id อื่น ถ้า default ใช้ไม่ได้ (หาใน apify.com/store → "linkedin profile")
4. **Redeploy**

**วิธีใช้:**
- **LinkedIn** — ค้นจาก keyword ไม่ต้องระบุกลุ่ม. เลือก LinkedIn ในหน้า Sourcing แล้วค้นได้เลย.
- **Facebook** — ต้องระบุกลุ่ม. เลือก Facebook → ช่องกรอกจะโผล่ → วาง **group URL** (บรรทัดละ 1) ที่เป็นกลุ่มหางาน เช่น `https://www.facebook.com/groups/<id>`. เว้นว่าง = ข้าม FB.

> ดึงทีละ ~10 คน/ครั้ง (คุม free tier). LinkedIn actor แพงกว่า FB — $5 ฟรีได้ ~100-300 profile.

---

## STEP 6 — OpenAI (poster, optional) 🖼️

ปุ่ม "สร้างรูปประกาศ" ใน JD Generator. ข้ามได้ถ้าไม่ใช้.

- `OPENAI_API_KEY` จาก platform.openai.com (เติมเงิน + อาจต้อง verify org สำหรับ gpt-image-1)

---

## STEP 7 — Scraper service บน Cloud Run (optional) 🔍

> Module 1 ค้นได้ครบบน Vercel แล้ว (Web Search + GitHub + LinkedIn/Facebook ผ่าน Apify).
> scraper service เหลือหน้าที่เดียว = **scrape job board (JobsDB/JobThai) ด้วย Playwright**
> ซึ่งรันบน Vercel ไม่ได้ (browser หนัก). deploy บน **Google Cloud Run** เฉพาะถ้าต้องการแหล่งนี้.

### เตรียม (ครั้งเดียว)
1. ติดตั้ง **gcloud CLI** → [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. login + เลือก project (ใช้ project เดียวกับ Calendar API ได้):
   ```bash
   gcloud auth login
   gcloud config set project <PROJECT_ID>
   ```
3. เปิด services ที่ต้องใช้:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```

### Deploy
รันจากโฟลเดอร์ `scraper/` (มี Dockerfile อยู่แล้ว):
```bash
cd recruiting-tool/scraper
gcloud run deploy recruiting-scraper \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 120 \
  --set-env-vars SCRAPER_INGEST_SECRET=<ตั้ง secret มั่ว ๆ>,APIFY_TOKEN=<ถ้าจะใช้ผ่าน scraper ด้วย>
```
> 🔴 **memory 1Gi จำเป็น** — Playwright เปิด Chromium จริง ถ้าน้อยกว่านี้ crash.
> Build รอบแรก ~3-5 นาที (build Docker image). เสร็จแล้ว gcloud โชว์ **Service URL**.

### เชื่อมกับ Vercel
ใส่ env 2 ตัว (Vercel → Environment Variables) แล้ว **Redeploy**:
| Key | Value |
|-----|-------|
| `SCRAPER_SERVICE_URL` | Service URL จาก Cloud Run (เช่น `https://recruiting-scraper-xxx.run.app`) |
| `SCRAPER_INGEST_SECRET` | secret เดียวกับตอน deploy (ต้องตรงกันเป๊ะ!) |

### ทดสอบ
```bash
curl <SERVICE_URL>/health        # ควรได้ {"ok":true,...}
```
แล้วในหน้า Sourcing → เลือก JobsDB/JobThai → ค้นหา → ดู tally bar ว่า "Scraper (เว็บไซต์งาน)" มีผล

### จุดพลาดบ่อย
| อาการ | สาเหตุ | แก้ |
|------|--------|-----|
| `/scrape` คืน 401 | secret ไม่ตรง | เทียบ `SCRAPER_INGEST_SECRET` 2 ที่ให้ตรง |
| scrape คืน 0 ทุกครั้ง | cold start / selector เปลี่ยน | ลองใหม่ (cold start ~10 วิ), เว็บอาจเปลี่ยน markup |
| deploy fail OOM | memory น้อย | ใส่ `--memory 1Gi` |
| ค่า Cloud Run | scale-to-zero — ไม่ใช้ไม่เสีย | free tier ครอบคลุม demo |

---

## หลังตั้งครบ
1. Vercel → **Redeploy**
2. login → เพิ่ม candidate → ทดสอบ pipeline ครบ (JD → sourcing → screener → tracker → scheduler)
