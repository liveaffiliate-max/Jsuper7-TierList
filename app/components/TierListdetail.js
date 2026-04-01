"use client";

import { useState, useEffect } from "react";
import { TIER_CONFIG, ALL_TIERS } from "../lib/tierConfig";

export default function TierListDetail({ user }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [animating, setAnimating] = useState(false);

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700&family=Sarabun:wght@400;500&display=swap');

        .tier-section { font-family: 'Kanit', sans-serif; }

        .ts-title {
          font-size: 15px; font-weight: 600; color: #475569; margin-bottom: 14px;
        }

        /* Grid: 4 equal columns on desktop, 2 on mobile */
        .tier-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        @media (max-width: 480px) {
          .tier-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .tier-item {
          border: 2px solid transparent;
          border-radius: 14px;
          padding: 16px 10px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          /* Force equal height columns */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 110px;
          box-sizing: border-box;
        }

        .tier-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .tier-item.active {
          box-shadow: 0 0 0 3px rgba(99,102,241,0.25), 0 6px 20px rgba(0,0,0,0.1);
        }

        .ti-icon {
          font-size: 28px;
          margin-bottom: 6px;
          line-height: 1;
          display: block;
        }

        .ti-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
          line-height: 1.2;
          word-break: break-word;
        }

        .ti-range {
          font-size: 14px;
          font-weight: 500;
          opacity: 0.8;
          font-family: 'Sarabun', sans-serif;
          line-height: 1.4;
          /* Prevent text wrapping differently per card */
          word-break: keep-all;
          white-space: nowrap;
        }

        @media (max-width: 360px) {
          .ti-range { font-size: 9px; white-space: normal; }
          .ti-name  { font-size: 12px; }
        }

        /* ── Overlay ─────────────────────────── */
        .tier-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          background: rgba(15,23,42,0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: overlayIn 0.22s ease forwards;
        }
        .tier-modal-overlay.closing { animation: overlayOut 0.25s ease forwards; }
        @keyframes overlayIn { from { opacity: 0; } to   { opacity: 1; } }
        @keyframes overlayOut { from { opacity: 1; } to   { opacity: 0; } }

        /* ── Popup card ──────────────────────── */
        .tier-popup-card {
          width: 100%;
          max-width: 380px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.3);
          animation: cardIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
          font-family: 'Kanit', sans-serif;
          /* Scrollable on small screens */
          max-height: calc(100vh - 80px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tier-popup-card.closing { animation: cardOut 0.22s ease forwards; }
        @keyframes cardIn {
          from { opacity:0; transform: scale(0.85) translateY(20px); }
          to   { opacity:1; transform: scale(1)    translateY(0);    }
        }
        @keyframes cardOut {
          from { opacity:1; transform: scale(1);    }
          to   { opacity:0; transform: scale(0.9) translateY(12px); }
        }

        /* ── Header ──────────────────────────── */
        .tpc-header {
          position: relative; padding: 18px 22px 14px; text-align: center;
        }
        .tpc-shine {
          position: absolute; top:-60px; left:50%; transform:translateX(-50%);
          width:220px; height:220px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .tpc-active-badge {
          position: absolute; top: 12px; right: 12px;
          background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.4);
          border-radius: 999px; padding: 3px 10px;
          font-size: 10px; font-weight: 700; color: white;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .tpc-icon-wrap {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px; font-size: 34px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3);
          flex-shrink: 0;
        }
        .tpc-tier-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 2px;
        }
        .tpc-tier-name {
          font-size: 22px; font-weight: 700; color: #fff;
          text-shadow: 0 2px 8px rgba(0,0,0,0.2); margin-bottom: 8px; line-height: 1;
        }
        .tpc-range-badge {
          display: inline-block; padding: 4px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.95);
          font-size: 12px; font-weight: 500; font-family: 'Sarabun', sans-serif;
          border: 1px solid rgba(255,255,255,0.25);
        }

        /* ── Body ────────────────────────────── */
        .tpc-body { background: #ffffff; padding: 20px 20px 24px; }

        .tpc-row { display: flex; gap: 10px; margin-bottom: 14px; }

        .tpc-info-box {
          flex: 1; border-radius: 12px; padding: 12px 8px; text-align: center;
          background: #f8fafc; border: 1px solid #e2e8f0;
          min-width: 0; /* allow shrinking */
        }
        .tpc-info-box-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;
        }
        .tpc-info-box-value {
          font-size: 12px; font-weight: 700; color: #1e293b;
          line-height: 1.35; font-family: 'Sarabun', sans-serif;
          word-break: break-word;
        }

        .tpc-section { margin-bottom: 14px; }
        .tpc-section-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: #94a3b8; margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .tpc-section-label::after { content:''; flex:1; height:1px; background:#f1f5f9; }

        .tpc-list { display: flex; flex-direction: column; gap: 6px; }
        .tpc-list-item {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 13px; color: #334155;
          font-family: 'Sarabun', sans-serif; line-height: 1.55;
        }
        .tpc-list-dot {
          width: 18px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: white; font-weight: 700;
        }

        .tpc-close-btn {
          width: 100%; padding: 10px; border-radius: 12px; border: none;
          font-family: 'Kanit', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; margin-top: 6px; color: #fff;
          transition: opacity 0.15s, transform 0.15s;
        }
        .tpc-close-btn:hover  { opacity: 0.88; transform: translateY(-1px); }
        .tpc-close-btn:active { opacity: 0.75; transform: translateY(0); }

        .tpc-dismiss {
          text-align: center; margin-top: 10px; font-size: 11px;
          color: rgba(255,255,255,0.45); font-family: 'Sarabun', sans-serif;
        }

        /* ── Mobile tweaks for popup ─────────── */
        @media (max-width: 420px) {
          .tpc-header { padding: 28px 18px 20px; }
          .tpc-body   { padding: 16px 16px 20px; }
          .tpc-tier-name { font-size: 22px; }
          .tpc-list-item { font-size: 12px; }
        }
      `}</style>

      {/* ── Tier Grid ── */}
      <div className="tier-section">
        <div className="ts-title">📊 เกณฑ์ระดับยอดขายในการจัด Tier</div>

        <div className="tier-grid">
          {ALL_TIERS.map((t) => {
            const c = TIER_CONFIG[t];
            const isActive = user?.tier === t;
            return (
              <div
                key={t}
                className={`tier-item ${isActive ? "active" : ""}`}
                style={{ background: c.bg, borderColor: isActive ? c.color : c.border }}
                onClick={() => openModal(t)}
              >
                <span className="ti-icon">{c.icon}</span>
                <div className="ti-name" style={{ color: c.color }}>{t}</div>
                <div className="ti-range" style={{ color: c.color }}>{c.range}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Popup ── */}
      {selectedTier && cfg && (
        <div
          className={`tier-modal-overlay ${!animating ? "closing" : ""}`}
          onClick={closeModal}
        >
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%", maxWidth:380 }}>
            <div
              className={`tier-popup-card ${!animating ? "closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="tpc-header"
                style={{ background: `linear-gradient(145deg, ${cfg.color}ee, ${cfg.color}99)` }}
              >
                <div className="tpc-shine" />
                {user?.tier === selectedTier && (
                  <div className="tpc-active-badge">✦ Tier ปัจจุบัน</div>
                )}
                <div className="tpc-icon-wrap">{cfg.icon}</div>
                <div className="tpc-tier-label">ระดับ</div>
                <div className="tpc-tier-name">{selectedTier}</div>
                <div className="tpc-range-badge">💰 {cfg.range}</div>
              </div>

              {/* Body */}
              <div className="tpc-body">
                {/* Budget + Requirement */}
                <div className="tpc-row">
                  <div className="tpc-info-box">
                    <div className="tpc-info-box-label">💵 Budget</div>
                    <div className="tpc-info-box-value" style={{ color: cfg.color }}>
                      {cfg.budget}
                    </div>
                  </div>
                  <div className="tpc-info-box">
                    <div className="tpc-info-box-label">📋 Requirement</div>
                    <div className="tpc-info-box-value">
                      {cfg.requirement.split("\n").map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>

                

                {/* Reward */}
                <div className="tpc-section">
                  <div className="tpc-section-label">🎁 Reward</div>
                  <div className="tpc-list">
                    {cfg.reward.map((item, i) => (
                      <div key={i} className="tpc-list-item">
                        <div className="tpc-list-dot" style={{ background: cfg.color }}>{i + 1}</div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Rights */}
                <div className="tpc-section">
                  <div className="tpc-section-label">⭐ สิทธิพิเศษเพิ่มเติม</div>
                  <div className="tpc-list">
                    {cfg.specialRights.map((item, i) => (
                      <div key={i} className="tpc-list-item">
                        <div className="tpc-list-dot" style={{ background: "#64748b" }}>✓</div>
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
    style={{
      display: "block",
      width: "100%",
      padding: "10px",
      borderRadius: "12px",
      marginTop: "6px",
      textAlign: "center",
      fontFamily: "'Kanit', sans-serif",
      fontSize: "14px",
      fontWeight: 600,
      color: cfg.color,
      background: `${cfg.color}15`,
      border: `1.5px solid ${cfg.color}55`,
      textDecoration: "none",
      boxSizing: "border-box",
      transition: "background 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = `${cfg.color}28`)}
    onMouseLeave={(e) => (e.currentTarget.style.background = `${cfg.color}15`)}
  >
    📋 กรอกฟอร์มส่งคลิป
  </a>
)}

                <button
                  className="tpc-close-btn"
                  style={{
                    background: `linear-gradient(135deg, ${cfg.color}ee, ${cfg.color}bb)`,
                    boxShadow: `0 4px 16px ${cfg.color}44`,
                  }}
                  onClick={closeModal}
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="tpc-dismiss">กดพื้นหลังหรือ ESC เพื่อปิด</div>
          </div>
        </div>
      )}
    </>
  );
}