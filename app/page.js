"use client";

import { useState } from "react";
import { TIER_CONFIG, ALL_TIERS } from "./lib/tierConfig";
import TierProgress from "./components/TierProgress";
import TierListDetail from "./components/TierListdetail";

import Swal from "sweetalert2";

export default function Home() {
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  
  const [monthOffset, setMonthOffset] = useState(0);
  const [user, setUser] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);

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

const getThaiMonth = (month) => {
  return TH_MONTHS[month] || month;
};

  const getMonthLabel = () => {

  const now = new Date();

  const target = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset
  );

  return target.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });

};

  const checkUser = async () => {
    if (!phone) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกเบอร์โทร",
        text: "โปรดกรอกเบอร์โทรศัพท์ก่อนตรวจสอบ",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (phone.length !== 10) {
      Swal.fire({
        icon: "error",
        title: "เบอร์โทรไม่ถูกต้อง",
        text: "กรุณากรอกเบอร์โทร 10 หลัก",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    Swal.fire({
      title: "กำลังตรวจสอบข้อมูล",
      text: "กรุณารอสักครู่...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await fetch("/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, monthOffset }),
    });

    const data = await res.json();

    Swal.close();

    if (!data.found) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบข้อมูลสมาชิก",
        text: "กรุณาตรวจสอบเบอร์โทรอีกครั้ง",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "พบข้อมูลสมาชิก",
      text: "กำลังเข้าสู่หน้าข้อมูลสมาชิก",
      timer: 800,
      showConfirmButton: false,
    });

    setUser(data);
  };

  const loadMonth = async (offset) => {
    setMonthLoading(true);

    const res = await fetch("/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        monthOffset: offset,
      }),
    });

    const data = await res.json();

    setMonthLoading(false);

    if (data.found) {
      setUser(data);
    }

    if(data.noData){
      Swal.fire({
        icon:"info",
        title:`ไม่มีข้อมูลเดือน ${getThaiMonth(data.month)}`,
        text:"ยังไม่มีข้อมูลยอดขายสำหรับเดือนนี้"
      });
      return;
    }
  };

  const getTierInfo = (totalRaw = 0) => {
    // แปลง "5,665.79" → 5665.79
    const total =
      typeof totalRaw === "string"
        ? parseFloat(totalRaw.replace(/,/g, ""))
        : Number(totalRaw);

    const tiers = Object.keys(TIER_CONFIG);
    let current = tiers[0];
    let next = null;

    for (let i = 0; i < tiers.length; i++) {
      const tierName = tiers[i];
      const tier = TIER_CONFIG[tierName];

      if (total >= tier.min && total <= tier.max) {
        current = tierName;
        next = tiers[i + 1] || null;
        break;
      }
    }

    const currentTier = TIER_CONFIG[current];
    const nextTier = next ? TIER_CONFIG[next] : null;

    let progress = 100;
    let remaining = 0;

    if (nextTier) {
      const range = nextTier.min - currentTier.min;
      progress = ((total - currentTier.min) / range) * 100;
      progress = Math.max(0, Math.min(progress, 100));
      remaining = Math.max(nextTier.min - total, 0);
    }

    return { current, next, progress, remaining, tierData: currentTier };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Prompt', sans-serif !important; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }

        .page {
          min-height: 100vh;
          background: url("/website.png");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Prompt', sans-serif;
          padding: 40px 20px 56px;
        }

        .mainlogo{
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .mainlogo img{
          width: 120px;
          height: auto;
        }

        .searchBox{
          width: 520px;
          background: #ffffff;
          padding: 40px;
          border-radius: 24px;
          text-align: center;
          box-shadow: 
            0 10px 30px rgba(0,0,0,0.15),
            0 2px 8px rgba(0,0,0,0.08);
        }

        .searchBox-logo { 
          margin-bottom: 10px;
          display: flex;
          justify-content: center;
        }

        .searchBox-logo img{
          width:350px;
          max-width:100%;
          height:auto;
        }

        .searchBox-title { 
          font-size: 26px; 
          font-weight: 700; 
          color: #1e3a5f; 
          margin-bottom: 3px; 
        }

        .searchBox-sub { 
          font-size: 16px; 
          color: #94a3b8; 
          margin-bottom: 24px; 
        }

        .searchBox h3 {
          font-size: 13px; 
          font-weight: 600; 
          color: #475569;
          text-align: left; 
          margin-bottom: 8px;
        }

        .searchRow { 
          display: flex; 
          gap: 10px; 
        }

        .searchRow input {
          flex: 1; 
          padding: 13px 16px; 
          border-radius: 12px;
          border: 2px solid #e2e8f0; 
          font-size: 15px;
          font-family: 'Prompt', sans-serif; 
          color: #1e293b;
          outline: none; 
          transition: border-color 0.2s;
        }

        .searchRow input:focus { 
          border-color: #5BC271; 
        }

        .searchRow button {
          padding: 13px 20px; 
          border-radius: 12px; 
          border: none;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white; 
          cursor: pointer; 
          font-size: 14px; 
          font-weight: 600;
          font-family: 'Prompt', sans-serif; 
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(59,130,246,0.35); 
          transition: all 0.2s;
        }

        .searchRow button:hover { 
          transform: translateY(-1px); 
          box-shadow: 0 6px 20px rgba(59,130,246,0.45); 
        }

        .dashboard { max-width: 860px; margin: 0 auto; animation: fadeUp 0.45s ease; }

        /* ---- Month Navigator ---- */
        .month-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          font-weight: 600;
          font-size: 18px;
        }

        .month-nav-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #1e293b;
        }

        .month-nav-btn:hover:not(:disabled) {
          background: #2563eb;
          color: white;
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(37,99,235,0.35);
        }

        .month-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .month-label {
          min-width: 160px;
          text-align: center;
          background: white;
          padding: 8px 20px;
          border-radius: 999px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          color: #1e293b;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* ---- Loading Spinner (inline in month label) ---- */
        .month-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #cbd5e1;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* ---- Dashboard overlay while loading month ---- */
        .dashboard-wrap {
          position: relative;
        }

        .dashboard-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(3px);
          border-radius: 20px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          animation: fadeUp 0.2s ease;
        }

        .overlay-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        .overlay-text {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        /* ---- Skeleton shimmer for cards while loading ---- */
        .skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 600px 100%;
          animation: shimmer 1.2s infinite linear;
          border-radius: 8px;
        }

        .profileCard {
          background: white; border-radius: 20px; padding: 24px 28px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          gap: 20px; flex-wrap: wrap;
          transition: opacity 0.3s;
        }

        .profileCard.loading-blur {
          pointer-events: none;
        }

        .profileCard img {
          width: 70px; height: 70px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .profileCard > div:nth-child(2) { flex: 1; min-width: 140px; }
        .profileCard h2 { font-size: 24px; font-weight: 800; color: #000000; margin-bottom: 4px; }
        .profileCard p {color: #000000;}
        .profileCard > div:nth-child(2) > p { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 10px; }

        .tier {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.3px;
          box-shadow:
            0 4px 12px rgba(37, 99, 235, 0.35),
            inset 0 1px 0 rgba(255,255,255,0.3);
          margin-top: 16px;
        }

        .total { text-align: right; }
        .total p { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
        .total h1 { font-size: 32px; font-weight: 800; color: #16a34a; letter-spacing: -0.5px; }

        .cards {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;
        }
        @media (max-width: 620px) {
          .cards { grid-template-columns: 1fr; }
          .profileCard { flex-direction: column; text-align: center; }
          .total { text-align: center; }
        }
        .card {
          background: white; padding: 20px; border-radius: 16px; text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.07); transition: transform 0.2s;
          display: flex; flex-direction: column;
        }
        .card:hover { transform: translateY(-2px); }
        .card h3 { font-size: 14px; font-weight: 600; color: #334155; line-height: 1.3; }
        .card p { font-size: 12px; color: #94a3b8; margin: 4px 0 12px; }
        .card h2 {
          font-size: 22px; font-weight: 700; color: #ef4444;
          margin-top: auto; padding-top: 12px; border-top: 1px solid #f1f5f9;
        }

        .tier-section{
          background:white;
          border-radius:18px;
          padding:22px;
          margin-top:18px;
          box-shadow:0 6px 20px rgba(0,0,0,0.08);
        }

        .ts-title{
          font-size:15px;
          font-weight:700;
          margin-bottom:16px;
          color:#1e293b;
        }

        .tier-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:12px;
        }

        @media(max-width:620px){
          .tier-grid{
            grid-template-columns:1fr 1fr;
          }
        }

        .tier-item{
          padding:16px;
          border-radius:14px;
          border:2px solid;
          text-align:center;
          transition:0.2s;
        }

        .tier-item.active{
          transform:scale(1.05);
          box-shadow:0 6px 16px rgba(0,0,0,0.15);
        }

        .ti-icon{
          font-size:24px;
          margin-bottom:6px;
        }

        .ti-name{
          font-weight:700;
          font-size:14px;
        }

        .ti-range{
          font-size:12px;
          margin-top:4px;
        }

        .logout-btn{
          margin-top:20px;
          width:100%;
          padding:12px;
          border:none;
          border-radius:12px;
          font-family:'Prompt';
          font-weight:600;
          cursor:pointer;
          background:#ef4444;
          color:white;
        }

        /* -------- TABLET -------- */
        @media (max-width: 1024px){
          .dashboard{ max-width:95%; }
          .searchBox{ width:100%; max-width:520px; }
        }

        /* -------- MOBILE -------- */
        @media (max-width: 768px){
          .page{ padding:24px 16px 40px; }
          .searchBox{ width:100%; padding:26px 18px; border-radius:18px; }
          .searchBox-logo img{ width:200px; }
          .searchBox-title{ font-size:22px; }
          .searchBox-sub{ font-size:14px; }
          .searchRow{ flex-direction:column; }
          .searchRow input{ width:100%; font-size:16px; }
          .searchRow button{ width:100%; font-size:16px; }
          .profileCard{ flex-direction:column; text-align:center; padding:20px; }
          .profileCard img{ width:80px; height:80px; }
          .profileCard h2{ font-size:20px; }
          .total{ text-align:center; }
          .total h1{ font-size:26px; }
          .cards{ grid-template-columns:1fr; }
          .card img{ width:80px; margin:0 auto 10px; }
          .card h2{ font-size:20px; }
          .tier-grid{ grid-template-columns:1fr 1fr; }
          .month-label{ min-width:130px; font-size:14px; }
        }
      `}</style>

      <div className="page">
        {/* Search Box */}
        {!user && (
          <div className="searchBox">
            <div className="searchBox-logo">
              <img src="/jsuper7_jknowlogo.png" alt="Jsuper7 Logo" />
            </div>
            <div className="searchBox-title">ตรวจสอบข้อมูลสมาชิก</div>
            <div className="searchBox-sub">JSUPER7 Membership</div>

            <h3>📞 เบอร์ที่ใช้ลงทะเบียน</h3>

            <div className="searchRow">
              <input
                placeholder="09xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkUser()}
              />
              <button onClick={checkUser}>ตรวจสอบข้อมูล</button>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {user && user.found && (
          <div className="dashboard">

            {/* Month Navigator */}
            <div className="month-nav">
              <button
                className="month-nav-btn"
                disabled={monthLoading}
                onClick={() => {
                  const newOffset = monthOffset - 1;
                  setMonthOffset(newOffset);
                  loadMonth(newOffset);
                }}
              >
                ◀
              </button>

              <div className="month-label">
                {monthLoading && <div className="month-spinner" />}
                <span>{getMonthLabel()}</span>
              </div>

              <button
                className="month-nav-btn"
                disabled={monthOffset === 0 || monthLoading}
                onClick={() => {
                  const newOffset = monthOffset + 1;
                  setMonthOffset(newOffset);
                  loadMonth(newOffset);
                }}
              >
                ▶
              </button>
            </div>

            {/* Dashboard content with overlay */}
            <div className="dashboard-wrap">

              {/* Loading overlay */}
              {monthLoading && (
                <div className="dashboard-overlay">
                  <div className="overlay-spinner" />
                  <div className="overlay-text">กำลังโหลดข้อมูล...</div>
                </div>
              )}

              {/* Profile */}
              <div className={`profileCard${monthLoading ? " loading-blur" : ""}`}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <h2>{user.fullname}</h2>
                  <p>📞 {user.phone}</p>
                  <div className="tier">ระดับ {user.tier}</div>
                </div>

                <div className="total">
                  <p>ยอดขายรวม</p>
                  <h1>฿{user.total_sale}</h1>
                </div>
              </div>

              {/* Progress to next tier */}
              <TierProgress
                totalSale={user.total_sale}
                getTierInfo={getTierInfo}
                TIER_CONFIG={TIER_CONFIG}
              />

              {/* Sale Cards */}
              <div className="cards">
                <div className="card">
                  <img src="/logo_jknow.png" alt="JKnowledge" />
                  <h3>หนังสือเตรียมสอบมหาลัย</h3>
                  <p>(Tiktok)</p>
                  <h2>฿{user.sale_uni}</h2>
                </div>

                <div className="card">
                  <img src="/logo_jkorpor.png" alt="Jkorpor" />
                  <h3>หนังสือเตรียมสอบราชการ</h3>
                  <p>(Tiktok)</p>
                  <h2>฿{user.sale_exam}</h2>
                </div>

                <div className="card">
                  <img src="/logo_shopee.png" alt="Shopee" />
                  <h3>JKnowledge Shop</h3>
                  <p>(Shopee)</p>
                  <h2>฿{user.shopee}</h2>
                </div>
              </div>

              {/* Tier Info */}
              <TierListDetail user={user} />

            </div>
            {/* end dashboard-wrap */}

            {/* Logout */}
            <button
              className="logout-btn"
              onClick={() => {
                setUser(null);
                setPhone("");
                setError("");
                setMonthOffset(0);
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </>
  );
}