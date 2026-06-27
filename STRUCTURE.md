# STRUCTURE.md

## เกี่ยวกับโปรเจคนี้

**Jsuper7 Tier List Checker** — เว็บแอปสำหรับตรวจสอบยอดขายและ Tier ของ Affiliate ในแคมเปญ **Jsuper7**

- ผู้ใช้กรอก **เบอร์โทรศัพท์** เพื่อตรวจสอบยอดขาย/Tier ของตัวเองรายเดือน
- **ไม่มีฐานข้อมูลจริง** — ใช้ **Google Sheets เป็น DB** โดยแยกชีทตามเดือน (เช่น `Tierlist_Jan`, `Tierlist_Feb`)
- ยอดขายแบ่งเป็น **3 ช่องทาง**:
  1. หนังสือเตรียมสอบมหาลัย — Tiktok แบรนด์ "JK" — `sale_uni`
  2. หนังสือเตรียมสอบราชการ (ก.พ.) — Tiktok แบรนด์ "JKกพ" — `sale_exam`
  3. JKnowledge Shop — Shopee — `shopee`
- ยอดขายรวมทั้ง 3 ช่องทาง + จำนวนคลิปสะสม จะถูกนำไปคำนวณ **Tier**: `Start → Speed → Super → Star`

> 📄 ยืนยันโครงสร้างจริงจาก export ของ Google Sheet (`Database_Jsuper7-checkTierList.xlsx`) เมื่อ 2026-06-25 — ดูหัวข้อ "โครงสร้าง Google Sheet จริง" ด้านล่าง

---

## โครงสร้างไฟล์

```
Jsuper7-TierList/
│
├── app/
│   ├── page.js                      ← เหลือแค่ state `user` ตัวเดียว — render SearchBox หรือ Dashboard
│   ├── layout.js                    ← Root layout (next/font: Geist/Prompt/Kanit/Sarabun, Vercel Analytics, OG metadata)
│   ├── globals.css                  ← Tailwind v4 import + custom @theme animations (fade-up, shimmer, overlay-in/out, card-in/out)
│   ├── favicon.ico
│   │
│   ├── lib/
│   │   ├── tierConfig.js            ← Config ของแต่ละ Tier (เกณฑ์ยอดขาย, budget, reward, ฟอร์มส่งคลิป)
│   │   ├── getTierInfo.js           ← Pure function คำนวณ tier/progress จาก total_sale (มี unit test คู่กัน)
│   │   ├── getTierInfo.test.js      ← Vitest — ครอบ edge case NaN/boundary ที่เคยพังจริง
│   │   └── checkUser.js             ← fetchTierCheck(phone, monthOffset) — fetch helper ใช้ร่วมกันทุกที่
│   │
│   ├── components/
│   │   ├── SearchBox.js             ← ฟอร์มค้นหาเบอร์โทร ถือ state ของตัวเอง เรียก API เอง
│   │   ├── Dashboard.js             ← แสดงผล + เปลี่ยนเดือน (เรียก API เอง) + logout
│   │   ├── TierProgress.js          ← Progress bar ไปยัง Tier ถัดไป
│   │   └── TierListdetail.js        ← Grid 4 Tier + popup รายละเอียดเงื่อนไข/สิทธิพิเศษ
│   │
│   ├── api/
│   │   ├── check/route.js           ← API หลัก: ค้นหาสมาชิกจาก Google Sheets ตามเดือน (มี cache 60s)
│   │   └── sheet/route.js           ← API เก่า: อ่านชีทชื่อตายตัว (ไม่ได้ใช้แล้วในหน้า UI ปัจจุบัน)
│   │
│   └── admin/
│       ├── page.js                  ← หน้า Login Admin (⚠️ backend /api/admin/login ถูกลบไปแล้ว — ใช้งานไม่ได้)
│       └── dashboard/page.js        ← เมนู Admin (ลิงก์ไปหน้าที่ยังไม่มีอยู่จริง: /admin/clips, /admin/users ฯลฯ)
│
├── public/                          ← โลโก้ของแต่ละช่องทาง + พื้นหลัง
│
├── appscript/
│   └── updateTier.gs                ← Google Apps Script รวม (Tier update + นับคลิป + Mark ซ้ำ + Import ยอดขาย TikTok)
│                                       เก็บไว้เป็น reference เท่านั้น ตัวที่รันจริงต้องวางใน Apps Script editor ของ Google Sheet
│
├── .claude/launch.json              ← config สำหรับ preview tool (npm run dev, autoPort)
├── .env                             ← Google Sheets credentials (SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)
├── CLAUDE.md                        ← คู่มือสำหรับ Claude Code เวลาทำงานในโปรเจคนี้
└── CODE_REVIEW.md                   ← ผลตรวจโค้ดล่าสุด (พบ bug ที่ต้องแก้)
```

