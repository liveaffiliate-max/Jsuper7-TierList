import { describe, it, expect } from "vitest";
import { getTierInfo } from "./getTierInfo";

describe("getTierInfo", () => {
  it("คำนวณ Start tier ถูกต้องสำหรับยอดต่ำ", () => {
    const info = getTierInfo(5000);
    expect(info.current).toBe("Start");
    expect(info.next).toBe("Speed");
  });

  it("คำนวณ Speed tier ถูกต้อง", () => {
    const info = getTierInfo(25000);
    expect(info.current).toBe("Speed");
    expect(info.next).toBe("Super");
  });

  it("คำนวณ Super tier ถูกต้อง", () => {
    const info = getTierInfo(100000);
    expect(info.current).toBe("Super");
    expect(info.next).toBe("Star");
  });

  it("คำนวณ Star tier (สูงสุด) — ไม่มี next tier, progress เต็ม 100", () => {
    const info = getTierInfo(500000);
    expect(info.current).toBe("Star");
    expect(info.next).toBeNull();
    expect(info.progress).toBe(100);
    expect(info.remaining).toBe(0);
  });

  it("แปลง string ที่มี comma เป็นตัวเลขได้ถูกต้อง", () => {
    const info = getTierInfo("5,665.79");
    expect(info.current).toBe("Start");
  });

  it("จับ boundary ที่ขอบเขตพอดี (>= min ของ tier ถัดไป)", () => {
    expect(getTierInfo(9999).current).toBe("Start");
    expect(getTierInfo(10000).current).toBe("Speed"); // ขอบเขตพอดี → ขึ้น tier ถัดไป

    expect(getTierInfo(49999).current).toBe("Speed");
    expect(getTierInfo(50000).current).toBe("Super");

    expect(getTierInfo(199999).current).toBe("Super");
    expect(getTierInfo(200000).current).toBe("Star");
  });

  it("ค่าว่าง (empty string) ต้องไม่กลายเป็น NaN แล้วเข้าใจผิดว่าถึง Tier สูงสุด — ต้อง fallback เป็น Start ที่ 0%", () => {
    const info = getTierInfo("");
    expect(info.current).toBe("Start");
    expect(info.next).toBe("Speed");
    expect(info.progress).toBe(0);
  });

  it("ค่าที่ parse เป็นตัวเลขไม่ได้ (ข้อความสถานะจาก sheet เช่น 'ส่งแล้ว') ต้อง fallback เป็น 0 เช่นกัน", () => {
    const info = getTierInfo("ส่งแล้ว");
    expect(info.current).toBe("Start");
    expect(info.progress).toBe(0);
  });

  it("undefined/ไม่ส่ง argument มาเลย ใช้ default เป็น 0", () => {
    const info = getTierInfo();
    expect(info.current).toBe("Start");
    expect(info.progress).toBe(0);
  });

  it("คำนวณ progress ระหว่าง tier ได้ถูกต้องตามสัดส่วน", () => {
    // Speed: 10,000 - 49,999 → อยู่กึ่งกลางพอดีที่ 30,000
    const info = getTierInfo(30000);
    expect(info.current).toBe("Speed");
    expect(info.progress).toBeCloseTo(50, 0);
  });
});
