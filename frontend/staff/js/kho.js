/* ==========================================================================
   MỤC LỤC HÀM — staff/js/kho.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang()  — Vẽ trang Kho hàng (tồn kho, lịch sử giao dịch, hộp thoại); phần còn lại nằm trong thư mục kho/
   ========================================================================== */
// Logic trang staff/kho.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
// Giá bán (gia_le_vnd) nhập TAY trực tiếp ở đây, không tự tính từ giá vốn nữa (đã bỏ cho đơn giản).
// Trang này được tách thành các module nhỏ trong thư mục ./kho/ (du-lieu-trang, tien-ich, tai-du-lieu, giao-dich, nhap-nhanh, xuat-excel, hop-thoai);
// file này giữ phần vẽ giao diện chính (hienThiTrang) và khởi tạo.
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat } from "../nhan-vien-chung.js";
import { NGUONG_SAP_HET, canNhapThem } from "../../js/dung-chung/ton-kho.js";
import { phanTuGoc, nguCanh, huyHieu, duLieuTrang, hanhDong } from "./kho/du-lieu-trang.js";
import { tonKhoDaLoc, giaoDichDaLoc, taiDuLieu, nhanNgayGiaoDich } from "./kho/tai-du-lieu.js";
import { ganSuKienLoc, hienThiNhomGiaoDich } from "./kho/giao-dich.js";
import { coQuyenQuanLyKho } from "./kho/tien-ich.js";
import { ganSuKienHopThoai, hienThiHopGiaoDich, hienThiHopThemSanPham } from "./kho/hop-thoai.js";
import { ganSuKienXuat } from "./kho/xuat-excel.js";
import { ganSuKienNhapNhanh, hienThiHopNhapNhanh } from "./kho/nhap-nhanh.js";
import { maHoaHtml } from "../../js/dung-chung/dinh-dang.js";

