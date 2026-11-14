/* ==========================================================================
   MỤC LỤC HÀM — staff/js/dashboard.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   taiBangDieuKhien()        [async]  — Tải số liệu tổng quan cho bảng điều khiển (hôm nay, tháng...)
   hienThiTrang()            — Vẽ bảng điều khiển theo vai trò
   hienThiTrangThuKho()      — Vẽ trang chủ của thủ kho (tồn kho, mã cần nhập, phiếu nhập gần đây)
   hienThiTinhTrangTon()     — Vẽ thanh chia mã theo 3 nhóm: đủ hàng / sắp hết / hết hàng
   hienThiMaCanNhap(ds)      — Vẽ danh sách mã cần nhập thêm
   hienThiPhieuNhapGanDay()  — Vẽ danh sách phiếu nhập gần đây
   hienThiBieuDo()           — Vẽ biểu đồ bằng Chart.js (chỉ khi đã nạp thư viện)
   ========================================================================== */
// Logic trang staff/dashboard.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, nhanVaiTro } from "../nhan-vien-chung.js";
import { dinhDangTien, maHoaHtml } from "../../js/dung-chung/dinh-dang.js";
import { CAC_TRANG_THAI, NHAN_TRANG_THAI_DON } from "./don-hang/hang-so.js";
import { NGUONG_SAP_HET, laHetHang, laSapHet } from "../../js/dung-chung/ton-kho.js";

const phanTuGoc = document.getElementById("root");
let nguCanh = null;
let huyHieu = {};
let chiSo = {};
let donGanDay = [];
let hangSapHet = [];

async function taiBangDieuKhien() {
  const { supabase, staff } = nguCanh;
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

  const tasks = {};
  if (['sales','admin'].includes(staff.vai_tro)) {
    tasks.todayOrders = supabase.from("don_hang").select("tong_tien, ngay_tao, trang_thai").gte("ngay_tao", todayStart.toISOString());
    tasks.monthOrders = supabase.from("don_hang").select("tong_tien").gte("ngay_tao", monthStart.toISOString()).neq("trang_thai", "cancelled");
    tasks.pendingOrders = supabase.from("don_hang").select("id", { count: "exact", head: true }).eq("trang_thai", "pending");
    tasks.newQuotes = supabase.from("yeu_cau_bao_gia").select("id", { count: "exact", head: true }).eq("trang_thai", "new");
    tasks.recent = supabase.from("don_hang").select("*, khach_hang(ho_ten)").order("ngay_tao", { ascending: false }).limit(6);
    const d7 = new Date(); d7.setDate(d7.getDate() - 6); d7.setHours(0,0,0,0);
    tasks.last7days = supabase.from("don_hang").select("tong_tien, trang_thai, ngay_tao").gte("ngay_tao", d7.toISOString());
  }
  if (["warehouse","admin"].includes(staff.vai_tro)) tasks.lowStock = supabase.from("ton_kho").select("so_luong, san_pham(ma_san_pham), kho(ten)").lt("so_luong", NGUONG_SAP_HET).order("so_luong").limit(8);
  if (staff.vai_tro === 'admin') tasks.pendingSignups = supabase.from("yeu_cau_dang_ky_nhan_vien").select("id", { count: "exact", head: true }).eq("trang_thai", "pending");
  if (staff.vai_tro === 'admin') {
    tasks.totalProducts = supabase.from("san_pham").select("id", { count: "exact", head: true }).eq("dang_hoat_dong", true);
  }
  if (staff.vai_tro === 'warehouse') {
    tasks.stockOverview = supabase.from("san_pham").select("id, ma_san_pham, hang_san_xuat, so_luong_ton").eq("dang_hoat_dong", true).order("so_luong_ton", { ascending: true });
    tasks.recentImports = supabase.from("giao_dich_kho").select("so_phieu, so_luong, ngay_tao, san_pham(ma_san_pham)").eq("loai_giao_dich", "import").order("ngay_tao", { ascending: false }).limit(5);
  }

  const keys = Object.keys(tasks);
  const results = await Promise.all(Object.values(tasks));
  const byKey = {}; keys.forEach((k, i) => byKey[k] = results[i]);

  chiSo.todayOrdersCount = byKey.todayOrders?.data?.length ?? null;
  chiSo.todayRevenue = (byKey.todayOrders?.data || []).reduce((s, o) => s + Number(o.tong_tien || 0), 0);
  chiSo.monthRevenue = (byKey.monthOrders?.data || []).reduce((s, o) => s + Number(o.tong_tien || 0), 0);
  chiSo.pendingOrders = byKey.pendingOrders?.count ?? null;
  chiSo.newQuotes = byKey.newQuotes?.count ?? null;
  chiSo.pendingSignups = byKey.pendingSignups?.count ?? null;
  chiSo.totalProducts = byKey.totalProducts?.count ?? null;
  donGanDay = byKey.recent?.data || [];
  hangSapHet = byKey.lowStock?.data || [];
  chiSo.phieuNhapGanDay = byKey.recentImports?.data || [];

  const stockRows = byKey.stockOverview?.data || [];
  chiSo.totalSKU = stockRows.length;
  chiSo.totalUnits = stockRows.reduce((s, p) => s + (p.so_luong_ton || 0), 0);
  chiSo.zeroStockItems = stockRows.filter(p => laHetHang(p.so_luong_ton));
  chiSo.lowStockItems = stockRows.filter(p => laSapHet(p.so_luong_ton));
  chiSo.healthyPct = chiSo.totalSKU > 0 ? Math.round((chiSo.totalSKU - chiSo.zeroStockItems.length - chiSo.lowStockItems.length) / chiSo.totalSKU * 100) : 100;

  // Dữ liệu cho biểu đồ: phân bố trạng thái đơn hàng (7 ngày) + doanh thu theo ngày (7 ngày)
  const last7 = byKey.last7days?.data || [];
  const statusCount = { pending:0, confirmed:0, shipped:0, partially_delivered:0, delivery_failed:0, completed:0, cancelled:0 };
  last7.forEach(o => { if (statusCount[o.trang_thai] != null) statusCount[o.trang_thai]++; });
  chiSo.statusChart = statusCount;

  const dayLabels = [], dayRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    dayLabels.push(d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
    const sum = last7.filter(o => { const t = new Date(o.ngay_tao); return t >= d && t < next && o.trang_thai !== 'cancelled'; })
      .reduce((s, o) => s + Number(o.tong_tien || 0), 0);
    dayRevenue.push(sum);
  }
  chiSo.dayLabels = dayLabels; chiSo.dayRevenue = dayRevenue;

  hienThiTrang();
}

