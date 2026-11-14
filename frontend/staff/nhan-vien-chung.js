/* ==========================================================================
   MỤC LỤC HÀM — staff/nhan-vien-chung.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   layKetNoiSupabase()                                               — Lấy client Supabase; chưa cấu hình config.js thì hiện lỗi
   batBuocNhanVien(root, options = {})                               [export async]  — ★ Cổng vào mọi trang nhân viên: kiểm tra đăng nhập, có hồ sơ nhân viên, đang làm việc, đúng vai trò
   nhanVaiTro(r)                                                     [export]  — Đổi mã vai trò sang tên tiếng Việt
   layHuyHieuThanhBen(supabase, staff)                               [export async]  — Đếm số việc đang chờ để hiện huy hiệu trên sidebar
   hienThiThanhBenNhanVien(staff, session, activePage, badges = {})  [export]  — Vẽ sidebar điều hướng dùng chung (mục hiện theo vai trò)
   ganDangXuat(supabase)                                             [export]  — Gắn nút đăng xuất của sidebar
   xuatRaExcel(filename, sheetName, rows, meta)                      [export]  — Xuất mảng object ra file Excel (SheetJS), tên cột lấy từ key
   ========================================================================== */
// ============================================================
// nhan-vien-chung.js — Dùng chung cho mọi trang chức năng nhân viên
// Xử lý: kiểm tra đăng nhập, kiểm tra quyền, sidebar điều hướng.
// Khu vực nhân viên KHÔNG có header công khai: mọi điều hướng nằm ở sidebar bên trái.
// ============================================================
import { supabase, daCauHinh } from "../js/dung-chung/ket-noi-supabase.js";
import { maHoaHtml } from "../js/dung-chung/dinh-dang.js";
import { NGUONG_SAP_HET } from "../js/dung-chung/ton-kho.js";

function layKetNoiSupabase() {
  if (!daCauHinh) {
    document.getElementById("root").innerHTML = `<div class="denied"><b>Chưa cấu hình config.js</b></div>`;
    throw new Error("config chưa sẵn sàng");
  }
  return supabase;
}

// Kiểm tra đăng nhập + có trong ho_so_nhan_vien không.
// Trả về {supabase, session, staff} nếu hợp lệ, hoặc tự hienThiTrang màn hình chặn và trả về null.
export async function batBuocNhanVien(root, options = {}) {
  const supabase = layKetNoiSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) { // Chưa đăng nhập: về trang Tài khoản (nơi đăng nhập DUY NHẤT; nhân viên đăng nhập xong sẽ tự được chuyển lại khu vực nhân viên)
    window.location.replace("../customer/tai-khoan.html");
    return null;
  }

  const { data: staff } = await supabase.from("ho_so_nhan_vien").select("*").eq("id", session.user.id).single();
  if (!staff) {
    root.innerHTML = `<div class="denied">
      <h2>Không có quyền truy cập</h2>
      <p>Tài khoản ${maHoaHtml(session.user.email)} là tài khoản khách hàng, chưa được cấp quyền nhân viên
      trong hệ thống. Liên hệ Quản trị viên để được thêm vào bảng <code>ho_so_nhan_vien</code>.</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
        <a href="../customer/tai-khoan.html" class="btn ghost">Về trang Tài khoản</a>
        <button class="btn ghost" id="doLogout">Đăng xuất</button>
      </div>
    </div>`;
    document.getElementById("doLogout").onclick = async () => { await supabase.auth.signOut(); window.location.reload(); };
    return null;
  }

  // Nhân viên đã nghỉ việc: giữ hồ sơ (để lưu lịch sử) nhưng chặn vào khu vực nhân viên.
  // So sánh === false để vẫn chạy bình thường khi cột dang_lam_viec chưa có / còn NULL.
  if (staff.dang_lam_viec === false) {
    root.innerHTML = `<div class="denied">
      <h2>Tài khoản nhân viên đã bị vô hiệu hóa</h2>
      <p>Tài khoản ${maHoaHtml(session.user.email)} không còn quyền truy cập khu vực nhân viên. Liên hệ Quản trị viên nếu cần khôi phục.</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
        <a href="../customer/tai-khoan.html" class="btn ghost">Về trang Tài khoản</a>
        <button class="btn ghost" id="doLogout">Đăng xuất</button>
      </div>
    </div>`;
    document.getElementById("doLogout").onclick = async () => { await supabase.auth.signOut(); window.location.reload(); };
    return null;
  }

  if (options.requireRole && !options.requireRole.includes(staff.vai_tro)) {
    root.innerHTML = `<div class="denied">
      <h2>Không đủ quyền</h2>
      <p>Vai trò <b>${nhanVaiTro(staff.vai_tro)}</b> của bạn không được phép truy cập trang này.</p>
      <a href="dashboard.html" class="btn ghost" style="margin-top:10px">Về Trang chủ nhân viên</a>
    </div>`;
    return null;
  }

  return { supabase, session, staff };
}