// ===== RENDER TRANG =====
function hienThiTrang() {
  const stockList = tonKhoDaLoc();
  const totalStock = duLieuTrang.warehouseStock.reduce((sum, item) => sum + Number(item.so_luong || 0), 0);
  const filteredTrans = giaoDichDaLoc();
  const lowStock = stockList.filter(item => canNhapThem(item.so_luong)).length;

  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'kho.html', huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <section class="kho-hero">
    <div>
      <div class="kho-eyebrow">QUẢN LÝ KHO</div>
      <h1 class="page-title">Kho hàng &amp; Tồn kho</h1>
      <p class="kho-subtitle">Theo dõi tồn kho, nhập kho (nhiều mã) và xuất kho không bán hàng. Bán cho khách thì tạo đơn ở trang Đơn hàng.</p>
    </div>
    ${coQuyenQuanLyKho() ? `<div class="kho-hero-actions">
      <button class="btn ghost" id="btnAddProduct">+ Thêm sản phẩm</button>
      <button class="btn ghost" id="btnNhapNhanh">+ Nhập kho nhiều mã</button>
      <button class="btn" id="btnNewTrans">− Xuất kho (không bán)</button>
    </div>` : ''}
  </section>

  <nav class="kho-section-nav" aria-label="Đi tới mục">
    <a href="#kho-overview">Tổng quan</a>
    <a href="#kho-stock">Tồn kho</a>
    <a href="#kho-history">Lịch sử giao dịch</a>
    <span class="kho-nav-divider"></span>
    <a href="bao-gia.html">📋 Yêu cầu khách hàng</a>
    <a href="chiet-khau.html">📉 Chiết khấu số lượng</a>
  </nav>

  <section id="kho-overview" class="kho-card">
    <div class="kho-card-head">
      <div>
        <span class="kho-step">01</span>
        <div><h2>Kho vật lý</h2><p>Danh sách các kho đang được sử dụng trong hệ thống.</p></div>
      </div>
    </div>
    <div class="kho-table-wrap">
      <table class="kho-table">
        <thead><tr><th>Tên kho</th><th>Địa chỉ</th><th>Trạng thái</th></tr></thead>
        <tbody>${duLieuTrang.warehouses.map(w => `<tr>
          <td><strong>${maHoaHtml(w.ten)}</strong></td><td>${maHoaHtml(w.dia_chi) || '—'}</td>
          <td><span class="kho-status ${w.dang_hoat_dong ? 'is-active' : 'is-off'}"><i></i>${w.dang_hoat_dong ? 'Hoạt động' : 'Ngừng hoạt động'}</span></td>
        </tr>`).join("") || `<tr><td colspan="3" class="empty">Chưa có kho nào</td></tr>`}</tbody>
      </table>
    </div>
  </section>

  <section class="kho-stats">
    <div class="kho-stat"><span class="kho-stat-label">Kho đang quản lý</span><strong>${duLieuTrang.warehouses.length}</strong><small>kho vật lý</small></div>
    <div class="kho-stat"><span class="kho-stat-label">Mặt hàng trong kho</span><strong>${duLieuTrang.warehouseStock.length}</strong><small>dòng tồn kho</small></div>
    <div class="kho-stat"><span class="kho-stat-label">Tổng số lượng</span><strong>${totalStock.toLocaleString('vi-VN')}</strong><small>sản phẩm khả dụng</small></div>
    <div class="kho-stat ${lowStock ? 'warning' : ''}"><span class="kho-stat-label">Sắp hết hàng</span><strong>${lowStock}</strong><small>${lowStock ? `dòng còn dưới ${NGUONG_SAP_HET}` : 'không có cảnh báo'}</small></div>
  </section>

  <section id="kho-stock" class="kho-card">
    <div class="kho-card-head kho-card-head-stack">
      <div>
        <span class="kho-step">02</span>
        <div><h2>Tồn kho theo từng kho</h2><p>${stockList.length} dòng đang hiển thị / ${duLieuTrang.warehouseStock.length} dòng tồn kho.</p></div>
      </div>
      <div class="kho-toolbar">
        <input id="qStock" class="kho-search" placeholder="🔍 Tìm mã hàng / hãng / kho..." value="${duLieuTrang.stockSearch}" />
        <button class="btn ghost small" id="btnExportStock">⬇ Xuất Excel tồn kho</button>
      </div>
    </div>
    <div class="kho-table-wrap">
      <table class="kho-table stock-table">
        <thead><tr><th>Sản phẩm</th><th>Kho</th><th>Số lượng</th>${coQuyenQuanLyKho() ? '<th>Giá vốn BQ</th>' : ''}<th>Giá bán</th>${coQuyenQuanLyKho() ? '<th></th>' : ''}</tr></thead>
        <tbody>${stockList.map(s => `<tr>
          <td><strong>${s.san_pham?.ma_san_pham || '—'}</strong> ${s.san_pham?.hang_san_xuat ? `<span class="role-badge">${s.san_pham.hang_san_xuat}</span>` : ''}</td>
          <td>${s.kho?.ten || '—'}</td>
          <td><strong class="stock-number ${Number(s.so_luong || 0) <= 10 ? 'low' : ''}">${Number(s.so_luong || 0).toLocaleString('vi-VN')}</strong></td>
          ${coQuyenQuanLyKho() ? `<td>${duLieuTrang.costs[s.san_pham_id] != null ? Number(duLieuTrang.costs[s.san_pham_id]).toLocaleString('vi-VN')+'₫' : `<span class="stock-warning">⚠ Chưa có giá</span>`}</td>` : ''}
          <td>${coQuyenQuanLyKho() ? `<div class="price-edit"><input type="number" data-price="${s.san_pham_id}" value="${s.san_pham?.gia_le_vnd ?? 0}" /><button class="btn small" data-save-price="${s.san_pham_id}">Lưu</button></div>` : (s.san_pham?.gia_le_vnd != null ? Number(s.san_pham.gia_le_vnd).toLocaleString('vi-VN')+'₫' : '—')}</td>
          ${coQuyenQuanLyKho() ? `<td><button class="btn ghost small" data-edit-sp="${s.san_pham_id}">Sửa</button></td>` : ''}
        </tr>`).join("") || `<tr><td colspan="6" class="empty">${duLieuTrang.stockSearch ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có dữ liệu tồn kho'}</td></tr>`}</tbody>
      </table>
    </div>
    ${!coQuyenQuanLyKho() ? '<div class="kho-note">🔒 Giá vốn là dữ liệu nội bộ, chỉ Kho và Quản trị viên được xem.</div>' : ''}
    ${coQuyenQuanLyKho() && stockList.some(s => duLieuTrang.costs[s.san_pham_id] == null) ? `<div class="kho-note warning">⚠ ${stockList.filter(s=>duLieuTrang.costs[s.san_pham_id]==null).length} sản phẩm chưa có giá vốn bình quân. Hãy ghi một giao dịch Nhập kho có giá nhập để bổ sung.</div>` : ''}
  </section>

  <section id="kho-history" class="kho-card">
    <div class="kho-card-head kho-card-head-stack">
      <div><span class="kho-step">03</span><div><h2>Lịch sử giao dịch kho</h2><p>${filteredTrans.length} giao dịch phù hợp với bộ lọc hiện tại.</p></div></div>
      <button class="btn ghost small" id="btnExportTrans">⬇ Xuất Excel lịch sử</button>
    </div>
    <div class="kho-filter-box">
      <div class="kho-filter-row">
        <input id="qTrans" class="kho-search" placeholder="🔍 Tìm mã hàng / số phiếu / kho / ghi chú..." value="${duLieuTrang.transSearch}" />
        <select id="fTransType"><option value="all" ${duLieuTrang.transTypeFilter==='all'?'selected':''}>Tất cả loại giao dịch</option><option value="import" ${duLieuTrang.transTypeFilter==='import'?'selected':''}>📥 Nhập kho</option><option value="export" ${duLieuTrang.transTypeFilter==='export'?'selected':''}>📤 Xuất kho</option><option value="transfer_in" ${duLieuTrang.transTypeFilter==='transfer_in'?'selected':''}>↩️ Chuyển đến</option><option value="transfer_out" ${duLieuTrang.transTypeFilter==='transfer_out'?'selected':''}>↪️ Chuyển đi</option><option value="customer_return" ${duLieuTrang.transTypeFilter==='customer_return'?'selected':''}>🔄 Khách trả hàng</option><option value="disposal" ${duLieuTrang.transTypeFilter==='disposal'?'selected':''}>🗑️ Tiêu hủy</option></select>
        <select id="fTransWarehouse"><option value="all">Tất cả kho</option>${duLieuTrang.warehouses.map(w => `<option value="${w.id}" ${duLieuTrang.transWarehouseFilter===w.id?'selected':''}>${w.ten}</option>`).join("")}</select>
        <select id="fTransDateMode"><option value="all" ${duLieuTrang.transDateMode==='all'?'selected':''}>Tất cả thời gian</option><option value="day" ${duLieuTrang.transDateMode==='day'?'selected':''}>Theo ngày</option><option value="month" ${duLieuTrang.transDateMode==='month'?'selected':''}>Theo tháng</option><option value="range" ${duLieuTrang.transDateMode==='range'?'selected':''}>Theo khoảng thời gian</option></select>
        ${duLieuTrang.transDateMode === "day" ? `<input type="date" id="fTransDay" value="${duLieuTrang.transDateDay}" title="Ngày"/>` : ''}
        ${duLieuTrang.transDateMode === "month" ? `<input id="fTransMonth" type="month" value="${duLieuTrang.transDateMonth}" title="Tháng"/>` : ''}
        ${duLieuTrang.transDateMode === "range" ? `<input type="date" id="fTransFrom" value="${duLieuTrang.transDateFrom}" title="Từ ngày"/><input type="date" id="fTransTo" value="${duLieuTrang.transDateTo}" title="Đến ngày"/>` : ''}
        <button class="btn ghost small" id="btnResetTransFilter">Xóa bộ lọc</button>
      </div>
    </div>
    ${duLieuTrang.transDateMode !== 'all' ? `<div class="kho-filter-summary">🗓 Đang lọc: <strong>${nhanNgayGiaoDich()}</strong></div>` : ''}
    ${hienThiNhomGiaoDich()}
  </section>
  `;
  document.getElementById("khuVucModal").innerHTML = `
    ${duLieuTrang.showTransModal ? hienThiHopGiaoDich() : ''}
    ${duLieuTrang.showAddProductModal ? hienThiHopThemSanPham() : ''}
    ${duLieuTrang.showNhapNhanh ? hienThiHopNhapNhanh() : ''}
  
  `;
    ganDangXuat(nguCanh.supabase);

  ganSuKienLoc();
  ganSuKienXuat();
  ganSuKienNhapNhanh();
  ganSuKienHopThoai();
}

hanhDong.render = hienThiTrang;

(async () => {
  const login = await batBuocNhanVien(phanTuGoc, { requireRole: ['warehouse', 'admin'], activePage: "kho.html" }); // Kinh doanh không có quyền vào kho
  if (!login) return;
  Object.assign(nguCanh, login);
  Object.assign(huyHieu, await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff));
  taiDuLieu();
})();

