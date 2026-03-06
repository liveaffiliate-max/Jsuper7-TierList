"use client";

import { useState } from "react";

export default function Home() {

  const [error, setError] = useState("");

const ALL_TIERS = ["Start", "Speed", "Super", "Star"];

const TIER_CONFIG = {
  Start: {
    icon: "🚩",
    bg: "#f1f5f9",
    border: "#cbd5f5",
    color: "#475569",
    range: "0 - 9,999 บาท"
  },
  Speed: {
    icon: "⚡",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    color: "#0284c7",
    range: "10,000 - 49,999 บาท"
  },
  Super: {
    icon: "🚀",
    bg: "#fef9c3",
    border: "#fde047",
    color: "#ca8a04",
    range: "50,000 - 199,999 บาท"
  },
  Star: {
    icon: "⭐",
    bg: "#ede9fe",
    border: "#c4b5fd",
    color: "#7c3aed",
    range: "200,000+ บาท"
  }
};

  const [phone, setPhone] = useState("");
  const [user, setUser] = useState(null);

  const checkUser = async () => {

    const res = await fetch("/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    setUser(data);
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

        .page {
          min-height: 100vh;
          background: linear-gradient(155deg, #1a3a5c 0%, #1e5799 55%, #2980b9 100%);
          padding: 40px 20px 56px;
          font-family: 'Prompt', sans-serif;
        }

        .searchBox {
          background: white;
          padding: 38px 34px;
          border-radius: 22px;
          max-width: 500px;
          margin: 64px auto 0;
          text-align: center;
          box-shadow: 0 24px 64px rgba(0,0,0,0.22);
          animation: fadeUp 0.45s ease;
        }
        .searchBox-logo { font-size: 42px; margin-bottom: 10px; }
        .searchBox-title { font-size: 21px; font-weight: 700; color: #1e3a5f; margin-bottom: 3px; }
        .searchBox-sub { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
        .searchBox h3 {
          font-size: 13px; font-weight: 600; color: #475569;
          text-align: left; margin-bottom: 8px;
        }

        .searchRow { display: flex; gap: 10px; margin-top: 0; }
        .searchRow input {
          flex: 1; padding: 13px 16px; border-radius: 12px;
          border: 2px solid #e2e8f0; font-size: 15px;
          font-family: 'Prompt', sans-serif; color: #1e293b;
          outline: none; transition: border-color 0.2s;
        }
        .searchRow input:focus { border-color: #3b82f6; }
        .searchRow button {
          padding: 13px 20px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white; cursor: pointer; font-size: 14px; font-weight: 600;
          font-family: 'Prompt', sans-serif; white-space: nowrap;
          box-shadow: 0 4px 14px rgba(59,130,246,0.35); transition: all 0.2s;
        }
        .searchRow button:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.45); }

        .dashboard { max-width: 860px; margin: 0 auto; animation: fadeUp 0.45s ease; }

        .profileCard {
          background: white; border-radius: 20px; padding: 24px 28px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          gap: 20px; flex-wrap: wrap;
        }
        .profileCard img {
          width: 70px; height: 70px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .profileCard > div:nth-child(2) { flex: 1; min-width: 140px; }
        .profileCard h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .profileCard > div:nth-child(2) > p { font-size: 13px; color: #64748b; margin-bottom: 10px; }

        .tier {
          display: inline-block;
          background: linear-gradient(135deg, #2563eb, #3b82f6) !important;
          color: white !important; padding: 6px 14px !important;
          border-radius: 20px !important; font-size: 13px; font-weight: 600;
          box-shadow: 0 3px 10px rgba(59,130,246,0.3); margin-top: 5px;
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
      `}</style>

      <div className="page">

        {/* Search Box */}

        {!user && (
          <div className="searchBox">
            <div className="searchBox-logo">📊</div>
            <div className="searchBox-title">ตรวจสอบข้อมูลสมาชิก</div>
            <div className="searchBox-sub">JSUPER7 Membership System</div>

            <h3>📱 เบอร์ที่ใช้ลงทะเบียน</h3>

            <div className="searchRow">
              <input
                placeholder="0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkUser()}
              />

              <button onClick={checkUser}>
                ตรวจสอบข้อมูล
              </button>
            </div>

          </div>
        )}

        {/* Dashboard */}

        {user && user.found && (

          <div className="dashboard">

            {/* Profile */}

            <div className="profileCard">

              <img
                src={user.profile}
              />

              <div>

                <h2>{user.fullname}</h2>

                <p>📱 {user.phone}</p>

                <div className="tier">
                  ⚡ ระดับ {user.tier}
                </div>

              </div>

              <div className="total">
                <p>ยอดขายรวม</p>
                <h1>฿{user.total_sale}</h1>
              </div>

            </div>


            {/* Sale Cards */}

            <div className="cards">

              <div className="card">
                <h3>หนังสือเตรียมสอบมหาลัย</h3>
                <p>(Tiktok)</p>

                <h2>฿{user.sale_uni}</h2>
              </div>

              <div className="card">
                <h3>หนังสือเตรียมสอบราชการ</h3>
                <p>(Tiktok)</p>

                <h2>฿{user.sale_exam}</h2>
              </div>

              <div className="card">
                <h3>หนังสือเตรียมสอบมหาลัย</h3>
                <p>(Shopee)</p>

                <h2>฿{user.shopee}</h2>
              </div>

            </div>

            {/* Tier Info */}

<div className="tier-section">

  <div className="ts-title">
    📊 เกณฑ์ระดับยอดขายในการจัด Tier
  </div>

  <div className="tier-grid">

    {ALL_TIERS.map((t) => {

      const cfg = TIER_CONFIG[t];
      const isActive = user.tier === t;

      return (

        <div
          key={t}
          className={`tier-item ${isActive ? "active" : ""}`}
          style={{
            background: cfg.bg,
            borderColor: isActive ? cfg.color : cfg.border
          }}
        >

          <div className="ti-icon">{cfg.icon}</div>

          <div className="ti-name" style={{ color: cfg.color }}>
            {t}
          </div>

          <div className="ti-range" style={{ color: cfg.color }}>
            {cfg.range}
          </div>

        </div>

      );
    })}

  </div>

</div>

{/* Logout */}

<button
  className="logout-btn"
  onClick={() => {
    setUser(null);
    setPhone("");
    setError("");
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