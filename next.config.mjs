/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ภาพในแอปนี้เป็น static brand logo คงที่ ไม่ต้องการ responsive variant ต่อ device
    // ปิด on-demand optimization กันชน quota free tier ของ Vercel (Image Optimization Transformations)
    unoptimized: true,
  },
};

export default nextConfig;
