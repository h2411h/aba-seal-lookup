/* ==========================================================================
   MỤC LỤC HÀM — staff/js/kho/tien-ich.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   nhanLoaiGiaoDich(t)       [export]  — Nhãn tiếng Việt của loại giao dịch kho
   coQuyenQuanLyKho()        [export]  — Người dùng có phải warehouse/admin không
   taoSoPhieuNhap(supabase)  [export async]  — ★ Sinh số phiếu PN-YYYYMMDD-NNN (lấy số lớn nhất của hôm nay rồi cộng 1)
   soHoacNull(v)             [export]  — Đổi giá trị ô nhập sang số, rỗng/không hợp lệ thì null
   ========================================================================== */
// Hàm tiện ích cho trang Kho hàng.
import { nguCanh } from "./du-lieu-trang.js";

export function nhanLoaiGiaoDich(t) {
  // customer_return: hệ thống tự ghi khi nhân viên bán hàng xác nhận khách từ chối nhận/không nhận
  // đủ hàng ở trang Đơn hàng (hàm luuKetQuaGiaoHang trong staff/js/don-hang/giao-hang.js) — không tạo tay ở đây.
  return { import: '📥 Nhập kho', export: '📤 Xuất kho', transfer_in: '↩️ Chuyển đến', transfer_out: '↪️ Chuyển đi', customer_return: '🔄 Khách trả hàng', disposal: '🗑️ Tiêu hủy hết hạn' }[t] || t;
}

export function coQuyenQuanLyKho() { return nguCanh.staff && ['warehouse', 'admin'].includes(nguCanh.staff.vai_tro); }

// Số phiếu nhập tự sinh: PN-<ngày>-<số thứ tự trong ngày>, ví dụ PN-20261031-001.
// Cách làm: tìm số phiếu lớn nhất của hôm nay trong bảng giao_dich_kho rồi cộng 1.
export async function taoSoPhieuNhap(supabase) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const tienTo = `PN-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-`;
  const { data } = await supabase.from("giao_dich_kho").select("so_phieu")
    .like("so_phieu", tienTo + "%").order("so_phieu", { ascending: false }).limit(1);
  const soCuoi = data?.length ? Number(data[0].so_phieu.slice(tienTo.length)) : 0;
  return tienTo + String(soCuoi + 1).padStart(3, "0");
}

// Ô "số hóa đơn nhà cung cấp" không bắt buộc; để trống thì ghi chữ này để cột ghi chú không bị rỗng.
export const CHUA_CO_HOA_DON = "Chưa có hóa đơn NCC";

export function soHoacNull(v) { const n = Number(v); return v === "" || v == null || isNaN(n) ? null : n; }