function hienThiTrang() {
  const { staff } = nguCanh;
  const isSales = ['sales','admin'].includes(staff.vai_tro);
  const isWarehouse = staff.vai_tro === 'warehouse';
  const isKhoQuyen = ['warehouse','admin'].includes(staff.vai_tro); // Kinh doanh KHÔNG thấy Kho/Hạn lưu kho

  const kpiCards = [];
  if (isSales) {
    kpiCards.push(`<div class="kpi-card"><span class="kpi-icon">🛒</span><div class="kpi-value">${chiSo.todayOrdersCount ?? '—'}</div><div class="kpi-label">Đơn đặt hôm nay</div></div>`);
    kpiCards.push(`<div class="kpi-card"><span class="kpi-icon">💰</span><div class="kpi-value">${dinhDangTien(chiSo.todayRevenue)}</div><div class="kpi-label">Doanh thu hôm nay</div></div>`);
    kpiCards.push(`<div class="kpi-card"><span class="kpi-icon">📈</span><div class="kpi-value">${dinhDangTien(chiSo.monthRevenue)}</div><div class="kpi-label">Doanh thu tháng này</div></div>`);
    kpiCards.push(`<div class="kpi-card ${chiSo.pendingOrders>0?'alert':''}"><span class="kpi-icon">⏳</span><div class="kpi-value">${chiSo.pendingOrders ?? '—'}</div><div class="kpi-label">Đơn chờ xác nhận</div></div>`);
    kpiCards.push(`<div class="kpi-card ${chiSo.newQuotes>0?'alert':''}"><span class="kpi-icon">📋</span><div class="kpi-value">${chiSo.newQuotes ?? '—'}</div><div class="kpi-label">Yêu cầu khách hàng mới</div></div>`);
  }
  if (staff.vai_tro === 'admin') {
    kpiCards.push(`<div class="kpi-card ${chiSo.pendingSignups>0?'alert':''}"><span class="kpi-icon">🔐</span><div class="kpi-value">${chiSo.pendingSignups ?? '—'}</div><div class="kpi-label">Yêu cầu duyệt nhân viên</div></div>`);
  }
  if (staff.vai_tro === 'admin') {
    kpiCards.push(`<div class="kpi-card"><span class="kpi-icon">🏷️</span><div class="kpi-value">${chiSo.totalProducts ?? '—'}</div><div class="kpi-label">Sản phẩm đang bán</div></div>`);
  }
  if (isKhoQuyen) kpiCards.push(`<div class="kpi-card ${hangSapHet.length>0?'alert':''}"><span class="kpi-icon">📦</span><div class="kpi-value">${hangSapHet.length}</div><div class="kpi-label">Dòng tồn kho sắp hết (&lt;${NGUONG_SAP_HET})</div></div>`);

  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(staff, nguCanh.session, 'dashboard.html', huyHieu);
  if (isWarehouse) { // Thủ kho có giao diện riêng, gọn hơn (xem hienThiTrangThuKho bên dưới)
    document.getElementById("noiDungTrang").innerHTML = hienThiTrangThuKho();
    document.getElementById("khuVucModal").innerHTML = "";
    ganDangXuat(nguCanh.supabase);
    return;
  }
  document.getElementById("noiDungTrang").innerHTML = `
  <div class="toolbar"><h1 class="page-title" style="margin:0">Chào ${maHoaHtml(staff.ho_ten) || maHoaHtml(nguCanh.session.user.email).split('@')[0]} 👋</h1></div>
  <p style="color:var(--steel);font-size:13px;margin:-10px 0 20px">Vai trò: <b>${nhanVaiTro(staff.vai_tro)}</b> · Tổng quan hoạt động hôm nay</p>

  ${kpiCards.length ? `<div class="kpi-grid">${kpiCards.join("")}</div>` : ''}

  ${isSales ? `
  <div class="dash-cols" style="margin-bottom:20px">
    <div class="dash-panel">
      <h3>📊 Doanh thu 7 ngày gần nhất</h3>
      <div class="chart-box"><canvas id="chartRevenue"></canvas></div>
    </div>
    <div class="dash-panel">
      <h3>🥯 Tỉ lệ trạng thái đơn hàng (7 ngày)</h3>
      <div class="chart-box"><canvas id="chartStatus"></canvas></div>
    </div>
  </div>` : ''}

  ${isSales ? `
  <div class="dash-cols">
    <div class="dash-panel">
      <h3>🛒 Đơn hàng gần đây</h3>
      ${donGanDay.length ? donGanDay.map(o => `
        <div class="mini-row">
          <span>${maHoaHtml(o.khach_hang?.ho_ten) || '(chưa rõ tên)'} — ${dinhDangTien(o.tong_tien)}</span>
          <span class="badge ${o.trang_thai === 'delivery_failed' ? 'cancelled' : o.trang_thai}">${NHAN_TRANG_THAI_DON[o.trang_thai] || o.trang_thai}</span>
        </div>`).join("") : `<p style="color:var(--steel);font-size:12.5px">Chưa có đơn hàng nào.</p>`}
      ${donGanDay.length ? `<a href="don-hang.html" class="btn ghost small" style="margin-top:12px;display:inline-block">Xem tất cả đơn hàng →</a>` : ''}
    </div>

    ${isKhoQuyen ? `    <div class="dash-panel">
      <h3>📦 Tồn kho sắp hết</h3>
      ${hangSapHet.length ? hangSapHet.map(s => `
        <div class="mini-row">
          <span>${s.san_pham?.ma_san_pham || '—'} <span style="color:var(--steel)">(${s.kho?.ten || '—'})</span></span>
          <b style="color:#c0392b">${s.so_luong}</b>
        </div>`).join("") : `<p style="color:var(--steel);font-size:12.5px">Không có dòng nào dưới ngưỡng cảnh báo. 👍</p>`}
      <a href="kho.html" class="btn ghost small" style="margin-top:12px;display:inline-block">Xem trang Kho hàng →</a>
    </div>` : ''}
  </div>` : ''}
  `;
  document.getElementById("khuVucModal").innerHTML = "";
  ganDangXuat(nguCanh.supabase);
  hienThiBieuDo();
}

