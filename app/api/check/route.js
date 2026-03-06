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
      range: "Sheet1!A:K",
    });

    const rows = response.data.values || [];

    // หา row ที่เบอร์ตรงกัน (คอลัมน์ C = index 2)
    const user = rows.find((row) => row[2] === phone);

    if (!user) {
      return Response.json({ found: false });
    }

    return Response.json({
      found: true,
      fullname: user[0],
      nickname: user[1],
      phone: user[2],
      line: user[3],
      tiktok: user[4],
      sale_uni: user[5],
      sale_exam: user[6],
      shopee: user[7],
      tier: user[8],
      total_sale: user[9],
      profile: user[10],
    });

  } catch (error) {
    console.log(error);
    return Response.json({ error: "server error" });
  }
}