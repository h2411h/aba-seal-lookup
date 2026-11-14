/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/dinh-dang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   dinhDangTien(n)      [export]  — 1234567 thành "1.234.567₫"
   dinhDangNgayVN(iso)  [export]  — Ngày ISO thành dd/mm/yyyy
   maHoaHtml(v)         [export]  — ★ Chống XSS: mã hóa ký tự đặc biệt, luôn bọc chuỗi người dùng nhập trước khi đưa vào innerHTML
   ========================================================================== */
// Hàm định dạng dùng chung cho cả trang khách hàng và nhân viên.

// 1234567 -> "1.234.567₫" (rỗng/null -> "0₫")
export function dinhDangTien(n) { return Number(n || 0).toLocaleString("vi-VN") + "₫"; }

// ISO timestamp/date -> "dd/mm/yyyy" (rỗng -> "—")
export function dinhDangNgayVN(iso) { return iso ? new Date(iso).toLocaleDateString("vi-VN") : "—"; }

// Mã hóa ký tự đặc biệt của HTML. LUÔN bọc quanh chuỗi do người dùng nhập (tên, ghi chú, nội dung phản hồi...)
// trước khi ghép vào innerHTML, để không ai chèn được thẻ <script> vào trang.
export function maHoaHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
