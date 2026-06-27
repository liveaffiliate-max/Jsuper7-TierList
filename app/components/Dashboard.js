"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { TIER_CONFIG } from "../lib/tierConfig";
import { getTierInfo } from "../lib/getTierInfo";
import { fetchTierCheck } from "../lib/checkUser";
import TierProgress from "./TierProgress";
import TierListDetail from "./TierListdetail";

const TH_MONTHS = {
  Jan: "มกราคม",
  Feb: "กุมภาพันธ์",
  Mar: "มีนาคม",
  Apr: "เมษายน",
  May: "พฤษภาคม",
  Jun: "มิถุนายน",
  Jul: "กรกฎาคม",
  Aug: "สิงหาคม",
  Sep: "กันยายน",
  Oct: "ตุลาคม",
  Nov: "พฤศจิกายน",
  Dec: "ธันวาคม",
};

const getThaiMonth = (month) => TH_MONTHS[month] || month;

export default function Dashboard({ user, onUserChange, onLogout }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [monthLoading, setMonthLoading] = useState(false);

  // เก็บผลลัพธ์ที่เคยโหลดสำเร็จไว้ใน ref (key = offset) กันยิง /api/check ซ้ำเวลาผู้ใช้
  // กดไปมาระหว่างเดือนที่เคยดูแล้วในเซสชันนี้ — เริ่มต้นด้วย offset 0 = user ที่ได้รับมาตอน login
  const monthCache = useRef(new Map([[0, user]]));

  // user.tier มาจาก sheet พร้อม emoji ติดมา (เช่น "Super🚀") ต้องตัดออกก่อน lookup TIER_CONFIG
  // fallback เป็น Start กันกรณี sheet มีค่า tier ที่ไม่ตรงกับ config ไหนเลย
  const userTierName = user?.tier?.replace(/[^\p{L}\p{N}]/gu, "");
  const panelCfg = TIER_CONFIG[userTierName] || TIER_CONFIG.Start;

  const getMonthLabel = () => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset);
    const monthAbbr = target.toLocaleString("en-US", { month: "short" });
    return `${getThaiMonth(monthAbbr)} ${target.getFullYear() + 543}`;
  };

  const loadMonth = async (offset, prevOffset) => {
    const cached = monthCache.current.get(offset);
    if (cached) {
      onUserChange(cached);
      return;
    }

    setMonthLoading(true);

    const data = await fetchTierCheck(user.phone, offset);

    setMonthLoading(false);

    if (data.found) {
      monthCache.current.set(offset, data);
      onUserChange(data);
    }

    if (data.noData) {
      setMonthOffset(prevOffset);
      Swal.fire({
        icon: "info",
        title: `ไม่มีข้อมูลเดือน ${getThaiMonth(data.month)}`,
        text: "ยังไม่มีข้อมูลยอดขายสำหรับเดือนนี้"
      });
      return;
    }
  };

  return (
    <div className="max-w-[95%] lg:max-w-[860px] mx-auto animate-fade-up">

      {/* Month Navigator */}
      <div className="flex justify-center items-center gap-4 mb-5 font-semibold text-lg">
        <button
          className="w-10 h-10 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] cursor-pointer text-base flex items-center justify-center transition-all text-[#1e293b] enabled:hover:bg-[#2563eb] enabled:hover:text-white enabled:hover:scale-110 enabled:hover:shadow-[0_4px_14px_rgba(37,99,235,0.35)] disabled:opacity-35 disabled:cursor-not-allowed"
          disabled={monthLoading}
          onClick={() => {
            const prevOffset = monthOffset;
            const newOffset = monthOffset - 1;
            setMonthOffset(newOffset);
            loadMonth(newOffset, prevOffset);
          }}
        >
          ◀
        </button>

        <div className="min-w-[130px] md:min-w-[160px] text-center bg-white px-5 py-2 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] text-[#1e293b] text-sm md:text-base flex items-center justify-center gap-2">
          {monthLoading && (
            <div className="w-4 h-4 border-2 border-[#cbd5e1] border-t-[#2563eb] rounded-full animate-[spin_0.7s_linear_infinite] shrink-0" />
          )}
          <span>{getMonthLabel()}</span>
        </div>

        <button
          className="w-10 h-10 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] cursor-pointer text-base flex items-center justify-center transition-all text-[#1e293b] enabled:hover:bg-[#2563eb] enabled:hover:text-white enabled:hover:scale-110 enabled:hover:shadow-[0_4px_14px_rgba(37,99,235,0.35)] disabled:opacity-35 disabled:cursor-not-allowed"
          disabled={monthOffset === 0 || monthLoading}
          onClick={() => {
            const prevOffset = monthOffset;
            const newOffset = monthOffset + 1;
            setMonthOffset(newOffset);
            loadMonth(newOffset, prevOffset);
          }}
        >
          ▶
        </button>
      </div>

      {/* Dashboard content with overlay */}
      <div className="relative">

        {/* Loading overlay */}
        {monthLoading && (
          <div className="absolute inset-0 bg-white/55 backdrop-blur-[3px] rounded-[20px] z-10 flex flex-col items-center justify-center gap-3.5 animate-[fadeUp_0.2s_ease]">
            <div className="w-12 h-12 border-4 border-[#e2e8f0] border-t-[#2563eb] rounded-full animate-[spin_0.75s_linear_infinite]" />
            <div className="text-[15px] font-semibold text-[#1e293b]">กำลังโหลดข้อมูล...</div>
          </div>
        )}

        {/* Profile */}
        <div className={`bg-white rounded-[20px] overflow-hidden mb-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col md:flex-row transition-opacity${monthLoading ? " pointer-events-none" : ""}`}>

          {/* Left: Tier Panel */}
          <div
            className="w-full md:w-[190px] md:min-w-[190px] px-[18px] py-[14px] md:py-5 flex flex-row md:flex-col items-center md:items-stretch justify-start md:justify-center gap-3.5 md:gap-1.5 relative overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${panelCfg.panelGradient[0]}, ${panelCfg.panelGradient[1]})` }}
          >
            <div className="absolute -top-[50px] -right-[50px] w-[130px] h-[130px] rounded-full bg-white/[0.07] pointer-events-none" />
            <div className="absolute -bottom-[35px] -left-[25px] w-[100px] h-[100px] rounded-full bg-white/5 pointer-events-none" />

            <div className="text-[11px] font-medium text-white/65 tracking-[0.06em] mb-2 md:mb-0 relative z-10">
              JSUPER7 · ระดับ
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <div className="text-[22px] md:text-[28px] font-extrabold text-white leading-none">{user.tier}</div>
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="flex-1 px-4 py-[14px] md:px-[22px] md:py-5 flex flex-col justify-start md:justify-between gap-3 md:gap-0">
            <div>
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#94a3b8] mb-1">Member</div>
              <div className="text-[18px] md:text-[22px] font-extrabold text-[#0f172a] leading-[1.2] mb-[5px]">{user.fullname}</div>
              <div className="text-[13px] text-[#64748b] flex items-center gap-[5px]">📞 {user.phone}</div>
            </div>

            <div className="grid grid-cols-2 gap-[10px] mt-0 md:mt-[14px]">
              <div className="bg-[#f8fafc] rounded-xl px-3 py-[10px] border-[1.5px] border-[#e2e8f0] border-l-4 border-l-[#0d7a5f]">
                <div className="text-[10.5px] text-[#94a3b8] mb-[5px] flex items-center gap-[5px]">
                  <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0 bg-[#0d7a5f]" />
                  ยอดขายเดือน{getThaiMonth(user.month)}
                </div>
                <div className="text-xl font-extrabold text-[#0f172a] leading-none">฿{Number(user.total_sale).toLocaleString()}</div>
              </div>
              <div className="bg-[#f8fafc] rounded-xl px-3 py-[10px] border-[1.5px] border-[#e2e8f0] border-l-4 border-l-[#2563eb]">
                <div className="text-[10.5px] text-[#94a3b8] mb-[5px] flex items-center gap-[5px]">
                  <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0 bg-[#2563eb]" />
                  คลิปสะสม
                </div>
                <div className="text-xl font-extrabold text-[#0f172a] leading-none">{user.total_clip}</div>
                <div className="text-[11px] text-[#94a3b8] mt-0.5">คลิปที่ผ่านเงื่อนไขของเดือน {getThaiMonth(user.month)}</div>
              </div>
            </div>
          </div>
        </div>

        <TierProgress
          totalSale={user.total_sale}
          getTierInfo={getTierInfo}
          TIER_CONFIG={TIER_CONFIG}
          isCurrentMonth={monthOffset === 0}
        />

        {/* Sale Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          <div className="bg-white p-5 rounded-2xl text-center shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-transform hover:-translate-y-0.5 flex flex-col relative">
            <Image src="/logo_jknow.png" alt="JKnowledge" width={4500} height={4500} className="w-20 mx-auto mb-2.5" />
            <h3 className="text-sm font-semibold text-[#334155] leading-[1.3]">หนังสือเตรียมสอบมหาลัย</h3>
            <p className="text-xs text-[#94a3b8] mt-1 mb-3">(Tiktok)</p>
            <h2 className="text-xl md:text-[22px] font-bold text-[#ef4444] mt-auto pt-3 border-t border-[#f1f5f9]">฿{user.sale_uni}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl text-center shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-transform hover:-translate-y-0.5 flex flex-col relative">
            <Image src="/logo_jkorpor.png" alt="Jkorpor" width={4500} height={4500} className="w-20 mx-auto mb-2.5" />
            <h3 className="text-sm font-semibold text-[#334155] leading-[1.3]">หนังสือเตรียมสอบราชการ</h3>
            <p className="text-xs text-[#94a3b8] mt-1 mb-3">(Tiktok)</p>
            <h2 className="text-xl md:text-[22px] font-bold text-[#ef4444] mt-auto pt-3 border-t border-[#f1f5f9]">฿{user.sale_exam}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl text-center shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-transform hover:-translate-y-0.5 flex flex-col relative">
            <Image src="/logo_shopee.png" alt="Shopee" width={4500} height={4500} className="w-20 mx-auto mb-2.5" />
            <h3 className="text-sm font-semibold text-[#334155] leading-[1.3]">JKnowledge Shop</h3>
            <p className="text-xs text-[#94a3b8] mt-1 mb-3">(Shopee)</p>
            <h2 className="text-xl md:text-[22px] font-bold text-[#ef4444] mt-auto pt-3 border-t border-[#f1f5f9]">฿{user.shopee}</h2>
          </div>
        </div>

        {/* Tier Info */}
        <TierListDetail user={user} />

      </div>
      {/* end dashboard-wrap */}

      {/* Logout */}
      <button
        className="mt-5 w-full p-3 rounded-xl font-semibold cursor-pointer bg-[#ef4444] text-white"
        onClick={onLogout}
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
