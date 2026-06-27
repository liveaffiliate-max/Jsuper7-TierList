import { Geist, Geist_Mono, Prompt, Kanit, Sarabun } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// font หลักของหน้าเว็บ — ย้ายมาโหลดที่นี่ (self-host ผ่าน next/font ไม่ต้อง @import จาก Google Fonts
// ตอน runtime แบบเดิม) แล้ว expose เป็น CSS variable ให้ app/page.js และ TierListdetail.js อ้างถึง
const prompt = Prompt({
  variable: "--font-prompt",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  weight: ["400", "500"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// Vercel inject โดเมน production จริงให้ผ่าน env var นี้อัตโนมัติตอน build — ไม่ต้อง hardcode
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const metadata = {
  metadataBase: siteUrl ? new URL(`https://${siteUrl}`) : new URL("http://localhost:3000"),
  title: "Jsuper7-TierList",
  description: "Jsuper7 check tierlist",
  openGraph: {
    title: "Jsuper7-TierList",
    description: "ตรวจสอบยอดขายและ Tier ของ Affiliate ในแคมเปญ Jsuper7",
    images: ["/jsuper7_jknowlogo.png"],
    locale: "th_TH",
    type: "website",
  },
  icons: {
    icon: "/jsuper7logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${prompt.variable} ${kanit.variable} ${sarabun.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