// ===== TRANG CHỦ THỦ KHO =====
// Chỉ 3 khối, đọc từ trên xuống: (1) tình trạng tồn kho, (2) mã cần nhập, (3) phiếu nhập gần đây.
// Việc điều hướng khác (kho, hạn lưu kho...) đã có sẵn ở thanh bên nên không lặp lại ở đây.
function hienThiTrangThuKho() {
  const { staff, session } = nguCanh;
  const ten = staff.ho_ten || session.user.email.split('@')[0];
  const homNay = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  const canNhap = [...chiSo.zeroStockItems, ...chiSo.lowStockItems].slice(0, 8);
  return `
  <div class="tk-dau">
    <h1 class="page-title" style="margin:0">Chào ${maHoaHtml(ten)}</h1>
    <span class="tk-ngay">${homNay}</span>
  </div>
  ${hienThiTinhTrangTon()}
  <div class="tk-hai-cot">
    ${hienThiMaCanNhap(canNhap)}
    ${hienThiPhieuNhapGanDay()}
  </div>`;
}

// Thanh ngang chia tất cả mã sản phẩm làm 3 nhóm: đủ hàng / sắp hết / hết hàng
function hienThiTinhTrangTon() {
  const het = chiSo.zeroStockItems.length, sap = chiSo.lowStockItems.length;
  const du = chiSo.totalSKU - het - sap;
  const doan = (n, lop) => n > 0 ? `<span class="tk-doan ${lop}" style="flex-grow:${n}"></span>` : "";
  return `
  <section class="tk-khoi tk-ton">
    <div class="tk-ton-so">
      <b>${chiSo.totalUnits.toLocaleString("vi-VN")}</b>
      <span>sản phẩm đang trong kho, thuộc ${chiSo.totalSKU} mã</span>
    </div>
    <div class="tk-thanh">${doan(du, "du")}${doan(sap, "sap")}${doan(het, "het")}</div>
    <div class="tk-chu-thich">
      <span><i class="du"></i><b>${du}</b> mã đủ hàng (từ ${NGUONG_SAP_HET} trở lên)</span>
      <span><i class="sap"></i><b>${sap}</b> mã sắp hết (dưới ${NGUONG_SAP_HET})</span>
      <span><i class="het"></i><b>${het}</b> mã hết hàng</span>
    </div>
  </section>`;
}