---

## Data Flow

```
app/page.js  — ถือ state แค่ user (null = แสดง SearchBox, found = แสดง Dashboard)
        │
        ▼
SearchBox.js                              Dashboard.js
  - ถือ state phone เอง                     - ถือ state monthOffset/monthLoading เอง
  - validate (10 หลัก)                       - เปลี่ยนเดือน → เรียก fetchTierCheck(user.phone, offset)
  - เรียก fetchTierCheck(phone, 0)            - logout → เรียก onLogout() กลับไป page.js
  - สำเร็จ → onFound(data) → page.js setUser
        │                                         │
        └──────────────┬──────────────────────────┘
                        ▼
         app/lib/checkUser.js → fetchTierCheck(phone, monthOffset)
                        │
                        ▼
              POST /api/check  { phone, monthOffset }
                        │
                        ▼
              Google Sheets API (มี cache 60s ต่อ sheetName)
                → เปิดชีท "Tierlist_<เดือน>" (เช่น Tierlist_Jun)
                → หา row ที่ column D (เบอร์โทร) ตรงกัน (normalize ทั้งสองฝั่ง)
                        │
                        ▼
              ส่งกลับ JSON:
                fullname, phone, line, tiktok, profile,
                sale_uni, sale_exam, shopee,   ← ยอดขาย 3 ช่องทาง
                tier,                          ← Tier ที่บันทึกไว้ใน sheet (คอลัมน์ K)
                total_sale,                   ← ยอดขายรวม (คอลัมน์ L, ผ่าน parseSheetNumber กัน NaN)
                total_clip                    ← คลิปสะสม (คอลัมน์ M, ผ่าน parseSheetNumber กัน NaN)
                        │
                        ▼
              Dashboard.js แสดง:
                - การ์ด Profile (Tier ปัจจุบัน + ข้อมูลสมาชิก + ยอดขาย/คลิป)
                - TierProgress (ความก้าวหน้าไปยัง Tier ถัดไป — คำนวณจาก total_sale ผ่าน getTierInfo())
                - การ์ดยอดขายแยกตามช่องทาง (3 การ์ด)
                - TierListDetail (เกณฑ์ของทุก Tier + popup รายละเอียด)
```

> ⚠️ **ข้อควรระวัง (อัปเดต — ยืนยันสาเหตุจริงแล้ว):** Tier ที่แสดงในการ์ดโปรไฟล์ (`user.tier` จาก sheet) กับ Tier ที่ใช้คำนวณ progress bar (`getTierInfo(total_sale)` คำนวณจาก `tierConfig.js`) **วัดคนละช่วงเวลากันโดยตั้งใจ** ไม่ใช่แค่ความเสี่ยงข้อมูลไม่ตรงกัน — ดูหัวข้อ "ระบบ Automate ใน Google Apps Script" ด้านล่าง

---

## โครงสร้าง Google Sheet จริง (ยืนยันจาก export 2026-06-25)

Spreadsheet มีทั้งหมด **8 ชีท** ไม่ใช่แค่ `Tierlist_*`:

