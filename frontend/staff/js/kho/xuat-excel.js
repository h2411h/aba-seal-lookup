/* ==========================================================================
   MỤC LỤC HÀM — staff/js/kho/xuat-excel.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   homNay()         — Chuỗi ngày hôm nay dùng đặt tên file
   xuatTonKho()     — Xuất bảng tồn kho (đang lọc) ra Excel
   xuatLichSu()     — Xuất lịch sử giao dịch (đang lọc) ra Excel
   ganSuKienXuat()  [export]  — Gắn sự kiện cho các nút xuất Excel
   ========================================================================== */
// Xuất Excel của trang Kho: xuất đúng những gì đang hiển thị (đang lọc thế nào thì file ra thế đó).
import { xuatRaExcel } from "../../nhan-vien-chung.js";
import { duLieuTrang } from "./du-lieu-trang.js";
import { tonKhoDaLoc, giaoDichDaLoc } from "./tai-du-lieu.js";
import { coQuyenQuanLyKho, nhanLoaiGiaoDich } from "./tien-ich.js";

const homNay = () => new Date().toISOString().slice(0, 10);

function xuatTonKho() {
  const rows = tonKhoDaLoc().map(s => {
    const dong = {
      "Mã sản phẩm": s.san_pham?.ma_san_pham || "",
      "Hãng": s.san_pham?.hang_san_xuat || "",
      "Kho": s.kho?.ten || "",
      "Số lượng": s.so_luong
    };
    if (coQuyenQuanLyKho()) dong["Giá vốn BQ (VNĐ)"] = duLieuTrang.costs[s.san_pham_id] ?? ""; // giá vốn: chỉ kho/admin
    dong["Giá bán (VNĐ)"] = s.san_pham?.gia_le_vnd ?? "";
    return dong;
  });
  xuatRaExcel("ton-kho-" + homNay(), "TonKho", rows);
}

function xuatLichSu() {
  const rows = giaoDichDaLoc().map(t => {
    const d = new Date(t.ngay_tao);
    return {
      "Ngày": d.toLocaleDateString("vi-VN"),
      "Giờ": d.toLocaleTimeString("vi-VN"),
      "Số phiếu": t.so_phieu || "",
      "Loại": nhanLoaiGiaoDich(t.loai_giao_dich),
      "Mã sản phẩm": t.san_pham?.ma_san_pham || "",
      "Kho": t.kho?.ten || "",
      "Số lượng": t.so_luong,
      "Đơn giá vốn (VNĐ)": t.don_gia_von ?? "",
      "Số hóa đơn NCC / ghi chú": t.ghi_chu_tham_chieu || ""
    };
  });
  xuatRaExcel("lich-su-kho-" + homNay(), "LichSuKho", rows);
}

// ===== GẮN SỰ KIỆN =====
export function ganSuKienXuat() {
  document.getElementById("btnExportStock").onclick = xuatTonKho;
  document.getElementById("btnExportTrans").onclick = xuatLichSu;
}
