/* ==========================================================================
   MỤC LỤC HÀM — staff/js/khach-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   daLoc()                  — Lọc danh sách khách theo từ khóa tìm kiếm
   taiTatCa()               [async]  — Tải khách hàng và số liệu thống kê đơn của từng khách
   hienThiChiTietMoRong(c)  — Vẽ dòng chi tiết mở rộng của 1 khách (tổng đơn, doanh thu, đơn gần nhất)
   hienThiBang()            — Vẽ bảng khách có phân trang
   hienThiVungDanhSach()    — Vẽ mục danh sách khách hàng
   capNhatDanhSach()        — Khi gõ tìm kiếm chỉ vẽ lại danh sách, không vẽ lại ô tìm kiếm
   hienThiTrang()           — Vẽ toàn bộ trang khách hàng
   ganSuKien()              — Gắn sự kiện cho ô tìm kiếm và bộ lọc
   ganSuKienBang()          — Gắn sự kiện cho nút trong bảng (phân trang, chi tiết)
   ========================================================================== */
// Logic trang staff/khach-hang.html — Danh sách khách hàng + thống kê đơn hàng.
// ĐÃ TINH GIẢN: bỏ các trường CRM (loại KH/MST/người liên hệ/công nợ/điều kiện thanh toán/vận
// chuyển/nhóm KH) — không cần cho trọng tâm đề tài. Giờ trang này chỉ làm 2 việc: (1) xem danh
// sách khách + tổng đơn/doanh thu (từ view v_customer_stats), (2) sửa nhanh thông tin liên hệ cơ
// bản nếu khách nhập sai lúc đăng ký. ten_cong_ty giữ lại vì dùng chung ở nhiều trang khác
// (đơn hàng, yêu cầu khách hàng, tài khoản) — không phải trường CRM riêng của trang này.
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, xuatRaExcel } from "../nhan-vien-chung.js";

import { dinhDangTien, dinhDangNgayVN, maHoaHtml } from "../../js/dung-chung/dinh-dang.js";
const phanTuGoc = document.getElementById("root");
let nguCanh = null, huyHieu = {};
let duLieuTrang = { customers: [], stats: {}, q: "", expandedId: null, sortBy: "recent", page: 1, pageSize: 20 };

function daLoc() {
  let list = duLieuTrang.customers;
  if (duLieuTrang.q.trim()) {
    const q = duLieuTrang.q.trim().toLowerCase();
    list = list.filter(c =>
      (c.ma_khach_hang || '').toLowerCase().includes(q) ||
      (c.ho_ten || '').toLowerCase().includes(q) ||
      (c.ten_cong_ty || '').toLowerCase().includes(q) ||
      (c.so_dien_thoai || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }
  const sorted = [...list];
  const rev = (c) => (duLieuTrang.stats[c.id]?.total_revenue || 0);
  if (duLieuTrang.sortBy === "revenue_desc") sorted.sort((a, b) => rev(b) - rev(a));
  else sorted.sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));
  return sorted;
}

async function taiTatCa() {
  const [{ data: customers }, { data: stats }] = await Promise.all([
    nguCanh.supabase.from("khach_hang").select("*").order("ngay_tao", { ascending: false }),
    nguCanh.supabase.from("v_customer_stats").select("*")
  ]);
  duLieuTrang.customers = customers || [];
  duLieuTrang.stats = Object.fromEntries((stats || []).map(s => [s.khach_hang_id, s]));
  hienThiTrang();
}

function hienThiChiTietMoRong(c) {
  const st = duLieuTrang.stats[c.id] || { total_orders: 0, total_revenue: 0, last_order_at: null };
  return `<tr><td colspan="6" style="background:#f9fafb">
    <div style="padding:12px 6px">
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:14px;font-size:12.5px">
        <span>📦 Tổng đơn (không tính hủy): <b>${st.total_orders}</b></span>
        <span>💰 Tổng doanh thu: <b>${dinhDangTien(st.total_revenue)}</b></span>
        <span>🕐 Đơn gần nhất: <b>${dinhDangNgayVN(st.last_order_at)}</b></span>
        <a href="don-hang.html" style="color:var(--blueprint)">Xem lịch sử đơn hàng →</a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3, minmax(0,1fr));gap:10px">
        <div class="field" style="min-width:0"><label class="field-label">Mã khách hàng</label><div><b>${maHoaHtml(c.ma_khach_hang || '—')}</b></div></div>
        <div class="field" style="min-width:0"><label class="field-label">Họ tên</label><div>${maHoaHtml(c.ho_ten || '—')}</div></div>
        <div class="field" style="min-width:0"><label class="field-label">Công ty</label><div>${maHoaHtml(c.ten_cong_ty || '—')}</div></div>
        <div class="field" style="min-width:0"><label class="field-label">Email</label><div>${maHoaHtml(c.email || '—')}</div></div>
        <div class="field" style="min-width:0"><label class="field-label">Số điện thoại</label><div>${maHoaHtml(c.so_dien_thoai || '—')}</div></div>
        <div class="field" style="min-width:0;grid-column:span 2"><label class="field-label">Địa chỉ</label><div>${maHoaHtml(c.dia_chi_mac_dinh || '—')}</div></div>
      </div>
      <p style="font-size:12px;color:var(--steel);margin-top:10px">🔒 Chỉ xem. Khách hàng tự cập nhật thông tin của mình trong mục Tài khoản.</p>
    </div>
  </td></tr>`;
}

