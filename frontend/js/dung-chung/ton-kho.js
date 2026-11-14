/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/ton-kho.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   laHetHang(n)    [export]  — Hết hàng khi tồn ≤ 0
   laSapHet(n)     [export]  — Sắp hết khi 0 < tồn < NGUONG_SAP_HET (30)
   canNhapThem(n)  [export]  — Cần nhập thêm khi tồn < NGUONG_SAP_HET
   ========================================================================== */
// Quy ước tồn kho DUY NHẤT cho cả website (khách + nhân viên).
// Muốn đổi ngưỡng "sắp hết" thì chỉ sửa NGUONG_SAP_HET ở đây — mọi trang tự đổi theo.
//
//   Hết hàng : còn 0 (hoặc ít hơn)
//   Sắp hết  : còn từ 1 đến dưới NGUONG_SAP_HET
//   Cần nhập : hết hàng + sắp hết (tức còn dưới NGUONG_SAP_HET) — dùng cho số đếm cảnh báo của thủ kho
export const NGUONG_SAP_HET = 30;

export const laHetHang = (n) => Number(n || 0) <= 0;
export const laSapHet = (n) => { const v = Number(n || 0); return v > 0 && v < NGUONG_SAP_HET; };
export const canNhapThem = (n) => Number(n || 0) < NGUONG_SAP_HET;