| ชีท | เนื้อหา | ใช้ในโค้ดปัจจุบัน? |
|-----|---------|---------------------|
| `admin_login` | username/password เก็บเป็น **plain text** | ❌ ไม่ใช้แล้ว (`/api/admin/login` ถูกลบ) — ⚠️ ยังเป็นความเสี่ยงด้าน security ถ้า service account ใน `.env` รั่ว |
| `_sync_log` | log จาก **Google Apps Script `updateTier.gs`** ที่รันอยู่ใน spreadsheet เดียวกัน (ฟังก์ชัน `_logToSheet()`) — ยืนยันแล้ว ไม่ใช่ระบบนอก repo ที่ไม่รู้จัก | ❌ ไม่ใช้ในโค้ด Next.js แต่เป็นส่วนสำคัญของระบบ — ดูหัวข้อด้านล่าง |
| `Tierlist_Jan` … `Tierlist_Jun` | ข้อมูลยอดขายรายเดือน (ตรงกับ pattern `Tierlist_<เดือน>` ที่ `app/api/check/route.js` ใช้) | ✅ ใช้งานจริง |

### Column mapping ของชีท `Tierlist_*` (ยืนยัน index ตรงกับโค้ด)

| Index | Col | Header จริงใน Sheet | Field ในโค้ด |
|-------|-----|----------------------|---------------|
| 0 | A | ประทับเวลา | (ไม่ใช้) |
| 1 | B | ชื่อ-นามสกุล | `fullname` |
| 2 | C | ชื่อเล่น | `nickname` |
| 3 | D | เบอร์โทรศัพท์ | `phone` |
| 4 | E | ชื่อ Line | `line` |
| 5 | F | ชื่อบัญชี TikTok | `tiktok` |
| 6 | G | ชื่อร้านค้า Shopee/โปรไฟล์ | `profile` |
| 7 | H | Tiktok JK (ยอด) | `sale_uni` |
| 8 | I | Tiktok JKกพ (ยอด) | `sale_exam` |
| 9 | J | Shopee (ยอด) | `shopee` |
| 10 | K | "คอลัมน์ 8" (header เป็น placeholder แต่ค่าจริงคือ Tier เช่น `Speed⚡`) | `tier` |
| 11 | L | ยอดรวมทั้ง3ช่องทาง | `total_sale` |
| 12 | M | **ไม่คงที่ — ดูคำเตือนด้านล่าง** | `total_clip` |
| 13 | N | หมายเหตุ (หาแอคไม่เจอ) — ใช้โดย `markDuplicates...()` เขียน `"ลงทะเบียนซ้ำ"` (dropdown ตายตัว) | (ไม่ใช้) |
| 14 | O | **ใหม่** — ตรวจสอบยอด TikTok เขียนโดย `_importTiktokSales()` เท่านั้น (ดูหัวข้อด้านล่าง) | (ไม่ใช้) |

> 🔴 **พบ bug จริง — Column M เปลี่ยนความหมายเฉพาะเดือน Jan:**
> - **`Tierlist_Jan`**: header คือ `"ส่งข้อมูล (Tier+link)"` ค่าเป็นข้อความสถานะ เช่น `"ส่งแล้ว"` (ไม่ใช่ตัวเลข)
> - **`Tierlist_Feb`–`Tierlist_Jun`**: header คือ `"จำนวนคลิปสะสม"` ค่าเป็นตัวเลขจริง
>
> ผลคือถ้าผู้ใช้เช็คข้อมูลเดือน **มกราคม**, `total_clip` จะอ่าน `"ส่งแล้ว"` ที่ parse เป็นตัวเลขไม่ได้ — โค้ดปัจจุบัน (`parseSheetNumber()` ใน `app/api/check/route.js`) จะ fallback เป็น `0` อย่างปลอดภัย (ไม่ crash) แต่ตัวเลขที่แสดงจะไม่ตรงความเป็นจริง ถ้าจะแก้ให้ถูกต้องสมบูรณ์ ต้อง normalize column M ในชีท `Tierlist_Jan` ให้เป็น pattern เดียวกับเดือนอื่น

---

## ระบบ Automate ใน Google Apps Script ([appscript/updateTier.gs](appscript/updateTier.gs))

นอกจาก Next.js app นี้ ตัว Google Sheet เองมี Apps Script ที่รันอยู่ในสเปรดชีทเดียวกัน — เดิมเป็น 2 ไฟล์แยกกัน (มีปัญหาชื่อฟังก์ชันชนกัน) **รวมเป็นไฟล์เดียวแล้ว** เก็บไว้ที่ `appscript/updateTier.gs` ในโปรเจคนี้เพื่อเป็น reference (ตัวที่รันจริงต้อง copy ไปวางใน Apps Script editor ของ Google Sheet เอง — ไฟล์นี้ไม่ได้รันโดย Next.js)

