/* ==========================================================================
   MỤC LỤC HÀM — staff/js/kho/giao-dich.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang()                   — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   hienThiPhanTrangGiaoDich(total)  — Vẽ thanh phân trang lịch sử giao dịch
   hienThiNhomGiaoDich()            [export]  — Vẽ lịch sử giao dịch chia nhóm ngày/tuần/tháng
   ganSuKienLoc()                   [export]  — Gắn sự kiện bộ lọc, tìm kiếm, phân trang lịch sử giao dịch
   ========================================================================== */
// Bảng "Lịch sử giao dịch kho": nhóm theo ngày/tuần/tháng, phân trang, và sự kiện bộ lọc.
import { duLieuTrang } from "./du-lieu-trang.js";
import { dungNhomGiaoDich, giaoDichDaLoc } from "./tai-du-lieu.js";
import { nhanLoaiGiaoDich } from "./tien-ich.js";
import { hanhDong } from "./du-lieu-trang.js";
import { maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";
const hienThiTrang = () => hanhDong.render(); // hienThiTrang nằm ở kho.js; gọi qua actions để tránh import vòng

function hienThiPhanTrangGiaoDich(total) {
  const totalPages = Math.max(1, Math.ceil(total / duLieuTrang.transPageSize));
  if (duLieuTrang.transPage > totalPages) duLieuTrang.transPage = totalPages;
  if (totalPages <= 1) return `<div class="trans-pagination-info">${total} giao dịch</div>`;

  const page = duLieuTrang.transPage;
  const from = (page - 1) * duLieuTrang.transPageSize + 1;
  const to = Math.min(page * duLieuTrang.transPageSize, total);
  const buttons = [];
  const addPage = (n, label = n) => buttons.push(`<button class="btn ghost small trans-page-btn ${n === page ? 'active' : ''}" data-trans-page="${n}">${label}</button>`);

  if (page > 1) addPage(page - 1, '←');
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter(n => n >= 1 && n <= totalPages).sort((a,b) => a-b);
  let last = 0;
  for (const n of sorted) {
    if (last && n - last > 1) buttons.push(`<span class="trans-page-dots">…</span>`);
    addPage(n);
    last = n;
  }
  if (page < totalPages) addPage(page + 1, '→');

  return `<div class="trans-pagination">
    <div class="trans-pagination-info">Hiển thị <b>${from}–${to}</b> / ${total} giao dịch</div>
    <div class="trans-pagination-buttons">${buttons.join('')}</div>
  </div>`;
}

export function hienThiNhomGiaoDich() {
  const list = giaoDichDaLoc();
  if (list.length === 0) {
    return `<table><tbody><tr><td class="empty">${duLieuTrang.transSearch || duLieuTrang.transTypeFilter!=='all' || duLieuTrang.transWarehouseFilter!=='all' || duLieuTrang.transDateMode!=='all' ? 'Không tìm thấy giao dịch phù hợp' : 'Chưa có giao dịch nào'}</td></tr></tbody></table>`;
  }

  const totalPages = Math.max(1, Math.ceil(list.length / duLieuTrang.transPageSize));
  if (duLieuTrang.transPage > totalPages) duLieuTrang.transPage = totalPages;
  const start = (duLieuTrang.transPage - 1) * duLieuTrang.transPageSize;
  const pageList = list.slice(start, start + duLieuTrang.transPageSize);
  const groups = dungNhomGiaoDich(pageList);
  duLieuTrang.transGroupsCache = new Map(groups.map(g => [g.key, g]));

  return `${groups.map(g => `
    <div class="order-group">
      ${g.label ? `<div class="group-header"><span>${g.label}</span><span class="group-meta">${g.items.length} giao dịch</span></div>` : ''}
      <table><thead><tr><th>Thời gian</th><th>Số phiếu</th><th>Loại</th><th>Sản phẩm</th><th>Kho</th><th>Số lượng</th><th>Đơn giá vốn</th><th>Thành tiền</th><th>Ghi chú</th></tr></thead>
      <tbody>${g.items.map(t => `<tr>
        <td>${new Date(t.ngay_tao).toLocaleString("vi-VN")}</td>
        <td>${t.so_phieu || '—'}</td>
        <td>${nhanLoaiGiaoDich(t.loai_giao_dich)}</td>
        <td>${t.san_pham?.ma_san_pham || '—'}</td>
        <td>${t.kho?.ten || '—'}</td>
        <td>${t.so_luong}</td>
        <td>${t.don_gia_von != null ? Number(t.don_gia_von).toLocaleString("vi-VN")+'₫/sp' : '—'}</td>
        <td>${t.don_gia_von != null ? Number(t.don_gia_von * t.so_luong).toLocaleString("vi-VN")+'₫' : '—'}</td>
        <td>${maHoaHtml(t.ghi_chu_tham_chieu) || '—'}</td>
      </tr>`).join("")}</tbody></table>
    </div>`).join("")}
    ${hienThiPhanTrangGiaoDich(list.length)}`;
}

// Gắn sự kiện cho bộ lọc, tìm kiếm và phân trang lịch sử giao dịch (tách ra từ hienThiTrang).
export function ganSuKienLoc() {
  document.getElementById("qStock").oninput = (e) => {
    duLieuTrang.stockSearch = e.target.value;
    const cursorPos = e.target.selectionStart;
    hienThiTrang();
    const el = document.getElementById("qStock");
    el.focus();
    el.setSelectionRange(cursorPos, cursorPos);
  };

  document.getElementById("qTrans").oninput = (e) => {
    duLieuTrang.transSearch = e.target.value;
    duLieuTrang.transPage = 1;
    const cursorPos = e.target.selectionStart;
    hienThiTrang();
    const el = document.getElementById("qTrans");
    el.focus();
    el.setSelectionRange(cursorPos, cursorPos);
  };
  document.getElementById("fTransType").onchange = (e) => { duLieuTrang.transTypeFilter = e.target.value; duLieuTrang.transPage = 1; hienThiTrang(); };
  document.getElementById("fTransWarehouse").onchange = (e) => { duLieuTrang.transWarehouseFilter = e.target.value; duLieuTrang.transPage = 1; hienThiTrang(); };
  document.getElementById("fTransDateMode").onchange = (e) => { duLieuTrang.transDateMode = e.target.value; duLieuTrang.transPage = 1; hienThiTrang(); };
  // Các ô ngày là <input type="date"> mặc định: .value luôn là "yyyy-mm-dd" (hoặc "" khi chưa chọn).
  const fTransDay = document.getElementById("fTransDay");
  if (fTransDay) fTransDay.onchange = (e) => {
    if (e.target.value) { duLieuTrang.transDateDay = e.target.value; duLieuTrang.transPage = 1; hienThiTrang(); }
  };
  const fTransMonth = document.getElementById("fTransMonth");
  if (fTransMonth) fTransMonth.onchange = (e) => { duLieuTrang.transDateMonth = e.target.value; duLieuTrang.transPage = 1; hienThiTrang(); };
  const fTransFrom = document.getElementById("fTransFrom");
  if (fTransFrom) fTransFrom.onchange = (e) => {
    if (e.target.value) { duLieuTrang.transDateFrom = e.target.value; duLieuTrang.transPage = 1; hienThiTrang(); }
  };
  const fTransTo = document.getElementById("fTransTo");
  if (fTransTo) fTransTo.onchange = (e) => {
    if (e.target.value) { duLieuTrang.transDateTo = e.target.value; duLieuTrang.transPage = 1; hienThiTrang(); }
  };

  document.getElementById("btnResetTransFilter").onclick = () => {
    const homNay = new Date().toISOString().slice(0, 10);
    duLieuTrang.transSearch = "";
    duLieuTrang.transTypeFilter = "all";
    duLieuTrang.transWarehouseFilter = "all";
    duLieuTrang.transDateMode = "all";
    duLieuTrang.transDateDay = homNay;
    duLieuTrang.transDateMonth = homNay.slice(0, 7);
    duLieuTrang.transDateFrom = homNay;
    duLieuTrang.transDateTo = homNay;
    duLieuTrang.transPage = 1;
    hienThiTrang();
  };

  document.querySelectorAll("[data-trans-page]").forEach(btn => {
    btn.onclick = () => {
      duLieuTrang.transPage = Number(btn.dataset.transPage);
      hienThiTrang();
    };
  });

}
