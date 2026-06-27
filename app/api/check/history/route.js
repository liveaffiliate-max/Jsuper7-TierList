import { getSheetRows, normalizePhone, parseSheetNumber, sheetNameForOffset } from "../../../lib/sheetsClient";

const HISTORY_MONTHS = 6; // เดือนปัจจุบัน + ย้อนหลัง 5 เดือน

export async function POST(req) {
  try {
    const { phone } = await req.json();
    const normalizedPhone = normalizePhone(phone);

    const offsets = Array.from({ length: HISTORY_MONTHS }, (_, i) => -i);

    const points = [];
    for (const offset of offsets) {
      const { monthName, sheetName } = sheetNameForOffset(offset);

      let rows;
      try {
        rows = await getSheetRows(sheetName);
      } catch {
        continue; // sheet ของเดือนนี้ยังไม่มี — ข้ามไป ไม่ถือเป็น error
      }

      const user = rows.find((row) => normalizePhone(row[3]) === normalizedPhone);
      if (!user) continue; // เบอร์นี้ยังไม่มีในเดือนนี้ — ข้ามไป

      points.push({ month: monthName, total_sale: parseSheetNumber(user[11]) });
    }

    // เรียงจากเดือนเก่าสุด -> ใหม่สุด ให้ตรงกับลำดับที่กราฟอ่านซ้ายไปขวา
    points.reverse();

    return Response.json({ points });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "server error" });
  }
}