export function nhanVaiTro(r) {
  return { sales: 'Kinh doanh', warehouse: 'Thủ kho', admin: 'Quản trị viên' }[r] || r;
}

// 3 vai trò duy nhất: admin (Quản trị viên) / warehouse (Thủ kho) / sales (Kinh doanh).
// Mỗi nhân viên có đúng 1 giá trị ở cột ho_so_nhan_vien.vai_tro — không còn cấp bậc phụ nào khác.

// Đếm số việc đang chờ xử lý để hiện badge trên sidebar — gọi 1 lần khi tải trang
export async function layHuyHieuThanhBen(supabase, staff) {
  const role = staff.vai_tro;
  const badges = {};
  const tasks = [];
  if (['sales', 'warehouse', 'admin'].includes(role)) {
    tasks.push(supabase.from("don_hang").select("id", { count: "exact", head: true }).eq("trang_thai", "pending")
      .then(({ count }) => { badges['don-hang.html'] = count || 0; }));
    tasks.push(Promise.all([
      supabase.from("yeu_cau_tra_hang").select("id", { count: "exact", head: true }).in("trang_thai", ["pending", "approved"]),
      supabase.from("hang_cho_ve_kho").select("id", { count: "exact", head: true }).eq("trang_thai", "pending"),
    ]).then(([a, b]) => { badges['tra-hang'] = (a.count || 0) + (b.count || 0); }));
    tasks.push(supabase.from("yeu_cau_bao_gia").select("id", { count: "exact", head: true }).eq("trang_thai", "new")
      .then(({ count }) => { badges['bao-gia.html'] = count || 0; }));
    tasks.push(supabase.from("yeu_cau_bao_gia")
      .select("id, tin_nhan_cuoi_luc, nhan_vien_doc_luc")
      .eq("tin_nhan_cuoi_boi", "customer")
      .then(({ data, error }) => {
        if (error) { console.warn("Không tải được thông báo phản hồi khách:", error.message); badges['customer-replies'] = 0; return; }
        badges['customer-replies'] = (data || []).filter(q =>
          !q.nhan_vien_doc_luc || (q.tin_nhan_cuoi_luc && new Date(q.tin_nhan_cuoi_luc) > new Date(q.nhan_vien_doc_luc))
        ).length;
      }));
  }
  if (['warehouse', 'admin'].includes(role)) { // Sắp hết hàng: đếm số dòng tồn kho dưới ngưỡng NGUONG_SAP_HET (khớp danh sách ở thong-bao.html)
    tasks.push(supabase.from("ton_kho").select("so_luong", { count: "exact", head: true }).lt("so_luong", NGUONG_SAP_HET)
      .then(({ count, error }) => {
        if (error) { console.warn("Không đếm được hàng sắp hết:", error.message); badges['kho.html'] = 0; return; }
        badges['kho.html'] = count || 0;
      }));
  }
  if (role === 'admin') { // chỉ Quản trị viên duyệt nhân viên mới
    tasks.push(supabase.from("yeu_cau_dang_ky_nhan_vien").select("id", { count: "exact", head: true }).eq("trang_thai", "pending")
      .then(({ count }) => { badges['phan-quyen.html'] = count || 0; }));
  }
  await Promise.all(tasks);
  return badges;
}

