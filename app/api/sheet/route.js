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
      range: "Sheet1!A:C",
    });

    const rows = response.data.values || [];

    const user = rows.find((row) => row[0] === phone);

    if (!user) {
      return Response.json({
        found: false,
      });
    }

    return Response.json({
      found: true,
      name: user[1],
      tier: user[2],
    });

  } catch (error) {
    console.log(error);
    return Response.json({ error: "server error" });
  }
}