มี 4 ระบบย่อยอยู่ในไฟล์เดียว:

### 1. อัปเดต Tier (Column K) จากยอดขาย "เดือนก่อน" — กดมือทุกต้นเดือน ไม่มี trigger

```
Tierlist_<เดือนก่อน> (Col L ยอดขาย)
        │  match ด้วย TikTok (Col F) ก่อน → fallback เบอร์โทร (Col D)
        ▼
Tierlist_<เดือนนี้> (Col K Tier) ← เขียน Tier ใหม่ลงไป
```

นี่คือเหตุผลจริงที่ **Tier badge สีเขียวในหน้าเว็บ (`user.tier`) ไม่ตรงกับ progress bar (`getTierInfo`)** — สองค่านี้วัดคนละเดือนกันโดยตั้งใจ:
- **Tier badge** = ผลงานเดือนที่แล้ว (สิทธิ์ที่ "ปลดล็อก" ใช้ในเดือนนี้)
- **Progress bar** = แนวโน้มเดือนนี้ (ถ้าจบเดือนแบบนี้ เดือนหน้าจะได้ Tier อะไร)

🔴 **bug ที่ยังไม่แก้ — Boundary mismatch กับ `tierConfig.js`:** `_calcTier()` ใช้ `sales > rule.min` (strict) แต่ `tierConfig.js` ใช้ `total >= tier.min` — คนที่มียอดขาย **เป๊ะ 200,000 / 50,000 / 10,000 บาท** จะได้ Tier ต่ำกว่าจริง 1 ระดับใน sheet เทียบกับที่ progress bar คำนวณ (ตั้งใจข้ามการแก้ไว้ก่อน)

### 2. นับคลิปสะสม (Column M) — auto trigger ทุก 1 ชม.

ดึงยอดคลิปจาก 4 Google Form (Start/Speed/Super/Star) มา match ด้วย TikTok handle (fuzzy ได้ เพราะ stakes ต่ำ) แล้วเขียนรวมลง Column M

ผ่านการแก้ bug ไปแล้ว 3 จุด: (1) ไม่ overwrite เป็นค่าว่างถ้า match ไม่เจอรอบนั้น — เก็บค่าเดิมไว้ (2) fuzzy match เลือกตัวที่ตรงที่สุดตัวเดียว ไม่รวมทุกตัวที่ match (กันรวมคลิปคนอื่นผิดคน) (3) `parseMonth_` แยกแยะวัน/เดือนเมื่อทำได้ ไม่เดาตำแหน่งตายตัว

### 3. Import ยอดขาย TikTok (Column H/I) — กดมือ หลัง download report จาก TikTok Shop

แทนการอ่านไฟล์ TikTok Creator List แล้วพิมพ์ยอดใส่ทีละคนด้วยมือ (เดิม Col L ทั้งคอลัมน์มาจากการกรอกมือ 100%) — เปิดไฟล์ xlsx ที่ดาวน์โหลดจาก TikTok เป็น Google Sheet แล้ววาง ID/URL ให้ script match TikTok handle (Col F) กับ column `"ชื่อผู้ใช้ของครีเอเตอร์"` ในไฟล์ → ดึง `"GMV จากแอฟฟิลิเอต"` มาเขียนลง Col H (shop "JK") หรือ Col I (shop "JKกพ") แล้วคำนวณ Col L (=H+I+J) ใหม่ให้อัตโนมัติ

**ต่างจากการนับคลิป — ใช้ exact match อย่างเดียว ไม่ fuzzy** เพราะยอดขายกระทบ Tier/รางวัลตรงๆ ความเสี่ยงจากการเดาผิดสูงกว่าคลิปมาก:
- คนหนึ่งมีได้หลาย TikTok handle ใน Col F (เช่น `"bookblogger.mania, Book.lism"`) — ถ้าไฟล์ TikTok รอบนั้น match ได้ไม่ครบทุก handle → **ไม่ overwrite** เก็บยอดเดิมไว้ + flag ลง **Col O** (ใหม่) ว่า `"[JK] ยอดไม่ครบ (1/2 ช่อง)"` ให้ตรวจมือ
- ถ้า handle เดียวกันไปแมตช์ได้ 2 แถวพร้อมกันในรอบเดียว (สมัครซ้ำ/พิมพ์ผิด) → flag `"handle ซ้ำกับแถวอื่น"` ทั้งคู่ ไม่มีใครได้ยอดอัตโนมัติ ป้องกัน double-count

