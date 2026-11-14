/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/in-xuat.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   inHoaDon(o)                             [export]  — ★ In hóa đơn: dựng HTML, mở cửa sổ mới, document.write rồi print (bỏ dòng bị từ chối)
   xuatDonHangRaExcel(orders, groupLabel)  [export]  — Xuất danh sách đơn (toàn bộ theo bộ lọc hoặc 1 nhóm) ra Excel
   ========================================================================== */
// In hóa đơn và xuất danh sách đơn hàng ra Excel.
import { maDon as maDonChung } from "../../../js/dung-chung/ma-don.js";
import { xuatRaExcel } from "../../nhan-vien-chung.js";
import { duLieuTrang } from "./du-lieu-trang.js";
import { DIA_CHI_CONG_TY, TEN_CONG_TY, CAC_TRANG_THAI } from "./hang-so.js";
import { isoSangNgayGio, layNhanTrangThai } from "./tien-ich.js";
import { dinhDangTien, maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";

export function inHoaDon(o) {
  const items = (o.chi_tiet_don_hang || []).filter(it => it.trang_thai_giao_hang !== 'refused');
  const shortId = maDonChung(o);
  const invoiceDate = new Date(o.ngay_tao).toLocaleDateString("vi-VN");
  const rowsHtml = items.map((it, idx) => {
    const qty = it.trang_thai_giao_hang === 'partially_delivered' ? it.so_luong_da_giao : it.so_luong;
    const lineTotal = Number(it.don_gia || 0) * qty;
    return `<tr>
      <td style="text-align:center">${idx + 1}</td>
      <td>${it.san_pham?.ma_san_pham || '—'}${it.san_pham?.hang_san_xuat ? ' · ' + it.san_pham.hang_san_xuat : ''}${it.trang_thai_giao_hang === 'partially_delivered' ? ` <span style="font-size:11px;color:#888">(giao ${qty}/${it.so_luong})</span>` : ''}${Number(it.phan_tram_chiet_khau) > 0 ? ` <span style="font-size:11px;color:#2a8f4f">(chiết khấu ${it.phan_tram_chiet_khau}%, −${dinhDangTien(Number(it.tien_chiet_khau_dong||0))})</span>` : ''}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">${Number(it.don_gia || 0).toLocaleString("vi-VN")}</td>
      <td style="text-align:right">${lineTotal.toLocaleString("vi-VN")}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Hoá đơn ${shortId}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 780px; margin: 30px auto; padding: 0 20px; font-size: 13.5px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 14px; margin-bottom: 18px; }
    .company p { margin: 2px 0; color: #444; font-size: 12.5px; }
    .invoice-meta { text-align: right; font-size: 12.5px; color: #444; }
    .invoice-meta b { color: #1a1a1a; }
    .info-block { display: flex; justify-content: space-between; margin-bottom: 18px; gap: 20px; }
    .info-block .box { flex: 1; }
    .info-block h3 { font-size: 12px; text-transform: uppercase; color: #888; margin: 0 0 6px; letter-spacing: .03em; }
    .info-block p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { padding: 8px 10px; border: 1px solid #ddd; font-size: 12.5px; }
    th { background: #f4f4f4; text-align: left; }
    .summary { margin-left: auto; width: 280px; }
    .summary .row { display: flex; justify-content: space-between; padding: 4px 0; }
    .summary .total { font-weight: 700; font-size: 16px; border-top: 2px solid #1a1a1a; margin-top: 6px; padding-top: 8px; }
    .sign-area { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
    .sign-area .box { width: 200px; }
    .sign-area .line { margin-top: 60px; border-top: 1px solid #999; padding-top: 6px; font-size: 12px; color: #666; }
    .note { font-size: 11.5px; color: #999; margin-top: 30px; text-align: center; }
    @media print { body { margin: 0; padding: 12mm; } }
  </style></head>
  <body>
    <div class="header">
      <div class="company">
        <h1>${TEN_CONG_TY}</h1>
        <p>${DIA_CHI_CONG_TY}</p>
      </div>
      <div class="invoice-meta">
        <p style="font-size:16px;font-weight:700;color:#1a1a1a">HOÁ ĐƠN BÁN HÀNG</p>
        <p>Số: <b>${shortId}</b></p>
        <p>Ngày lập: <b>${invoiceDate}</b></p>
      </div>
    </div>
    <div class="info-block">
      <div class="box">
        <h3>Khách hàng</h3>
        <p><b>${maHoaHtml(o.ten_nguoi_nhan) || maHoaHtml(o.khach_hang?.ho_ten) || '—'}</b>${maHoaHtml(o.khach_hang?.ten_cong_ty) ? ' — ' + maHoaHtml(o.khach_hang.ten_cong_ty) : ''}</p>
        <p>ĐT: ${maHoaHtml(o.sdt_nguoi_nhan) || maHoaHtml(o.khach_hang?.so_dien_thoai) || '—'}</p>
        <p>Địa chỉ giao: ${maHoaHtml(o.dia_chi_giao_hang) || '—'}</p>
      </div>
    </div>
    <table>
      <thead><tr><th style="width:36px;text-align:center">#</th><th>Sản phẩm</th><th style="width:60px;text-align:center">SL</th><th style="width:110px;text-align:right">Đơn giá (đ)</th><th style="width:120px;text-align:right">Thành tiền (đ)</th></tr></thead>
      <tbody>${rowsHtml || `<tr><td colspan="5" style="text-align:center;color:#999">Không có sản phẩm nào được tính vào hoá đơn</td></tr>`}</tbody>
    </table>
    <div class="summary">
      <div class="row"><span>Tạm tính</span><span>${dinhDangTien(Number(o.tien_hang || 0))}</span></div>
      ${o.tien_giam_gia > 0 ? `<div class="row"><span>Giảm giá khuyến mãi</span><span>−${dinhDangTien(Number(o.tien_giam_gia))}</span></div>` : ''}
      ${o.tien_chiet_khau_so_luong > 0 ? `<div class="row"><span>Chiết khấu mua số lượng</span><span>−${dinhDangTien(Number(o.tien_chiet_khau_so_luong))}</span></div>` : ''}
      <div class="row"><span>Thuế VAT (${o.thue_suat || 10}%)</span><span>${dinhDangTien(Number(o.tien_thue || 0))}</span></div>
      <div class="row total"><span>Tổng cộng</span><span>${dinhDangTien(Number(o.tong_tien || 0))}</span></div>
    </div>
    <div class="sign-area">
      <div class="box"><div class="line">Người mua hàng<br>(Ký, ghi rõ họ tên)</div></div>
      <div class="box"><div class="line">Người bán hàng<br>(Ký, ghi rõ họ tên)</div></div>
    </div>
    <p class="note">Hoá đơn được lập tự động từ hệ thống ABA Technical · Mã đơn đầy đủ: ${o.id}</p>
  </body></html>`;

  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) { alert("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup cho trang này rồi thử lại."); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// Hàm xuất Excel dùng chung — nhận vào danh sách đơn hàng cụ thể (toàn bộ theo bộ lọc, hoặc chỉ
// đúng 1 nhóm ngày/tháng/tuần) để nút "⬇ Excel" ở từng nhóm và nút "⬇ Xuất Excel" ở đầu trang đều
// dùng chung 1 logic, tránh lặp code và đảm bảo cột dữ liệu luôn nhất quán.
export function xuatDonHangRaExcel(orders, groupLabel) {
  const rows = orders.map(o => {
    const d = new Date(o.ngay_tao);
    return {
      "Mã đơn": o.id,
      "Ngày đặt": d.toLocaleDateString("vi-VN"),
      "Giờ đặt": d.toLocaleTimeString("vi-VN"),
      "Mã KH": o.khach_hang?.ma_khach_hang || "",
      "Khách hàng": o.khach_hang?.ho_ten || "",
      "SĐT tài khoản": o.khach_hang?.so_dien_thoai || "",
      "Người nhận": o.ten_nguoi_nhan || "",
      "SĐT nhận hàng": o.sdt_nguoi_nhan || "",
      "Địa chỉ giao hàng": o.dia_chi_giao_hang || "",
      "Công ty": o.khach_hang?.ten_cong_ty || "",
      "Phí vận chuyển": Number(o.phi_van_chuyen||0),
      "Đơn vị giao hàng": o.don_vi_van_chuyen || "",
      "Tổng tiền": Number(o.tong_tien),
      "Trạng thái": layNhanTrangThai(o.trang_thai),
      "Số dòng sản phẩm": (o.chi_tiet_don_hang||[]).length,
      "Ghi chú": o.ghi_chu || ""
    };
  });
  const meta = [
    ["Danh sách đơn hàng", groupLabel || ""],
    ["Trạng thái đang lọc", duLieuTrang.filterStatuses.size === 0 ? "Tất cả" : CAC_TRANG_THAI.filter(s => duLieuTrang.filterStatuses.has(s)).map(layNhanTrangThai).join(", ")],
    ["Khoảng ngày đặt", groupLabel ? groupLabel : ((duLieuTrang.dateFrom || duLieuTrang.dateTo) ? `${isoSangNgayGio(duLieuTrang.dateFrom) || "..."} → ${isoSangNgayGio(duLieuTrang.dateTo) || "..."}` : "Tất cả")],
    ["Tổng tiền", dinhDangTien(orders.reduce((s,o)=>s+Number(o.tong_tien||0),0))],
  ];
  const filename = groupLabel ? `don-hang-aba_${groupLabel.replace(/[\/\\?%*:|"<>]/g,'-').replace(/\s+/g,'-')}` : "don-hang-aba";
  xuatRaExcel(filename, "DonHang", rows, meta);
}
