/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/trang-thai-don.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   nhanTrangThaiDon(s)  [export]  — Nhãn tiếng Việt của trạng thái đơn
   ========================================================================== */
// Tên hiển thị của trạng thái đơn hàng — DÙNG CHUNG cho khách và nhân viên:
// mỗi trạng thái chỉ có MỘT tên, đổi ở đây là mọi trang đổi theo.
// CAC_TRANG_THAI giữ thứ tự hiển thị (nút lọc, biểu đồ).
export const CAC_TRANG_THAI = ['pending', 'confirmed', 'shipped', 'partially_delivered', 'delivery_failed', 'completed', 'cancelled'];

export const NHAN_TRANG_THAI_DON = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipped: 'Đang giao', partially_delivered: 'Giao một phần',
  delivery_failed: 'Giao thất bại', completed: 'Hoàn tất', cancelled: 'Đã hủy'
};

export const nhanTrangThaiDon = (s) => NHAN_TRANG_THAI_DON[s] || s;