**Col O เป็นคอลัมน์ใหม่ แยกจาก Col N โดยตั้งใจ** — Col N มี dropdown ตายตัว `"ลงทะเบียนซ้ำ"` ที่ใช้กับ Mark-ซ้ำ (ระบบที่ 4) อยู่แล้ว ถ้าเขียนข้อความ TikTok-review ปนเข้าไปจะไปรบกวน exact-match check ของ Mark-ซ้ำ

### 4. Mark ข้อมูลซ้ำ (Column N) — กดมือ — สอดคล้องกับโค้ด Next.js

`_markDuplicatesInSheet()` ถือ row แรกที่เจอ phone/tiktok เป็น "ของจริง" ส่วน row ที่ซ้ำจะ mark "ลงทะเบียนซ้ำ" ใน Column N — ตรงกับที่ `app/api/check/route.js` ใช้ `rows.find(...)` (คืน row แรกที่ match เสมอ) ✅ **สองระบบสอดคล้องกัน ไม่มีปัญหา**

### ✅ แก้แล้วในโค้ด repo นี้ — Phone matching ไม่ normalize

`updateTier.gs` มี `_normalizePhone()` (ตัดอักขระที่ไม่ใช่ตัวเลข) เพราะรู้ว่าข้อมูลเบอร์โทรในชีทอาจมีรูปแบบไม่ตรงกัน แต่ `app/api/check/route.js` เดิมเทียบแบบ `row[3] === phone` ตรงๆ — แก้แล้วโดยเพิ่ม `normalizePhone()` ฝั่ง Next.js ให้ behavior ตรงกับ GAS

---

## Tier Config ([app/lib/tierConfig.js](app/lib/tierConfig.js))

| Tier | ยอดขาย/เดือน | ไอคอน |
|------|--------------|--------|
| Start | 0 – 9,999 บาท | 🚩 |
| Speed | 10,000 – 49,999 บาท | ⚡ |
| Super | 50,000 – 199,999 บาท | 🚀 |
| Star | 200,000+ บาท | ⭐ |

แต่ละ Tier มี: งบโฆษณา (budget), เงื่อนไขจำนวนคอนเทนต์ (requirement), ของรางวัล (reward), สิทธิพิเศษ (specialRights), และลิงก์ฟอร์มส่งคลิปของ Tier นั้น

---

## สิ่งที่ควรรู้ก่อนแก้โค้ด

