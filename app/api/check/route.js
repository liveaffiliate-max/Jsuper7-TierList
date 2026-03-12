import { google } from "googleapis";

export async function POST(req) {
  try {
    const { phone } = await req.json();

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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "ลงเว็บ!A:N",
    });

    const rows = response.data.values || [];

    // หา row ที่เบอร์ตรงกัน (คอลัมน์ D = index 3)
    const user = rows.find((row) => row[3] === phone);

    if (!user) {
      return Response.json({ found: false });
    }

    return Response.json({
      found: true,

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
    return Response.json({ error: "server error" });
  }
}