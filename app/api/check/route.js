import { google } from "googleapis";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

export async function POST(req) {
  try {

    const { phone, monthOffset = 0 } = await req.json();

    // คำนวณเดือนจาก offset
    const now = new Date();
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthOffset
    );

    const monthName = MONTHS[targetDate.getMonth()];
    const sheetName = `Tierlist_${monthName}`;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    let rows = [];

try {

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${sheetName}!A:N`,
  });

  rows = response.data.values || [];

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
    console.log("sheet:", sheetName);

    // const rows = response.data.values || [];

    // หา row ที่เบอร์ตรงกัน (คอลัมน์ D = index 3)
    const user = rows.find((row) => row[3] === phone);

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

      total_sale: user[11],

    });

  } catch (error) {

    console.log(error);

    return Response.json({
      error: "server error"
    });

  }
}