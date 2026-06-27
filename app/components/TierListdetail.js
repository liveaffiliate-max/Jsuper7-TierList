"use client";

import { useState, useEffect } from "react";
import { TIER_CONFIG, ALL_TIERS } from "../lib/tierConfig";

export default function TierListDetail({ user }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [animating, setAnimating] = useState(false);

  // user.tier มาจาก sheet พร้อม emoji ติดมา (เช่น "Speed⚡") ส่วน ALL_TIERS เป็นชื่อล้วน ("Speed")
  // ต้องตัดสัญลักษณ์ออกก่อนเทียบ ไม่งั้น active-tier highlight จะไม่ขึ้นเลย
  const userTierName = user?.tier?.replace(/[^\p{L}\p{N}]/gu, "");

  const openModal = (t) => {
    setSelectedTier(t);
    setAnimating(true);
  };

  const closeModal = () => {
    setAnimating(false);
    setTimeout(() => setSelectedTier(null), 250);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (selectedTier) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedTier]);

  const cfg = selectedTier ? TIER_CONFIG[selectedTier] : null;

  return (
    <>
      {/* ── Tier Grid ── */}
      <div className="mt-[18px] bg-white rounded-[18px] p-[22px] shadow-[0_6px_20px_rgba(0,0,0,0.08)]" style={{ fontFamily: "var(--font-kanit), sans-serif" }}>
        <div className="text-[15px] font-semibold text-[#475569] mb-[14px]">📊 เกณฑ์ระดับยอดขายในการจัด Tier</div>

        <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-2.5">
          {ALL_TIERS.map((t) => {
            const c = TIER_CONFIG[t];
            const isActive = userTierName === t;
            return (
              <div
                key={t}
                className={`border-2 rounded-2xl px-2.5 py-4 text-center cursor-pointer transition-[transform,box-shadow] duration-[180ms] flex flex-col items-center justify-center min-h-[110px] box-border hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${isActive ? "shadow-[0_0_0_3px_rgba(99,102,241,0.25),0_6px_20px_rgba(0,0,0,0.1)]" : ""}`}
                style={{ background: c.bg, borderColor: isActive ? c.color : c.border }}
                onClick={() => openModal(t)}
              >
                <span className="text-[28px] mb-1.5 leading-none block">{c.icon}</span>
                <div className="text-base font-bold mb-1 leading-[1.2] break-words" style={{ color: c.color }}>{t}</div>
                <div
                  className="text-sm font-medium opacity-80 leading-[1.4] [word-break:keep-all] whitespace-nowrap max-[360px]:text-[9px] max-[360px]:whitespace-normal"
                  style={{ color: c.color, fontFamily: "var(--font-sarabun), sans-serif" }}
                >
                  {c.range}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Popup ── */}
      {selectedTier && cfg && (
        <div
          className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-[6px] ${animating ? "animate-overlay-in" : "animate-overlay-out"}`}
          onClick={closeModal}
        >
          <div className="flex flex-col items-center w-full max-w-[380px]">
            <div
              className={`w-full max-w-[380px] rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] max-h-[calc(100vh-80px)] overflow-y-auto [-webkit-overflow-scrolling:touch] ${animating ? "animate-card-in" : "animate-card-out"}`}
              style={{ fontFamily: "var(--font-kanit), sans-serif" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="relative text-center px-[22px] pt-[18px] pb-[14px] max-[420px]:px-[18px] max-[420px]:pt-7 max-[420px]:pb-5"
                style={{ background: `linear-gradient(145deg, ${cfg.color}ee, ${cfg.color}99)` }}
              >
                <div className="absolute -top-[60px] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,transparent_70%)] pointer-events-none" />
                {userTierName === selectedTier && (
                  <div className="absolute top-3 right-3 bg-white/25 border border-white/40 rounded-full px-2.5 py-[3px] text-[10px] font-bold text-white tracking-[0.08em] uppercase">
                    ✦ Tier ปัจจุบัน
                  </div>
                )}
                <div className="w-[52px] h-[52px] rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-[34px] shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] shrink-0 relative z-10">
                  {cfg.icon}
                </div>
                <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/70 mb-0.5 relative z-10">ระดับ</div>
                <div className="text-[22px] font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.2)] mb-2 leading-none relative z-10 max-[420px]:text-[22px]">
                  {selectedTier}
                </div>
                <div className="inline-block px-[14px] py-1 rounded-full bg-white/20 text-white/95 text-xs font-medium border border-white/25 relative z-10" style={{ fontFamily: "var(--font-sarabun), sans-serif" }}>
                  💰 {cfg.range}
                </div>
              </div>

              {/* Body */}
              <div className="bg-white px-5 pt-5 pb-6 max-[420px]:px-4 max-[420px]:pt-4 max-[420px]:pb-5">
                {/* Budget + Requirement */}
                <div className="flex gap-2.5 mb-[14px]">
                  <div className="flex-1 rounded-xl px-2 py-3 text-center bg-[#f8fafc] border border-[#e2e8f0] min-w-0">
                    <div className="text-[9px] font-bold tracking-[0.08em] uppercase text-[#94a3b8] mb-1">💵 Budget</div>
                    <div className="text-xs font-bold leading-[1.35] break-words" style={{ color: cfg.color, fontFamily: "var(--font-sarabun), sans-serif" }}>
                      {cfg.budget}
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl px-2 py-3 text-center bg-[#f8fafc] border border-[#e2e8f0] min-w-0">
                    <div className="text-[9px] font-bold tracking-[0.08em] uppercase text-[#94a3b8] mb-1">📋 Requirement</div>
                    <div className="text-xs font-bold text-[#1e293b] leading-[1.35] break-words" style={{ fontFamily: "var(--font-sarabun), sans-serif" }}>
                      {cfg.requirement.split("\n").map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reward */}
                <div className="mb-[14px]">
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#94a3b8] mb-2 flex items-center gap-1.5">
                    🎁 Reward
                    <div className="flex-1 h-px bg-[#f1f5f9]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {cfg.reward.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-[13px] text-[#334155] leading-[1.55]" style={{ fontFamily: "var(--font-sarabun), sans-serif" }}>
                        <div
                          className="w-[18px] h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-white font-bold max-[420px]:text-xs"
                          style={{ background: cfg.color }}
                        >
                          {i + 1}
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Rights */}
                <div className="mb-[14px]">
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#94a3b8] mb-2 flex items-center gap-1.5">
                    ⭐ สิทธิพิเศษเพิ่มเติม
                    <div className="flex-1 h-px bg-[#f1f5f9]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {cfg.specialRights.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-[13px] text-[#334155] leading-[1.55] max-[420px]:text-xs" style={{ fontFamily: "var(--font-sarabun), sans-serif" }}>
                        <div className="w-[18px] h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-white font-bold bg-[#64748b]">
                          ✓
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Button */}
                {cfg.form && (
                  <a
                    href={cfg.form}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full p-2.5 rounded-xl mt-1.5 text-center text-sm font-semibold no-underline box-border transition-colors"
                    style={{
                      fontFamily: "var(--font-kanit), sans-serif",
                      color: cfg.color,
                      background: `${cfg.color}15`,
                      border: `1.5px solid ${cfg.color}55`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${cfg.color}28`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = `${cfg.color}15`)}
                  >
                    📋 กรอกฟอร์มส่งคลิป
                  </a>
                )}

                <button
                  className="w-full p-2.5 rounded-xl border-none text-sm font-semibold cursor-pointer mt-1.5 text-white transition-[opacity,transform] duration-150 hover:opacity-[0.88] hover:-translate-y-px active:opacity-75 active:translate-y-0"
                  style={{
                    fontFamily: "var(--font-kanit), sans-serif",
                    background: `linear-gradient(135deg, ${cfg.color}ee, ${cfg.color}bb)`,
                    boxShadow: `0 4px 16px ${cfg.color}44`,
                  }}
                  onClick={closeModal}
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="text-center mt-2.5 text-[11px] text-white/45" style={{ fontFamily: "var(--font-sarabun), sans-serif" }}>
              กดพื้นหลังหรือ ESC เพื่อปิด
            </div>
          </div>
        </div>
      )}
    </>
  );
}
