# Google OAuth — ตั้งค่าทั้ง Login + Calendar

แอปนี้ใช้ Google **2 จุด คนละหน้าที่ คนละ callback** — ห้ามสับสนกัน:

| # | ใช้ทำอะไร | Redirect URI (callback) | ตั้งที่ |
|---|-----------|--------------------------|---------|
| **1. Login** | เข้าสู่ระบบก่อนใช้แอป (ทั้งเว็บ) | `https://<PROJECT>.supabase.co/auth/v1/callback` | Supabase + Google Cloud |
| **2. Calendar** | Module 4 — สร้างนัด + Meet link | `https://<APP>.vercel.app/api/google/callback` | Vercel env + Google Cloud |

> `<PROJECT>` = project ref ของ Supabase · `<APP>` = `recruiting-pipeline-tool` (โดเมน Vercel)
> Local dev ใช้ `http://localhost:3000` แทน `https://<APP>.vercel.app`

---

## ส่วนที่ 0 — เตรียม Google Cloud (ทำครั้งเดียว)

1. ไป [console.cloud.google.com](https://console.cloud.google.com) → login
2. มุมบนซ้าย dropdown → **New Project** → ตั้งชื่อ `recruiting-tool` → **Create** → เลือก project นั้น
3. ค้นหาบนสุด **"Google Calendar API"** → เปิด → **Enable** (จำเป็นสำหรับ Calendar)
4. เมนู **APIs & Services → OAuth consent screen**:
   - User Type = **External** → Create
   - App name / support email / developer email → กรอก → Save and Continue
   - Scopes → Save and Continue (ข้าม)
   - 🔴 **Test users → + Add Users → ใส่อีเมล Google ของคุณ** (ไม่ใส่ = ถูกบล็อก) → Save

---

## ส่วนที่ 1 — Login (Supabase Auth)

### 1A. เอา Callback URL จาก Supabase
1. Supabase Dashboard → **Authentication → Providers → Google** → เปิด **Enable**
2. คัดลอก **Callback URL (for OAuth)** ที่แสดง — รูปแบบ:
   ```
   https://<PROJECT>.supabase.co/auth/v1/callback
   ```

### 1B. สร้าง OAuth client (login)
3. Google Cloud → **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
4. Application type = **Web application** · Name = `recruiting-login`
5. **Authorized redirect URIs → + Add URI** → วาง **Callback URL จากข้อ 2**
6. **Create** → คัดลอก **Client ID** + **Client Secret**

### 1C. กรอกกลับ Supabase + ตั้ง URL
7. Supabase (ข้อ 1) → วาง **Client ID** + **Client Secret** → **Save**
8. Supabase → **Authentication → URL Configuration**:
   - **Site URL** = `https://<APP>.vercel.app`
   - **Redirect URLs** → Add:
     ```
     https://<APP>.vercel.app/**
     http://localhost:3000/**
     ```

### 1D. ทดสอบ Login
- เปิดเว็บ → เด้งไป `/login` อัตโนมัติ → กด **"เข้าสู่ระบบด้วย Google"** → เลือกบัญชี (ที่อยู่ใน Test users) → อนุญาต → กลับเข้า **Tracker** + เห็นอีเมลมุมล่างซ้าย ✅

> Login **ไม่ต้องใส่ env เพิ่ม** — ใช้ `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` ที่มีอยู่. Client ID/Secret ของ login เก็บใน Supabase Dashboard ไม่ใช่ใน `.env`.

---

## ส่วนที่ 2 — Calendar (Module 4 Scheduler)

### 2A. สร้าง OAuth client (calendar) — แยกจาก login
1. Google Cloud → **Credentials → + Create Credentials → OAuth client ID**
2. Application type = **Web application** · Name = `recruiting-calendar`
3. **Authorized redirect URIs → + Add URI** → ใส่ **2 อัน**:
   ```
   http://localhost:3000/api/google/callback
   https://<APP>.vercel.app/api/google/callback
   ```
4. **Create** → คัดลอก **Client ID** + **Client Secret**

### 2B. ใส่ env (Vercel + `.env.local`)
```
GOOGLE_CLIENT_ID=<client id ของ calendar>
GOOGLE_CLIENT_SECRET=<client secret ของ calendar>
GOOGLE_REDIRECT_URI=https://<APP>.vercel.app/api/google/callback   # dev ใช้ localhost
```
> `GOOGLE_REDIRECT_URI` ต้อง **ตรงเป๊ะ** กับ URI ที่ใส่ในข้อ 3 (รวม https, ไม่มี `/` ท้าย).

### 2C. ทดสอบ Calendar
- หน้า **Interview Scheduler** → **"เชื่อมต่อ Google Calendar"** → อนุญาต → สร้างนัด → ได้ **Meet link จริง** + สถานะใน Tracker เลื่อนเป็น First Interview ✅

---

## Error ที่เจอบ่อย + วิธีแก้

| Error | จุดที่ผิด | แก้ |
|-------|-----------|-----|
| `redirect_uri_mismatch` | redirect URI ไม่ตรง | เทียบ URI ใน Google Cloud กับ Callback/`GOOGLE_REDIRECT_URI` ให้ตรงเป๊ะทุกตัวอักษร |
| `access_blocked` / app not verified | ลืมใส่ Test user | ส่วนที่ 0 ข้อ 4 → ใส่อีเมลตัวเอง |
| login วน /login ไม่เข้า | Redirect URLs ใน Supabase ไม่ครบ | ส่วน 1C ข้อ 8 → เพิ่ม `…/**` |
| กด login แล้ว error ทันที | Google provider ยังไม่ Save / Client ID ผิด | ส่วน 1C ข้อ 7 |
| Calendar เชื่อมแล้วแต่ไม่มี Meet link | Calendar API ไม่ได้ Enable | ส่วนที่ 0 ข้อ 3 |

---

## เช็กลิสต์รวม

- [ ] เปิด Google Calendar API
- [ ] OAuth consent screen + **Test user = อีเมลตัวเอง**
- [ ] OAuth client **#1 login** → redirect = Supabase callback → ใส่ใน Supabase provider
- [ ] Supabase URL Configuration (Site URL + Redirect URLs)
- [ ] OAuth client **#2 calendar** → redirect = `…/api/google/callback` → ใส่ env ใน Vercel
- [ ] Redeploy → ทดสอบ login → ทดสอบเชื่อม Calendar + สร้างนัด