1. **Column index แบบตายตัว** — `app/api/check/route.js` อ่านข้อมูลจาก sheet โดยอ้าง index คอลัมน์ตรงๆ (`row[3]` = เบอร์โทร, `row[11]` = total_sale ฯลฯ) ถ้ามีคนแก้ลำดับคอลัมน์ใน Google Sheet โค้ดจะพังแบบเงียบๆ (ได้ค่าผิดคอลัมน์ ไม่ error) — **ยืนยันแล้วว่าเกิดขึ้นจริง** กับ column M (`total_clip`) ในเดือน Jan ดูหัวข้อด้านบน
2. **Admin section ใช้งานไม่ได้แล้ว** — API ฝั่ง admin (`/api/admin/login`, `/api/clips` ฯลฯ) ถูกลบออกจากโปรเจคแล้ว แต่หน้า `/admin` ยังเรียกอยู่ และ sheet `admin_login` ที่เคยใช้ตรวจสอบยังเก็บ username/password เป็น **plain text** อยู่ในสเปรดชีทเดียวกับข้อมูลยอดขาย
3. **มี bug ที่ยังไม่แก้** — ดูรายละเอียดใน [CODE_REVIEW.md](CODE_REVIEW.md) โดยเฉพาะเรื่อง tier แสดงผิดถ้าช่องยอดขายว่างเปล่า
4. **มี Google Apps Script ([appscript/updateTier.gs](appscript/updateTier.gs)) รันอยู่ในสเปรดชีทเดียวกัน นอก repo นี้** — รวม 4 ระบบย่อย (Tier update / นับคลิป / Import ยอดขาย TikTok / Mark ซ้ำ) ดูรายละเอียดในหัวข้อ "ระบบ Automate ใน Google Apps Script" — ควรระวังเวลาแก้ไข schema ของ sheet (เพิ่ม/ลบ/สลับคอลัมน์) เพราะจะกระทบสคริปต์นี้ด้วย ไม่ใช่กระทบแค่ Next.js — ไฟล์ใน repo เป็นแค่ reference เก็บไว้ดู ไม่ได้ sync กับตัวจริงใน Apps Script editor อัตโนมัติ
5. **Boundary mismatch ระหว่าง GAS กับ `tierConfig.js`** — ยอดขายเป๊ะ 200,000/50,000/10,000 บาท จะได้ Tier ไม่ตรงกันระหว่าง sheet กับ progress bar เพราะ `updateTier.gs` ใช้ `>` แต่ `tierConfig.js` ใช้ `>=` — ต้องแก้ใน `.gs` ให้ตรงกัน (ยังไม่แก้ — ตั้งใจข้ามไว้ก่อน)
6. **Col O ใหม่ในชีท `Tierlist_*`** — ใช้โดย import-ยอดขาย-TikTok เท่านั้น ห้ามใช้ปนกับ Col N (มี dropdown ตายตัวของ Mark-ซ้ำ) ถ้าเห็นข้อความ `"[JK] ยอดไม่ครบ..."` หรือ `"[JKกพ] handle ซ้ำ..."` ใน Col O แปลว่ามีแถวที่ import อัตโนมัติไม่สำเร็จ ต้องตรวจ/กรอกมือ
7. **`/api/check` มี cache 60 วินาที** — หลัง admin แก้ข้อมูลผ่าน Apps Script (import ยอดขาย/อัปเดต Tier) ผู้ใช้อาจเห็นข้อมูลเก่าค้างได้สูงสุด 60 วินาที ก่อนเห็นค่าใหม่ — ไม่ใช่ bug ถ้าเจอ "ข้อมูลไม่อัปเดต" ทันทีหลัง sync ให้รอสักครู่ก่อนสงสัยว่าโค้ดพัง
8. **`page.js` แยกเป็น `SearchBox.js` + `Dashboard.js` แล้ว** — ทั้งสองไฟล์ถือ state และเรียก API ของตัวเอง ไม่ได้รับ `phone`/`monthOffset` ผ่าน props จาก `page.js` อีกต่อไป ถ้าจะเพิ่มฟีเจอร์ที่ต้องแชร์ state ระหว่างสองไฟล์นี้ ต้องยกขึ้นไปไว้ที่ `page.js` เอง (ตอนนี้มีแค่ `user` ตัวเดียวที่แชร์กัน)
9. **Tailwind CSS v4 ใช้งานจริงแล้ว** — โค้ดทั้งหมดแปลงจาก inline `<style>` เป็น Tailwind utility classes แล้ว (`app/page.js`, `TierProgress.js`, `TierListdetail.js`) เหลือ inline `style` prop เฉพาะค่าที่เป็น dynamic จริง (สีตาม tier) — animation ที่ Tailwind ไม่มีให้ (fade-up, shimmer, overlay/card transitions) ลงทะเบียนไว้ใน `app/globals.css` ผ่าน `@theme`
10. **🐛 พบ bug ใหม่ระหว่างทดสอบ Tailwind migration (ยังไม่แก้)** — active-tier highlight ใน `TierListdetail.js` ไม่ทำงานเลย เพราะ `user.tier` จาก sheet มี emoji ติดมา (เช่น `"Speed⚡"`) แต่ `ALL_TIERS` เก็บแค่ `"Speed"` เทียบ `user?.tier === t` ไม่ตรงกันตลอด — เป็น bug ที่มีอยู่ก่อนแล้ว ไม่ใช่ regression จากการแปลง Tailwind
