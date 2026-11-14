// Hằng số của trang Đơn hàng (dashboard cũng dùng chung): trạng thái, đơn vị vận chuyển, lý do hủy,
// thông tin công ty, ngưỡng cảnh báo khách hay hủy/từ chối nhận hàng.

export const TEN_CONG_TY = "Công ty TNHH Kỹ thuật ABA";
export const DIA_CHI_CONG_TY = "A2 Ngõ 164, Đường Nguyễn Văn Cừ, P. Bồ Đề, Q. Long Biên, Hà Nội";

// Trạng thái đơn hàng + nhãn tiếng Việt: dùng chung với phía khách nên nằm ở js/dung-chung/trang-thai-don.js.
export { CAC_TRANG_THAI, NHAN_TRANG_THAI_DON } from "../../../js/dung-chung/trang-thai-don.js";

// 2 trạng thái thực sự có tiền hàng thu về — dùng cho nút "💰 Doanh thu thực".
export const TRANG_THAI_TINH_DOANH_THU = ['completed', 'partially_delivered'];

// Các đơn vị giao hàng hay dùng — bấm chọn thay vì gõ tay; "Khác..." mới cần gõ tay.
export const CAC_DON_VI_VAN_CHUYEN = ["Nội bộ ABA", "GHTK", "Viettel Post", "Grab", "J&T Express", "Ninja Van", "Khác..."];

// Lưu ý: 3 lý do "do khách" (Khách hàng yêu cầu hủy / không xác nhận / Không thể liên hệ khách hàng) được view
// customer_refusal_stats tính vào cảnh báo khách — nếu đổi chữ ở đây thì phải đổi cả trong view đó.
export const LY_DO_HUY = ["Khách hàng yêu cầu hủy", "Khách hàng không xác nhận", "Thông tin đơn hàng không chính xác", "Không thể liên hệ khách hàng", "Lý do khác"];

// Cảnh báo khách hay hủy/từ chối nhận hàng — khách bị cảnh báo khi VƯỢT một trong hai ngưỡng:
//   • quá NGUONG_TU_CHOI_TUAN  đơn "có vấn đề" trong 7 ngày gần nhất, HOẶC
//   • quá NGUONG_TU_CHOI_THANG đơn "có vấn đề" trong tháng hiện tại.
// "Đơn có vấn đề" = khách tự hủy / bị hủy vì lý do do khách / khách từ chối nhận hàng (view customer_refusal_stats đếm sẵn).
// Hai mốc tự "reset" khi hết tuần/tháng vì view luôn tính theo thời điểm truy vấn.
export const NGUONG_TU_CHOI_TUAN = 3;
export const NGUONG_TU_CHOI_THANG = 6;
