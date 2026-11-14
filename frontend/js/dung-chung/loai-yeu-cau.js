/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/loai-yeu-cau.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   nhanLoaiYeuCau(t)  [export]  — Nhãn tiếng Việt của loại yêu cầu
   ========================================================================== */
// Tên hiển thị của LOẠI YÊU CẦU (báo giá / tư vấn / bảo hành / khiếu nại...) — DÙNG CHUNG cho khách và nhân viên.
// LOAI_YEU_CAU là 4 loại đang dùng (nhân viên chọn/lọc); các loại "(cũ)" chỉ để hiển thị dữ liệu đã có từ trước.
export const LOAI_YEU_CAU = ['product_inquiry', 'technical_advice', 'warranty', 'complaint'];

export const NHAN_LOAI_YEU_CAU = {
  product_inquiry: '🔍 Hỏi sản phẩm',
  technical_advice: '🔧 Tư vấn kỹ thuật',
  warranty: '🛡️ Bảo hành / Đổi trả',
  complaint: '⚠️ Khiếu nại',
  // Loại cũ — không còn tạo mới
  stock_status: '📦 Tình trạng hàng (cũ)',
  pricing: '💰 Báo giá (cũ)',
  promotion: '🏷️ Khuyến mãi (cũ)',
  return_exchange: '↩️ Đổi/trả (cũ)',
  after_sales: '🤝 Sau bán (cũ)',
  other: '❓ Khác (cũ)'
};

export const nhanLoaiYeuCau = (t) => NHAN_LOAI_YEU_CAU[t] || t;