function hienThiBang() {
  const all = daLoc();
  const totalPages = Math.max(1, Math.ceil(all.length / duLieuTrang.pageSize));
  duLieuTrang.page = Math.min(duLieuTrang.page, totalPages);
  const from = (duLieuTrang.page - 1) * duLieuTrang.pageSize;
  const list = all.slice(from, from + duLieuTrang.pageSize);
  const pagination = totalPages > 1 ? `<div class="trans-pagination" style="margin-top:0;border-top:1px solid var(--line-soft);border-radius:0">
    <div class="trans-pagination-info">Hiển thị <b>${from + 1}–${Math.min(from + list.length, all.length)}</b> / ${all.length} khách hàng</div>
    <div class="trans-pagination-buttons">${Array.from({length: totalPages}, (_, i) => `<button class="btn small ${duLieuTrang.page === i + 1 ? "" : "ghost"}" data-customer-page="${i + 1}">${i + 1}</button>`).join("")}</div>
  </div>` : `<div style="padding:10px 12px;color:var(--steel);font-size:11.5px">${all.length} khách hàng</div>`;
  return `
    <table><thead><tr><th>Mã KH</th><th>Khách hàng</th><th>Liên hệ</th><th>Tổng đơn / Doanh thu</th><th></th></tr></thead>
    <tbody>${list.map(c => {
      const st = duLieuTrang.stats[c.id] || { total_orders: 0, total_revenue: 0 };
      return `<tr>
        <td style="font-family:monospace;font-weight:600">${maHoaHtml(c.ma_khach_hang || '—')}</td>
        <td><b>${maHoaHtml(c.ho_ten)}</b>${maHoaHtml(c.ten_cong_ty) ? `<br/><span style="font-size:11px;color:var(--steel)">${maHoaHtml(c.ten_cong_ty)}</span>` : ''}</td>
        <td style="font-size:12.5px">${maHoaHtml(c.so_dien_thoai || '—')}${maHoaHtml(c.email) ? `<br/>${maHoaHtml(c.email)}` : ''}</td>
        <td style="font-size:12.5px">${st.total_orders} đơn — ${dinhDangTien(st.total_revenue)}</td>
        <td><button class="btn small ghost" data-expand="${c.id}">${duLieuTrang.expandedId===c.id?'Thu gọn':'Chi tiết'}</button></td>
      </tr>
      ${duLieuTrang.expandedId === c.id ? hienThiChiTietMoRong(c) : ''}`;
    }).join("") || `<tr><td colspan="6" class="empty">${duLieuTrang.q ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}</td></tr>`}</tbody></table>${pagination}`;
}

// Nội dung của mục "2. Danh sách khách hàng" (tiêu đề + bảng).
function hienThiVungDanhSach() {
  const soHienThi = daLoc().length;
  const tongKhach = duLieuTrang.customers.length;
  return `
    <div class="section-head">
      <div>
        <h2>2. Danh sách khách hàng</h2>
        <p>${soHienThi} khách hàng đang hiển thị / ${tongKhach} khách hàng.</p>
      </div>
    </div>
    <div class="staff-table-wrap customer-table-wrap">
      ${hienThiBang()}
    </div>`;
}

// Khi gõ tìm kiếm: CHỈ vẽ lại mục danh sách, KHÔNG vẽ lại ô tìm kiếm.
// (Nếu vẽ lại cả trang thì ô gõ bị tạo mới, con trỏ nhảy về đầu -> chữ bị gõ ngược.)
function capNhatDanhSach() {
  document.getElementById("vungDanhSach").innerHTML = hienThiVungDanhSach();
  ganSuKienBang();
}

