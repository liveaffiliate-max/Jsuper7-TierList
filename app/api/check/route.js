import { getSheetRows, normalizePhone, parseSheetNumber, sheetNameForOffset } from "../../lib/sheetsClient";

export async function POST(req) {
  try {

    const { phone, monthOffset = 0 } = await req.json();

    const { monthName, sheetName } = sheetNameForOffset(monthOffset);

    let rows = [];

    try {
      rows = await getSheetRows(sheetName);
    } catch (err) {
      // ถ้าไม่มี sheet
      if (err.message.includes("Unable to parse range")) {
        return Response.json({
          found: false,
          noData: true,
          month: monthName,
          sheet: sheetName
        });
      }
      throw err;
    }

    // หา row ที่เบอร์ตรงกัน (คอลัมน์ D = index 3) — normalize ทั้งสองฝั่งกันรูปแบบเบอร์ไม่ตรงกัน
    const normalizedPhone = normalizePhone(phone);
    const user = rows.find((row) => normalizePhone(row[3]) === normalizedPhone);

    if (!user) {
  return Response.json({
    found:false,
    noData:true,
    month:monthName,
    sheet:sheetName
  });
}

    return Response.json({
      found: true,

      month: monthName,
      sheet: sheetName,

      fullname: user[1],
      nickname: user[2],
      phone: user[3],
      line: user[4],

      tiktok: user[5],
      profile: user[6],

      sale_uni: user[7],
      sale_exam: user[8],
      shopee: user[9],
      tier: user[10],

      total_sale: parseSheetNumber(user[11]),

      total_clip: parseSheetNumber(user[12]),

    });

  } catch (error) {

    console.log(error);

    return Response.json({
      error: "server error"
    });

  }
}
