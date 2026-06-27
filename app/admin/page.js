"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอก username และ password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("admin", "true");

        router.push("/admin/dashboard");
      } else {
        setError("Username หรือ Password ไม่ถูกต้อง");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดของระบบ");
    }

    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoBox}>
          <Image src="/jsuper7_jknowlogo.png" alt="Jsuper7 Logo" width={1040} height={560} />
        </div>

        <h2 style={styles.title}>Admin Jknowledge</h2>

        <p style={styles.subtitle}>เข้าสู่ระบบผู้ดูแล Jsuper7</p>

        <form onSubmit={login}>
          <div style={styles.inputGroup}>
            <label>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Password</label>

            <div style={{ position: "relative" }}>
              <input
                style={styles.input}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                style={styles.showBtn}
              >
                {/* {showPassword ? "Hide" : "Show"} */}
              </span>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f3f4f6",
    fontFamily: "sans-serif",
  },

  card: {
    width: "420px",
    background: "#fff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
  },

  logoBox: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px",
  },

  title: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: "22px",
    color: "#333",
    marginTop: "10px",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: "30px",
  },

  inputGroup: {
    marginBottom: "18px",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    color: "#222",
  },

  show: {
    position: "absolute",
    right: "12px",
    top: "12px",
    fontSize: "13px",
    color: "#666",
    cursor: "pointer",
  },

  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#3b73e0",
    color: "white",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
  },
};