// Sidebar điều hướng dùng chung — mỗi trang là 1 file riêng (không phải tab JS).
// Gồm 4 phần từ trên xuống: logo · thẻ người dùng · menu · nút đăng xuất.
export function hienThiThanhBenNhanVien(staff, session, activePage, badges = {}) {
  const role = staff.vai_tro;
  const items = [
    { href: 'dashboard.html', label: '🏠 Trang chủ', roles: ['sales', 'warehouse', 'admin'] },
    { href: 'thong-bao.html', label: '🔔 Thông báo', roles: ['sales', 'warehouse', 'admin'] },
    { href: 'don-hang.html', label: '🛒 Đơn hàng', roles: ['sales', 'admin'] },
    { href: 'khach-hang.html', label: '👥 Khách hàng', roles: ['sales', 'admin'] },
    { href: 'san-pham.html', label: '🏷️ Sản phẩm', roles: ['sales', 'warehouse', 'admin'] },
    { href: 'kho.html', label: '📦 Kho hàng', roles: ['warehouse', 'admin'] },
    { href: 'han-luu-kho.html', label: '⏳ Hạn lưu kho', roles: ['warehouse', 'admin'] },
    { href: 'bao-gia.html', label: '📋 Yêu cầu khách hàng', roles: ['sales', 'warehouse', 'admin'] },
    { href: 'chiet-khau.html', label: '📉 Chiết khấu số lượng', roles: ['sales', 'warehouse', 'admin'] },
    { href: 'phan-quyen.html', label: '🔐 Phân quyền', roles: ['admin'] },
  ].filter(i => i.roles.includes(role));

  // Số đỏ cạnh mỗi mục = số việc đang chờ xử lý (xem layHuyHieuThanhBen)
  const tongViecCho = Object.values(badges).reduce((t, n) => t + (n || 0), 0);
  function soDo(href) {
    if (href === 'thong-bao.html') return tongViecCho;
    if (href === 'bao-gia.html') return (badges[href] || 0) + (badges['customer-replies'] || 0);
    if (href === 'don-hang.html') return (badges[href] || 0) + (badges['tra-hang'] || 0);
    return badges[href] || 0;
  }

  const ten = staff.ho_ten || session.user.email;
  return `
    <aside class="admin-sidebar">
      <div class="sb-brand">
        <svg viewBox="0 0 30 30" width="26" height="26" fill="none" stroke="#e2810f" stroke-width="3" stroke-linejoin="round"><rect x="4" y="4" width="10" height="22"/><path d="M14 4 L26 12 L26 18 L14 26"/></svg>
        <div><b>ABA TECHNICAL</b><small>Khu vực nhân viên</small></div>
      </div>
      <div class="sb-user">
        <span class="sb-avatar">${ten.trim().charAt(0).toUpperCase()}</span>
        <div><b>${ten}</b><small>${nhanVaiTro(role)}</small></div>
      </div>
      <nav class="sb-nav">
        ${items.map(i => {
          const n = soDo(i.href);
          return `<a class="nav-item ${activePage === i.href ? 'active' : ''}" href="${i.href}">${i.label}${n > 0 ? `<span class="nav-badge">${n > 99 ? '99+' : n}</span>` : ''}</a>`;
        }).join("")}
      </nav>
      <button class="nav-item sb-logout" id="doLogoutSidebar">← Đăng xuất</button>
    </aside>`;
}

export function ganDangXuat(supabase) {
  const el = document.getElementById("doLogoutSidebar");
  if (el) el.onclick = async () => { await supabase.auth.signOut(); window.location.href = "../customer/tai-khoan.html"; };
}

// ===== Excel helpers (cần thẻ <script src=".../xlsx.full.min.js"></script> trong trang gọi) =====

// Xuất mảng object ra file Excel, tự động lấy tên cột từ key của object đầu tiên.
// `meta` (tuỳ chọn): mảng cặp [nhãn, giá trị] in thành khối tiêu đề phía trên bảng dữ liệu — dùng
// để ghi rõ bộ lọc đã áp dụng (khoảng thời gian, loại giao dịch, kho...) ngay trong file Excel,
// tránh nhầm lẫn khi mở file ra xem lại sau này mà không nhớ đã lọc gì lúc xuất.
export function xuatRaExcel(filename, sheetName, rows, meta) {
  if (!window.XLSX) { alert("Chưa tải được thư viện Excel (XLSX). Kiểm tra kết nối mạng."); return; }
  if (!rows || rows.length === 0) { alert("Không có dữ liệu để xuất."); return; }
  const wb = window.XLSX.utils.book_new();
  let ws;
  if (meta && meta.length > 0) {
    const headerCols = Object.keys(rows[0]);
    const aoa = [
      ...meta.map(([label, value]) => [label, value]),
      [],
      headerCols,
      ...rows.map(r => headerCols.map(c => r[c])),
    ];
    ws = window.XLSX.utils.aoa_to_sheet(aoa);
  } else {
    ws = window.XLSX.utils.json_to_sheet(rows);
  }
  window.XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
  window.XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : filename + ".xlsx");
}

// Thông báo nổi (toast) dùng chung với trang khách hàng.
export { hienThongBaoNhanh } from "../js/dung-chung/trang-chung.js";
