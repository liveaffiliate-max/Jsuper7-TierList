"use client";

import { useEffect, useState } from "react";
import { fetchTierHistory } from "../lib/checkUser";

const TH_MONTH_SHORT = {
  Jan: "ม.ค.", Feb: "ก.พ.", Mar: "มี.ค.", Apr: "เม.ย.",
  May: "พ.ค.", Jun: "มิ.ย.", Jul: "ก.ค.", Aug: "ส.ค.",
  Sep: "ก.ย.", Oct: "ต.ค.", Nov: "พ.ย.", Dec: "ธ.ค.",
};

const WIDTH = 280;
const HEIGHT = 70;
const PAD_X = 6;
const PAD_Y = 10;

export default function SalesTrend({ phone }) {
  const [points, setPoints] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTierHistory(phone).then((data) => {
      if (cancelled) return;
      setPoints(data.points || []);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [phone]);

  // กำลังรอ /api/check/history — โชว์ skeleton ขนาดเดียวกับกล่องจริงกันหน้าเด้งตอนข้อมูลมา
  if (isLoading) {
    return (
      <div className="mt-[18px] mb-5 bg-white rounded-2xl px-[18px] py-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)] animate-pulse">
        <div className="flex justify-between items-center mb-2">
          <div className="h-5 w-40 bg-[#e2e8f0] rounded" />
          <div className="h-4 w-12 bg-[#e2e8f0] rounded" />
        </div>
        <div className="h-[70px] bg-[#f1f5f9] rounded" />
        <div className="flex justify-between mt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-2.5 w-6 bg-[#e2e8f0] rounded" />
          ))}
        </div>
      </div>
    );
  }

  // ต้องมีอย่างน้อย 2 จุดถึงจะลากเส้นเทรนด์ได้ ถ้าน้อยกว่านั้นไม่โชว์ส่วนนี้เลย
  if (!points || points.length < 2) return null;

  const values = points.map((p) => p.total_sale);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const stepX = (WIDTH - PAD_X * 2) / (points.length - 1);
  const coords = values.map((v, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_Y + (HEIGHT - PAD_Y * 2) * (1 - (v - min) / range),
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  const first = values[0];
  const last = values[values.length - 1];
  const trendUp = last >= first;

  return (
    <div className="mt-[18px] mb-5 bg-white rounded-2xl px-[18px] py-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between items-center mb-2">
        <div className="text-lg font-bold text-[#1e293b]">📊 เทรนด์ยอดขาย {points.length} เดือน</div>
        <div className={`text-sm font-semibold ${trendUp ? "text-[#16a34a]" : "text-[#ef4444]"}`}>
          {trendUp ? "▲" : "▼"} {first > 0 ? Math.round(((last - first) / first) * 100) : 0}%
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[70px]">
        <path d={linePath} fill="none" stroke={trendUp ? "#16a34a" : "#ef4444"} strokeWidth="2" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="2.5" fill={trendUp ? "#16a34a" : "#ef4444"} />
        ))}
      </svg>

      <div className="flex justify-between mt-1 text-[10px] text-[#94a3b8]">
        {points.map((p, i) => (
          <span key={i}>{TH_MONTH_SHORT[p.month] || p.month}</span>
        ))}
      </div>
    </div>
  );
}
