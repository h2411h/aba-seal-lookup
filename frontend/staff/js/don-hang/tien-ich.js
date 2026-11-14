/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/tien-ich.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   layNhanTrangThai(s)        [export]  — Nhãn tiếng Việt của trạng thái đơn
   nhanGiaoHangDong(s)        [export]  — Nhãn tiếng Việt của trạng thái giao từng dòng
   khoaNgay(d)                [export]  — Đổi Date sang chuỗi yyyy-mm-dd
   isoSangNgayGio(iso)        [export]  — Đổi mốc giờ ISO sang ngày giờ hiển thị
   moTaLichSuDon(log, index)  [export]  — Câu mô tả 1 dòng lịch sử (ai đổi từ trạng thái nào sang nào)
   lopNhanTrangThai(s)        [export]  — Class màu badge theo trạng thái đơn
   maDon(o)                   [export]  — Mã đơn hiển thị: 8 ký tự đầu của id viết HOA
   sdtHienThi(o)              [export]  — SĐT hiển thị: ưu tiên số người nhận của đơn, không có thì lấy từ hồ sơ khách
   ========================================================================== */
// Hàm tiện ích thuần: nhãn trạng thái, định dạng ngày, lớp CSS của huy hiệu, mô tả lịch sử đơn.
import { maDon as maDonChung } from "../../../js/dung-chung/ma-don.js";
import { banDoNhanVien, duLieuTrang } from "./du-lieu-trang.js";
import { NHAN_TRANG_THAI_DON } from "./hang-so.js";

export function layNhanTrangThai(s) { return NHAN_TRANG_THAI_DON[s] || s; }

export function nhanGiaoHangDong(s) {
  return { pending:'Chưa giao', delivered:'Đã giao', refused:'Khách từ chối', partially_delivered:'Nhận 1 phần' }[s] || s;
}

export function khoaNgay(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

// ---- Ngày: các ô lọc dùng <input type="date"> mặc định của trình duyệt (value luôn là "yyyy-mm-dd",
// dùng thẳng để so sánh/lọc). isoSangNgayGio() chỉ để hiển thị "dd/mm/yyyy" trong báo cáo Excel. ----
export function isoSangNgayGio(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function moTaLichSuDon(log, index) {
  const who = banDoNhanVien[log.nguoi_thay_doi] || (log.nguoi_thay_doi === "system" ? "Hệ thống" : "Nhân viên");
  const current = layNhanTrangThai(log.trang_thai);
  const previous = index > 0 ? layNhanTrangThai(duLieuTrang.orderHistory[index - 1].trang_thai) : null;
  const transition = previous && previous !== current ? `${previous} → ${current}` : current;
  return `${who} cập nhật: ${transition}`;
}

export function lopNhanTrangThai(s) {
  return { pending:'pending', confirmed:'confirmed', shipped:'shipped', partially_delivered:'partially_delivered', delivery_failed:'cancelled', completed:'completed', cancelled:'cancelled' }[s] || 'pending';
}

// Mã đơn hiển thị cho người dùng = 8 ký tự đầu của id, viết HOA (giống trên hóa đơn in).
// Ví dụ id "78605c21-da5b-..." -> mã đơn "78605C21"
export function maDon(o) {
  return maDonChung(o);
}

// SĐT hiển thị trên bảng: ưu tiên số người nhận của đơn, không có thì lấy số trong hồ sơ khách.
// Dùng CHUNG cho cả hiển thị lẫn tìm kiếm -> thấy số nào trên bảng thì tìm được đúng số đó.
export function sdtHienThi(o) {
  return o.sdt_nguoi_nhan || o.khach_hang?.so_dien_thoai || "";
}
