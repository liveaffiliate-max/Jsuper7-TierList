"use client";

import { useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { fetchTierCheck } from "../lib/checkUser";

export default function SearchBox({ onFound }) {
  const [phone, setPhone] = useState("");

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

    const data = await fetchTierCheck(phone, 0);

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

    onFound(data);
  };

  return (
    <div className="w-full max-w-[520px] bg-white p-[26px] md:p-10 rounded-[18px] md:rounded-3xl text-center shadow-[0_10px_30px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="mb-2.5 flex justify-center">
        <Image
          src="/jsuper7_jknowlogo.png"
          alt="Jsuper7 Logo"
          width={1040}
          height={560}
          priority
          className="w-[200px] md:w-[350px] max-w-full h-auto"
        />
      </div>
      <div className="text-[22px] md:text-[26px] font-bold text-[#1e3a5f] mb-[3px]">
        ตรวจสอบข้อมูลสมาชิก
      </div>
      <div className="text-sm md:text-base text-[#94a3b8] mb-6">
        JSUPER7 Membership
      </div>

      <h3 className="text-[13px] font-semibold text-[#475569] text-left mb-2">
        📞 เบอร์ที่ใช้ลงทะเบียน
      </h3>

      <div className="flex flex-col md:flex-row gap-2.5">
        <input
          className="flex-1 w-full px-4 py-[13px] rounded-xl border-2 border-[#e2e8f0] text-base md:text-[15px] text-[#1e293b] outline-none transition-colors focus:border-[#5BC271]"
          placeholder="09xxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checkUser()}
        />
        <button
          className="w-full md:w-auto px-5 py-[13px] rounded-xl border-none bg-gradient-to-br from-[#2563eb] to-[#3b82f6] text-white cursor-pointer text-base md:text-sm font-semibold whitespace-nowrap shadow-[0_4px_14px_rgba(59,130,246,0.35)] transition-all hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(59,130,246,0.45)]"
          onClick={checkUser}
        >
          ตรวจสอบข้อมูล
        </button>
      </div>
    </div>
  );
}
