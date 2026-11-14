/* ==========================================================================
   MỤC LỤC HÀM — staff/js/kho/tai-du-lieu.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang()          — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   thongTinNhom(t)         — Tính khóa và nhãn nhóm (ngày/tuần/tháng) của 1 giao dịch
   dungNhomGiaoDich(list)  [export]  — Gom danh sách giao dịch thành các nhóm bằng Map
   tonKhoDaLoc()           [export]  — Lọc bảng tồn kho theo từ khóa (tìm tức thời)
   khoangNgayGiaoDich()    — Tính khoảng ngày đang lọc của lịch sử giao dịch
   giaoDichDaLoc()         [export]  — Lọc giao dịch theo từ khóa, loại, kho, khoảng ngày
   nhanNgayGiaoDich()      [export]  — Nhãn mô tả bộ lọc thời gian đang áp dụng
   taiDuLieu()             [export async]  — Tải tồn kho, giao dịch và dữ liệu liên quan của trang Kho
   ========================================================================== */
// Tải dữ liệu Kho hàng từ Supabase và các hàm lọc/nhóm (tồn kho, lịch sử giao dịch, ).
import { nguCanh, duLieuTrang } from "./du-lieu-trang.js";
import { coQuyenQuanLyKho } from "./tien-ich.js";
import { hanhDong } from "./du-lieu-trang.js";
import { thongTinNhomThoiGian } from "../../../js/dung-chung/nhom-thoi-gian.js";
const hienThiTrang = () => hanhDong.render(); // hienThiTrang nằm ở kho.js; gọi qua actions để tránh import vòng

// Nhóm lịch sử giao dịch theo Ngày / Tuần / Tháng — giống cách phân nhóm đơn hàng, tránh đổ 1 danh
// sách phẳng dài dằng dặc khó theo dõi.
function thongTinNhom(t) {
  return thongTinNhomThoiGian(t.ngay_tao, duLieuTrang.transGroupBy);
}

export function dungNhomGiaoDich(list) {
  const map = new Map();
  for (const t of list) {
    const { key, label } = thongTinNhom(t);
    if (!map.has(key)) map.set(key, { key, label, items: [] });
    map.get(key).items.push(t);
  }
  return Array.from(map.values());
}

// Tìm kiếm thời gian thực trong bảng tồn kho — hữu ích khi công ty quản lý hàng nghìn mã
// phớt/gioăng, không phải cuộn danh sách dài dằng dặc để tìm 1 mã.
export function tonKhoDaLoc() {
  if (!duLieuTrang.stockSearch.trim()) return duLieuTrang.warehouseStock;
  const q = duLieuTrang.stockSearch.trim().toLowerCase();
  return duLieuTrang.warehouseStock.filter(s =>
    (s.san_pham?.ma_san_pham || '').toLowerCase().includes(q) ||
    (s.san_pham?.hang_san_xuat || '').toLowerCase().includes(q) ||
    (s.kho?.ten || '').toLowerCase().includes(q)
  );
}

// Lọc + tìm kiếm cho bảng "Lịch sử giao dịch kho" — theo từ khoá, loại giao dịch, kho, và khoảng
// thời gian. Đây là bộ lọc DUY NHẤT dùng chung cho cả bảng hiển thị và nút "Xuất Excel lịch sử" —
// những gì đang lọc trên màn hình = những gì được xuất ra Excel, tránh nhầm lẫn.
function khoangNgayGiaoDich() {
  if (duLieuTrang.transDateMode === "day") {
    return { from: duLieuTrang.transDateDay, to: duLieuTrang.transDateDay };
  }
  if (duLieuTrang.transDateMode === "month") {
    const [y, m] = duLieuTrang.transDateMonth.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { from: `${duLieuTrang.transDateMonth}-01`, to: `${duLieuTrang.transDateMonth}-${String(lastDay).padStart(2, "0")}` };
  }
  if (duLieuTrang.transDateMode === "range") {
    return { from: duLieuTrang.transDateFrom, to: duLieuTrang.transDateTo };
  }
  return null; // "all" — không lọc theo thời gian
}