function hienThiMaCanNhap(ds) {
  return `
  <section class="tk-khoi">
    <h2>Mã cần nhập thêm</h2>
    ${ds.length === 0 ? `<p class="tk-trong">Chưa có mã nào cần nhập, kho đang đủ hàng.</p>` : ds.map(p => {
      const het = (p.so_luong_ton || 0) <= 0;
      const phanTram = Math.min(100, Math.round((p.so_luong_ton || 0) / NGUONG_SAP_HET * 100));
      return `
    <div class="tk-dong">
      <div class="tk-ma"><b>${maHoaHtml(p.ma_san_pham)}</b><small>${maHoaHtml(p.hang_san_xuat || "")}</small></div>
      <div class="tk-muc">
        <div class="tk-ong"><span class="${het ? "het" : "sap"}" style="width:${het ? 100 : phanTram}%"></span></div>
        <small class="${het ? "het" : ""}">${het ? "Hết hàng" : `Còn ${p.so_luong_ton}`}</small>
      </div>
      <a class="btn small" href="kho.html">Nhập hàng</a>
    </div>`;
    }).join("")}
  </section>`;
}

function hienThiPhieuNhapGanDay() {
  const ds = chiSo.phieuNhapGanDay;
  return `
  <section class="tk-khoi">
    <h2>Phiếu nhập gần đây</h2>
    ${ds.length === 0 ? `<p class="tk-trong">Chưa có phiếu nhập nào.</p>` : ds.map(t => `
    <div class="tk-dong">
      <div class="tk-ma"><b>${maHoaHtml(t.san_pham?.ma_san_pham || "—")}</b><small>${t.so_phieu ? maHoaHtml(t.so_phieu) : "Phiếu cũ"}</small></div>
      <div class="tk-sl">+${t.so_luong}</div>
      <small class="tk-gio">${new Date(t.ngay_tao).toLocaleDateString("vi-VN")}</small>
    </div>`).join("")}
    <a href="kho.html" class="tk-xem-them">Xem lịch sử ở trang Kho hàng</a>
  </section>`;
}

let bieuDoDoanhThu = null, bieuDoTrangThai = null;
function hienThiBieuDo() {
  if (typeof Chart === "undefined") return;
  const isSales = ['sales','admin'].includes(nguCanh.staff.vai_tro);
  if (!isSales) return;

  if (bieuDoDoanhThu) bieuDoDoanhThu.destroy();
  if (bieuDoTrangThai) bieuDoTrangThai.destroy();

  const elRev = document.getElementById("chartRevenue");
  if (elRev) {
    bieuDoDoanhThu = new Chart(elRev, {
      type: "bar",
      data: { labels: chiSo.dayLabels, datasets: [{ label: "Doanh thu", data: chiSo.dayRevenue, backgroundColor: "#e2810f", borderRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => (v/1000)+'k' } } } }
    });
  }

  const elSt = document.getElementById("chartStatus");
  if (elSt) {
    const sc = chiSo.statusChart || {};
    const labels = CAC_TRANG_THAI.map(k => NHAN_TRANG_THAI_DON[k]);
    const data = CAC_TRANG_THAI.map(k => sc[k] || 0);
    const total = data.reduce((a,b)=>a+b,0);
    bieuDoTrangThai = new Chart(elSt, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: ['#f0ad4e','#2b5f8a','#5bc0de','#e67e22','#95a5a6','#2ecc71','#e74c3c'] }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '58%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10.5 } } },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw} (${total?Math.round(c.raw/total*100):0}%)` } } } }
    });
  }
}

(async () => {
  nguCanh = await batBuocNhanVien(phanTuGoc, { activePage: "dashboard.html" });
  if (!nguCanh) return;
  huyHieu = await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff);
  taiBangDieuKhien();
})();
