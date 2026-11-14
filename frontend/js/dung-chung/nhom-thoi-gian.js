/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/nhom-thoi-gian.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   thongTinNhomThoiGian(ngay, kieu)  [export]  — Gom nhóm theo ngày/tuần/tháng, dùng chung cho Đơn hàng và Kho hàng
   ========================================================================== */
// Gom nhóm theo ngày / tuần / tháng — DÙNG CHUNG cho trang Đơn hàng và Kho hàng.
// kieu: "day" | "week" | "month" | khác -> không gom (key "all").
export function thongTinNhomThoiGian(ngay, kieu) {
  const d = new Date(ngay);
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const pad = n => String(n).padStart(2, "0");
  if (kieu === "day") return { key: `${y}-${pad(m)}-${pad(day)}`, label: `Ngày ${pad(day)}/${pad(m)}/${y}` };
  if (kieu === "month") return { key: `${y}-${pad(m)}`, label: `Tháng ${m}/${y}` };
  if (kieu === "week") {
    const w = Math.ceil(day / 7);
    const startDay = (w - 1) * 7 + 1;
    const daysInMonth = new Date(y, m, 0).getDate();
    const endDay = Math.min(w * 7, daysInMonth);
    return { key: `${y}-${pad(m)}-w${w}`, label: `Tuần ${w} · ${pad(startDay)}–${pad(endDay)}/${pad(m)}/${y}` };
  }
  return { key: "all", label: null };
}
