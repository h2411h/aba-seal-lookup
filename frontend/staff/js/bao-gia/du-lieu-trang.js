/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia/du-lieu-trang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   datNguCanh(v)        [export]  — Lưu ngữ cảnh nhân viên đăng nhập
   datHuyHieu(v)        [export]  — Lưu số huy hiệu sidebar
   datBanDoNhanVien(v)  [export]  — Lưu bảng tra id sang tên nhân viên
   datDsNhanVien(v)     [export]  — Lưu danh sách nhân viên
   datTatCaSanPham(v)   [export]  — Lưu danh sách sản phẩm để gợi ý
   * Export duLieuTrang (trạng thái trang).
   ========================================================================== */
// Trạng thái dùng chung của trang Yêu cầu khách hàng (staff/bao-gia.html). Các module trong thư mục này cùng import từ đây.
export const phanTuGoc = document.getElementById("root");
export let nguCanh = null;
export function datNguCanh(v) { nguCanh = v; }
export let huyHieu = {};
export function datHuyHieu(v) { huyHieu = v; }
export let banDoNhanVien = {};
export function datBanDoNhanVien(v) { banDoNhanVien = v; }
export let dsNhanVien = [];
export function datDsNhanVien(v) { dsNhanVien = v; }
export let tatCaSanPham = [];
export function datTatCaSanPham(v) { tatCaSanPham = v; }
export const duLieuTrang = {
  quotes: [], expandedQuote: null, quoteItems: [], paidOrders: [],
  search: "", filterStatus: "all", filterType: "all", filterAssignee: "all",
  showResolveForm: false
};

// Đăng ký hàm vẽ lại/điều phối để các module gọi lẫn nhau mà không import vòng.
export const hanhDong = {};