function hienThiTrang() {
  const totalCustomers = duLieuTrang.customers.length;
  const activeCustomers = duLieuTrang.customers.filter(c => (duLieuTrang.stats[c.id]?.total_orders || 0) > 0).length;
  const totalOrders = Object.values(duLieuTrang.stats).reduce((sum, s) => sum + Number(s.total_orders || 0), 0);
  const totalRevenue = Object.values(duLieuTrang.stats).reduce((sum, s) => sum + Number(s.total_revenue || 0), 0);

  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'khach-hang.html', huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <div class="page-head">
    <div>
      <div class="page-kicker">QUẢN LÝ KHÁCH HÀNG</div>
      <h1 class="page-title">Khách hàng</h1>
      <p class="page-desc">Theo dõi thông tin liên hệ, số đơn và doanh thu của từng khách hàng.</p>
    </div>
    <div class="page-actions">
      <button class="btn ghost" id="btnExport">↓ Xuất Excel</button>
    </div>
  </div>

  <div class="staff-kpi-grid">
    <div class="staff-kpi"><span class="staff-kpi-label">Tổng khách hàng</span><strong>${totalCustomers}</strong><small>Tài khoản khách hàng</small></div>
    <div class="staff-kpi"><span class="staff-kpi-label">Đã có đơn</span><strong>${activeCustomers}</strong><small>Có ít nhất 1 đơn</small></div>
    <div class="staff-kpi"><span class="staff-kpi-label">Tổng đơn</span><strong>${totalOrders}</strong><small>Không tính dữ liệu ngoài hệ thống</small></div>
    <div class="staff-kpi"><span class="staff-kpi-label">Tổng doanh thu</span><strong>${dinhDangTien(totalRevenue)}</strong><small>Theo thống kê đơn hàng</small></div>
  </div>

  <section class="staff-section">
    <div class="section-head">
      <div>
        <h2>1. Tìm kiếm &amp; sắp xếp</h2>
        <p>Dùng bộ lọc trước, sau đó xem chi tiết từng khách hàng.</p>
      </div>
    </div>
    <div class="customer-filter-grid">
      <div class="filter-field filter-grow">
        <label for="qSearch">Tìm khách hàng</label>
        <input id="qSearch" placeholder="Mã KH / tên / SĐT / email / công ty..." value="${maHoaHtml(duLieuTrang.q)}" />
      </div>
      <div class="filter-field">
        <label for="fSort">Sắp xếp</label>
        <select id="fSort">
          <option value="recent" ${duLieuTrang.sortBy==='recent'?'selected':''}>Mới đăng ký</option>
          <option value="revenue_desc" ${duLieuTrang.sortBy==='revenue_desc'?'selected':''}>Doanh thu cao nhất</option>
        </select>
      </div>
      <button class="btn ghost filter-clear" id="btnClearCustomerFilter" type="button">× Xóa tìm kiếm</button>
    </div>
  </section>

  <section class="staff-section" id="vungDanhSach">
    ${hienThiVungDanhSach()}
  </section>
  `;
  document.getElementById("khuVucModal").innerHTML = "";
  ganDangXuat(nguCanh.supabase);
  ganSuKien();
}

function ganSuKien() {
  document.getElementById("qSearch").oninput = (e) => { duLieuTrang.q = e.target.value; duLieuTrang.page = 1; capNhatDanhSach(); };
  document.getElementById("fSort").onchange = (e) => { duLieuTrang.sortBy = e.target.value; duLieuTrang.page = 1; hienThiTrang(); };
  document.getElementById("btnClearCustomerFilter").onclick = () => { duLieuTrang.q = ""; duLieuTrang.sortBy = "recent"; duLieuTrang.page = 1; hienThiTrang(); };
  ganSuKienBang();

  // Xuất đúng danh sách đang hiển thị (đang tìm/sắp xếp thế nào thì file ra thế đó).
  document.getElementById("btnExport").onclick = () => {
    const rows = daLoc().map(c => {
      const st = duLieuTrang.stats[c.id] || { total_orders: 0, total_revenue: 0 };
      return {
        "Mã KH": c.ma_khach_hang || "", "Họ tên": c.ho_ten, "Công ty": c.ten_cong_ty || "",
        "SĐT": c.so_dien_thoai || "", "Email": c.email || "", "Địa chỉ": c.dia_chi_mac_dinh || "",
        "Tổng đơn": st.total_orders, "Tổng doanh thu": st.total_revenue
      };
    });
    xuatRaExcel("khach-hang-" + new Date().toISOString().slice(0, 10), "Khách hàng", rows, [["Từ khóa", duLieuTrang.q || "Tất cả"]]);
  };

}

// Gắn sự kiện cho các nút TRONG bảng (phân trang + nút "Chi tiết").
// Tách riêng vì bảng bị vẽ lại mỗi khi gõ tìm kiếm -> phải gắn lại sự kiện sau mỗi lần vẽ.
function ganSuKienBang() {
  document.querySelectorAll("[data-customer-page]").forEach(btn => {
    btn.onclick = () => { duLieuTrang.page = Number(btn.getAttribute("data-customer-page")); capNhatDanhSach(); };
  });
  document.querySelectorAll("[data-expand]").forEach(btn => {
    btn.onclick = () => { duLieuTrang.expandedId = duLieuTrang.expandedId === btn.getAttribute("data-expand") ? null : btn.getAttribute("data-expand"); capNhatDanhSach(); };
  });
}

(async () => {
  nguCanh = await batBuocNhanVien(phanTuGoc, { requireRole: ['sales', 'admin'], activePage: "khach-hang.html" });
  if (!nguCanh) return;
  huyHieu = await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff);
  taiTatCa();
})();
