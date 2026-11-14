/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/ma-don.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   maDon(donOrId)  [export]  — Mã đơn hiển thị chung: 8 ký tự đầu của id viết HOA
   ========================================================================== */
// Mã đơn hiển thị — DÙNG CHUNG cho khách hàng và nhân viên để mọi nơi đều ra cùng 1 mã.
// Quy ước: 8 ký tự đầu của id, viết HOA. Ví dụ id "12877d69-...." -> "12877D69".
// Khách đọc mã này cho nhân viên là tìm được đúng đơn trên trang Đơn hàng.
export function maDon(donOrId) {
  const id = typeof donOrId === "object" && donOrId !== null ? donOrId.id : donOrId;
  return String(id || "").slice(0, 8).toUpperCase();
}
