/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/du-lieu-trang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   datNguCanh(v)        [export]  — Lưu ngữ cảnh nhân viên đăng nhập (supabase, session, staff)
   datHuyHieu(v)        [export]  — Lưu số huy hiệu sidebar
   datBanDoNhanVien(v)  [export]  — Lưu bảng tra id sang tên nhân viên
   datKenhDonHang(v)    [export]  — Lưu kênh realtime đơn hàng
   * Export duLieuTrang (trạng thái trang) và hanhDong (cầu nối giữa module).
   ========================================================================== */
// Trạng thái dùng chung của trang Đơn hàng (staff/don-hang.html). Các module trong thư mục này cùng import từ đây.
export const phanTuGoc = document.getElementById("root");
export let nguCanh = null;
export function datNguCanh(v) { nguCanh = v; }
export let huyHieu = {};
export function datHuyHieu(v) { huyHieu = v; }
export let banDoNhanVien = {};
export function datBanDoNhanVien(v) { banDoNhanVien = v; }
export const duLieuTrang = {
  orders: [],
  expanded: null,
  // hoặc xuất doanh thu gộp của "Hoàn tất" + "Giao một phần" cùng lúc — 2 trạng thái này đều có
  // tiền hàng thực sự thu về (tong_tien của đơn "Giao một phần" đã tự tính lại đúng phần tiền
  // hàng khách nhận), nhưng muốn cộng chung lại thì phải lọc riêng từng cái
  // rồi tự cộng tay. Nay đổi thành chọn NHIỀU trạng thái cùng lúc.
  // Quy ước: TẬP RỖNG = "không lọc gì" = xem tất cả (không phải liệt kê đủ 7 trạng thái) — để bấm
  // "Tất cả" chỉ cần xoá lựa chọn, và mặc định lúc mới vào trang không hiện 1 dàn 7 chip nào cũng
  // "đang chọn" (nhìn rối, khó biết đang lọc gì) mà hiện gọn 1 chip "Tất cả" duy nhất được bật.
  filterStatuses: new Set(),
  // Chip riêng "Chờ xử lý trả hàng" — KHÔNG phải trạng thái đơn (đơn vẫn là "Hoàn tất") mà là cờ phụ:
  // đơn còn yêu cầu trả hàng / hàng về kho chưa xử lý. Bật lên để nhân viên gom hết việc cần làm.
  choXuLy: false,
  search: "",
  dateFrom: "",
  dateTo: "",
  groupBy: "none",
  confirmModalOrderId: null,
  cancelModalOrderId: null,
  cancelReasonChoice: "",
  cancelReasonNote: "",
  orderHistory: [],
  // hay dùng. Chỉ khi chọn "Khác..." mới cần gõ tay.
  carrierModalOrderId: null,
  carrierModalMode: null, // 'ship' (bắt đầu giao) | 'edit' (sửa đơn vị giao hàng của đơn đang giao)
  carrierChoice: "",
  carrierCustom: "",
  carrierTrackingNote: "",
  warehouses: [],
  batchDeliveryOrderId: null,
  returnModalOrderId: null
};
// ---- Realtime: tự cập nhật danh sách khi có đơn mới hoặc khách/nhân viên khác vừa đổi trạng
// thái — hữu ích khi nhiều nhân viên kinh doanh cùng mở trang này 1 lúc, khỏi giẫm chân nhau vì
// nhìn dữ liệu cũ. ----
export let kenhDonHang = null;
export function datKenhDonHang(v) { kenhDonHang = v; }

// Đăng ký hàm vẽ lại/điều phối để các module gọi lẫn nhau mà không import vòng.
export const hanhDong = {};
