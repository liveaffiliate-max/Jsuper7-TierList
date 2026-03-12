import React from "react";
import { TIER_CONFIG, ALL_TIERS } from "../lib/tierConfig";

export default function TierProgress({ totalSale, getTierInfo, TIER_CONFIG }) {
  const info = getTierInfo(totalSale);

  return (
    <div
      style={{
        marginTop: 18,
        background: "#ffffff",
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
        marginBottom: 20
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          📈 ความก้าวหน้า Tier
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          {Math.round(info.progress)}%
        </div>
      </div>

      {info.next ? (
        <>
          {/* Tier labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
              color: "#94a3b8",
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            <span>
              {TIER_CONFIG[info.current].icon} {info.current}
            </span>

            <span>
              {TIER_CONFIG[info.next].icon} {info.next}
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 12,
              borderRadius: 99,
              background: "#e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${info.progress}%`,
                background: `linear-gradient(90deg, ${TIER_CONFIG[info.current].color}, ${TIER_CONFIG[info.next].color})`,
                borderRadius: 99,
                transition: "width 1s ease",
                boxShadow: `0 2px 8px ${TIER_CONFIG[info.next].color}55`,
              }}
            />
          </div>

          {/* Info */}
          <div
            style={{
              textAlign: "center",
              marginTop: 12,
              fontSize: 16,
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            อีก{" "}
            <span style={{ color: "#ef4444", fontWeight: 700 }}>
              ฿{Math.ceil(info.remaining).toLocaleString()}
            </span>{" "}
            จะขึ้น Tier {info.next} {TIER_CONFIG[info.next].icon}
          </div>
        </>
      ) : (
        <>
          {/* Full bar */}
          <div
            style={{
              height: 12,
              borderRadius: 99,
              background: "#ede9fe",
              overflow: "hidden",
              marginTop: 4,
            }}
          >
            <div
              style={{
                height: "100%",
                width: "100%",
                background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                borderRadius: 99,
                boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
              }}
            />
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: 8,
              fontSize: 16,
              color: "#7c3aed",
              fontWeight: 700,
            }}
          >
            ⭐ ถึง Tier สูงสุดแล้ว!
          </div>
        </>
      )}
    </div>
  );
}