export function giaoDichDaLoc() {
  let list = duLieuTrang.transactions;
  if (duLieuTrang.transTypeFilter !== "all") list = list.filter(t => t.loai_giao_dich === duLieuTrang.transTypeFilter);
  if (duLieuTrang.transWarehouseFilter !== "all") list = list.filter(t => t.kho_id === duLieuTrang.transWarehouseFilter);
  const range = khoangNgayGiaoDich();
  if (range && range.from && range.to) {
    // So sánh theo ngày giờ ĐỊA PHƯƐNG (giống cách thongTinNhom() nhóm theo ngày ở trên), không dùng
    // toISOString (giờ UTC) — tránh lệch 1 ngày quanh nửa đêm giờ Việt Nam (UTC+7).
    list = list.filter(t => {
      const d = new Date(t.ngay_tao);
      const pad = n => String(n).padStart(2, "0");
      const localDay = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return localDay >= range.from && localDay <= range.to;
    });
  }
  const q = duLieuTrang.transSearch.trim().toLowerCase();
  if (q) list = list.filter(t =>
    (t.san_pham?.ma_san_pham || '').toLowerCase().includes(q) ||
    (t.kho?.ten || '').toLowerCase().includes(q) ||
    (t.so_phieu || '').toLowerCase().includes(q) ||
    (t.ghi_chu_tham_chieu || '').toLowerCase().includes(q)
  );
  return list;
}

// Nhãn mô tả bộ lọc thời gian đang áp dụng, dùng cả trong tiêu đề bảng và khối thông tin trong
// file Excel xuất ra — 1 chỗ viết duy nhất, tránh 2 nơi hiển thị lệch chữ nhau.
export function nhanNgayGiaoDich() {
  if (duLieuTrang.transDateMode === "day") return `Ngày ${duLieuTrang.transDateDay.split("-").reverse().join("/")}`;
  if (duLieuTrang.transDateMode === "month") { const [y, m] = duLieuTrang.transDateMonth.split("-"); return `Tháng ${m}/${y}`; }
  if (duLieuTrang.transDateMode === "range") return `Từ ${duLieuTrang.transDateFrom.split("-").reverse().join("/")} đến ${duLieuTrang.transDateTo.split("-").reverse().join("/")}`;
  return "Tất cả thời gian";
}

// ===== DỮ LIỆU KHO =====
export async function taiDuLieu() {
  const { supabase } = nguCanh;
  const { data: w } = await supabase.from("kho").select("*").order("ngay_tao");
  const { data: stock } = await supabase.from("ton_kho").select("*, san_pham(id, ma_san_pham, hang_san_xuat, duong_kinh_trong, duong_kinh_ngoai, do_day, vat_lieu, gia_le_vnd), kho(ten)");
  // Giá vốn nằm ở bảng product_costs riêng (RLS chỉ cho kho/admin đọc) — sales xem trang này
  // vẫn được nhưng sẽ không thấy cột giá vốn, đúng yêu cầu bảo mật giá vốn nội bộ.
  duLieuTrang.costs = {};
  if (coQuyenQuanLyKho()) {
    const { data: costs } = await supabase.from("gia_von_san_pham").select("san_pham_id, gia_von_binh_quan_vnd");
    (costs || []).forEach(c => { duLieuTrang.costs[c.san_pham_id] = c.gia_von_binh_quan_vnd; });
  }
  const { data: trans } = await supabase.from("giao_dich_kho").select("*, san_pham(ma_san_pham), kho(ten)").order("ngay_tao", { ascending: false });
  duLieuTrang.warehouses = w || []; duLieuTrang.warehouseStock = stock || []; duLieuTrang.transactions = trans || [];
  hienThiTrang();
}
