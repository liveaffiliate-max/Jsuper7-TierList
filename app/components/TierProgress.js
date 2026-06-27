import React from "react";

// วันที่เหลือในเดือนปัจจุบัน (รวมวันนี้) — ใช้สร้างความเร่งด่วน ไม่เกี่ยวกับ offset เดือนที่ดูอยู่
function getDaysLeftInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
}

export default function TierProgress({ totalSale, getTierInfo, TIER_CONFIG, isCurrentMonth }) {
  const info = getTierInfo(totalSale);
  const daysLeft = getDaysLeftInMonth();

  return (
    <div className="mt-[18px] mb-5 bg-white rounded-2xl px-[18px] py-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between items-center mb-2.5">
        <div className="text-lg font-bold text-[#1e293b]">📈 ความก้าวหน้า Tier</div>
        <div className="text-sm text-[#64748b] font-semibold">{Math.round(info.progress)}%</div>
      </div>

      {info.next ? (
        <>
          <div className="flex justify-between text-base text-[#94a3b8] mb-1.5 font-semibold">
            <span>{TIER_CONFIG[info.current].icon} {info.current}</span>
            <span>{TIER_CONFIG[info.next].icon} {info.next}</span>
          </div>

          <div className="h-3 rounded-full bg-[#e2e8f0] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000"
              style={{
                width: `${info.progress}%`,
                background: `linear-gradient(90deg, ${TIER_CONFIG[info.current].color}, ${TIER_CONFIG[info.next].color})`,
                boxShadow: `0 2px 8px ${TIER_CONFIG[info.next].color}55`,
              }}
            />
          </div>

          <div className="text-center mt-3 text-base text-[#64748b] font-semibold">
            อีก{" "}
            <span className="text-[#ef4444] font-bold">
              ฿{Math.ceil(info.remaining).toLocaleString()}
            </span>
            {" "}จะขึ้น Tier {info.next} {TIER_CONFIG[info.next].icon}
          </div>

          {isCurrentMonth && (
            <div className={`text-center mt-1.5 text-xs font-semibold ${daysLeft <= 3 ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>
              ⏳ เหลือเวลาอีก {daysLeft} วันในเดือนนี้
            </div>
          )}

          {TIER_CONFIG[info.next].reward?.[0] && (
            <div className="mt-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs text-[#475569] text-center">
              🎁 ขึ้น Tier {info.next} : {TIER_CONFIG[info.next].reward[0]}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="h-3 rounded-full bg-[#ede9fe] overflow-hidden mt-1">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] shadow-[0_2px_8px_rgba(124,58,237,0.35)]" />
          </div>
          <div className="text-center mt-2 text-base text-[#7c3aed] font-bold">
            ⭐ ถึง Tier สูงสุดแล้ว!
          </div>
        </>
      )}
    </div>
  );
}
