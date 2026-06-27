import { GoogleAuth } from "google-auth-library";

export const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

// แปลงค่าจาก sheet (อาจเป็น "", undefined, หรือ "5,665.79") ให้เป็น number เสมอ
export function parseSheetNumber(value) {
  if (value === undefined || value === null || value === "") return 0;
  const num = parseFloat(String(value).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

// ตัดอักขระที่ไม่ใช่ตัวเลขออก (เบอร์ในชีทอาจมีขีด/วงเล็บ/เว้นวรรค) — ให้ตรงกับ _normalizePhone ใน updateTier.gs
export function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function sheetNameForOffset(monthOffset) {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset);
  const monthName = MONTHS[targetDate.getMonth()];
  return { monthName, sheetName: `Tierlist_${monthName}` };
}

// สร้างครั้งเดียวต่อ serverless instance (warm invocation จะ reuse ตัวนี้ ไม่ต้องสร้างใหม่ทุก request)
const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

// เรียก Sheets REST API ตรงๆ ผ่าน google-auth-library แทนแพ็กเกจ googleapis ทั้งก้อน
// (googleapis รวมไคลเอนต์ของทุก Google API ไว้ในแพ็กเกจเดียว ทำให้ bundle ใหญ่และ cold start ช้าโดยไม่จำเป็น
// เพราะที่นี่ใช้แค่ spreadsheets.values.get เท่านั้น)
async function fetchSheetValues(sheetName) {
  const client = await auth.getClient();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/${encodeURIComponent(`${sheetName}!A:N`)}`;
  const res = await client.request({ url });
  return res.data;
}

// แคชข้อมูล sheet ไว้ใน memory ของ serverless instance (warm invocation) — ลดการยิง
// Google Sheets API ซ้ำๆ เมื่อมีหลายคนเช็คเดือนเดียวกันใกล้ๆกัน ข้อมูลจริงเปลี่ยนไม่บ่อย
// (sync คลิปทุก 1 ชม., sales/tier กดมือ) จึง cache สั้นๆ พอ ไม่กระทบความสดของข้อมูลที่เห็นได้จริง
const sheetCache = new Map(); // sheetName -> { rows, expiresAt } | { error: true, expiresAt }
const CACHE_TTL_MS = 60 * 1000;

export async function getSheetRows(sheetName) {
  const cached = sheetCache.get(sheetName);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.error) throw new Error("Unable to parse range");
    return cached.rows;
  }

  try {
    const data = await fetchSheetValues(sheetName);

    const rows = data.values || [];
    sheetCache.set(sheetName, { rows, expiresAt: Date.now() + CACHE_TTL_MS });
    return rows;
  } catch (err) {
    // gaxios ห่อ error ของ Google API ไว้ใน err.response.data.error.message แทน err.message ตรงๆ
    const googleMessage = err.response?.data?.error?.message || err.message;

    // cache สถานะ "ไม่มี sheet นี้" ไว้ด้วย กันยิง API ซ้ำเดือนที่ยังไม่มีข้อมูล
    if (googleMessage.includes("Unable to parse range")) {
      sheetCache.set(sheetName, { error: true, expiresAt: Date.now() + CACHE_TTL_MS });
      throw new Error("Unable to parse range");
    }
    throw err;
  }
}

// _sync_log คือชีท append-only ที่ updateTier.gs เขียนทุกครั้งที่ script รัน (sync คลิป/อัปเดต tier)
// แถวล่าสุดของชีทนี้คือเวลาที่ข้อมูลถูกอัปเดตจริงล่าสุด — ใช้บอก user ว่าข้อมูลที่เห็นสดแค่ไหน
// ถ้าอ่านไม่ได้ (เช่นชีทถูกลบ/ย้าย) ให้ return null เงียบๆ ไม่ทำให้ /api/check ทั้ง request ล้ม
export async function getLastSyncTimestamp() {
  try {
    const rows = await getSheetRows("_sync_log");
    const lastRow = rows[rows.length - 1];
    return lastRow?.[0] || null;
  } catch {
    return null;
  }
}
