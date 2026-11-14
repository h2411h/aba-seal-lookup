/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia/nhan.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   layNhanTrangThai(s)                                    [export]  — Nhãn tiếng Việt của trạng thái yêu cầu
   lopNhanTrangThai(s)                                    [export]  — Class màu badge theo trạng thái
   maDonNgan(o)                                           [export]  — Mã đơn hiển thị (8 ký tự đầu của id, HOA), giống maDon trang Đơn hàng
   nhanDonHang(o)                                         — Chuỗi mô tả 1 đơn: mã · tên khách · ngày
   nhanSanPham(p)                                         — Chuỗi mô tả 1 sản phẩm cho ô chọn
   luaChonSanPham(selected="", includeBlank=true)         [export]  — HTML các <option> sản phẩm
   luaChonDonDaThanhToan(selected="", includeBlank=true)  [export]  — HTML các <option> đơn đã thanh toán
   tomTatLienQuan(q)                                      [export]  — Tóm tắt đơn/sản phẩm liên quan của yêu cầu
   ========================================================================== */
// Nhãn và hàm tiện ích: loại yêu cầu, trạng thái, tên sản phẩm/đơn, mô tả hoạt động.
import { maDon as maDonChung } from "../../../js/dung-chung/ma-don.js";
import { dinhDangTien, dinhDangNgayVN } from "../../../js/dung-chung/dinh-dang.js";
import { tatCaSanPham, duLieuTrang } from "./du-lieu-trang.js";

// ---- Loại yêu cầu ---- (dùng chung với phía khách: js/dung-chung/loai-yeu-cau.js)
export { LOAI_YEU_CAU, nhanLoaiYeuCau } from "../../../js/dung-chung/loai-yeu-cau.js";

// ---- Trạng thái xử lý (thay cho chỉ "Mới" duy nhất trước đây) ----
export const CAC_TRANG_THAI = ['new','processing','resolved','cancelled'];

export function layNhanTrangThai(s) {
  return { new:'Mới', processing:'Đang xử lý', resolved:'Hoàn tất', cancelled:'Đã hủy' }[s] || s;
}

// Tái dùng các class màu badge đã có sẵn trong css/nhan-vien.css (định nghĩa cho trang đơn hàng) — tránh phải
// thêm CSS mới cho mỗi trạng thái.
export function lopNhanTrangThai(s) {
  return { new:'pending', processing:'processing', resolved:'completed', cancelled:'cancelled' }[s] || 'pending';
}

export const TRANG_THAI_DANG_MO = ['new','processing'];

// Mã đơn hiển thị: 8 ký tự đầu của id, IN HOA — GIỐNG HỆT trang Đơn hàng (hàm maDon) để nhân viên
// đối chiếu/tìm kiếm được. Không thêm "…" vì 8 ký tự này chính là mã đầy đủ của đơn, không bị cắt.
export function maDonNgan(o) { return maDonChung(o); }

function nhanDonHang(o) {
  const name = o.khach_hang?.ho_ten || "Khách";
  return `${maDonNgan(o)} · ${name} · ${dinhDangNgayVN(o.ngay_tao)} · ${dinhDangTien(o.tong_tien)}`;
}

function nhanSanPham(p) { return `${p.ma_san_pham}${p.hang_san_xuat ? ` · ${p.hang_san_xuat}` : ""}`; }

export function luaChonSanPham(selected="", includeBlank=true) {
  return `${includeBlank ? '<option value="">— Chưa chọn sản phẩm —</option>' : ''}${tatCaSanPham.map(p => `<option value="${p.id || ''}" ${String(selected)===String(p.id)?'selected':''}>${nhanSanPham(p)}</option>`).join("")}`;
}

export function luaChonDonDaThanhToan(selected="", includeBlank=true) {
  return `${includeBlank ? '<option value="">— Chưa chọn đơn —</option>' : ''}${duLieuTrang.paidOrders.map(o => `<option value="${o.id}" ${String(selected)===String(o.id)?'selected':''}>${nhanDonHang(o)}</option>`).join("")}`;
}

export function tomTatLienQuan(q) {
  const td = q.du_lieu_loai || {};
  if (td.order_id) {
    const o = duLieuTrang.paidOrders.find(x => String(x.id) === String(td.order_id));
    const count = Array.isArray(td.products) ? td.products.length : (td.product_id ? 1 : 0);
    if (o) return `Đơn ${maDonNgan(o)}${count ? ` · ${count} SP` : ''}`;
  }
  if (Array.isArray(td.products) && td.products.length) return `${td.products.length} sản phẩm`;
  if (td.product_id) { const pr = tatCaSanPham.find(x => String(x.id) === String(td.product_id)); if (pr) return `SP ${pr.ma_san_pham}`; }
  return '—';
}
