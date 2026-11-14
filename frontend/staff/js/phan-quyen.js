/* ==========================================================================
   MỤC LỤC HÀM — staff/js/phan-quyen.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   nhanVienDaLoc()  — Lọc danh sách nhân viên theo vai trò
   taiNhanVien()    [async]  — Tải danh sách nhân viên từ ho_so_nhan_vien
   lopMau(s)        — Chọn class màu theo vai trò
   oTen(s)          — HTML ô tên + email nhân viên
   suaDuoc(s)       — Nhân viên này có sửa được không (không tự sửa chính mình)
   hienThiTrang()   — Vẽ trang phân quyền
   ========================================================================== */
// Logic trang staff/phan-quyen.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, hienThongBaoNhanh, nhanVaiTro } from "../nhan-vien-chung.js";
import { maHoaHtml } from "../../js/dung-chung/dinh-dang.js";

const phanTuGoc = document.getElementById("root");
let nguCanh = null;
let huyHieu = {};
let duLieuTrang = { staffList: [], requests: [], staffSearch: "", roleFilter: "all" };

function nhanVienDaLoc() {
  let list = duLieuTrang.staffList;
  const f = duLieuTrang.roleFilter;
  if (f !== "all") list = list.filter(s => s.vai_tro === f);
  const q = duLieuTrang.staffSearch.trim().toLowerCase();
  if (q) list = list.filter(s => (s.ho_ten || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q));
  return list;
}

async function taiNhanVien() {
  const { data } = await nguCanh.supabase.from("ho_so_nhan_vien").select("*").order("ngay_tao");
  duLieuTrang.staffList = data || [];
  const { data: reqs } = await nguCanh.supabase.from("yeu_cau_dang_ky_nhan_vien").select("*").order("ngay_tao", { ascending: false });
  duLieuTrang.requests = reqs || [];
  hienThiTrang();
}

// Quy tắc: chỉ Quản trị viên vào được trang này; ai cũng sửa được người khác NHƯNG không tự đổi vai trò của mình
// (trigger bao_ve_phan_quyen trong DB cũng chặn đúng luật này, nên đây chỉ là ẩn/hiện nút cho gọn).
// Lớp màu theo vai trò (xem .pq-* trong css/nhan-vien.css) + khối "tên + chữ cái đầu"
function lopMau(s) { return { admin:'pq-quantri', warehouse:'pq-thukho', sales:'pq-kinhdoanh' }[s.vai_tro] || ''; }
function oTen(s) {
  return `<div class="pq-name"><div class="pq-avatar">${maHoaHtml((s.ho_ten || '?').trim().charAt(0).toUpperCase())}</div>
    <div>${maHoaHtml(s.ho_ten) || '(chưa cập nhật tên)'}<br><span class="pq-id">${maHoaHtml(s.email) || '(chưa có email)'}</span></div></div>`;
}

function suaDuoc(s) { return s.id !== nguCanh.staff.id; }


function hienThiTrang() {
  const dsLoc = nhanVienDaLoc();
  const dangLam = dsLoc.filter(s => s.dang_lam_viec !== false);
  const daNghi = dsLoc.filter(s => s.dang_lam_viec === false);
  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'phan-quyen.html', huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <div class="toolbar"><h1 class="page-title" style="margin:0">Phân quyền vai trò (RBAC)</h1></div>

  ${duLieuTrang.requests.filter(r=>r.trang_thai==='pending').length > 0 ? `
  <h3 style="font-size:14px">🔔 Yêu cầu đăng ký nhân viên chờ duyệt (${duLieuTrang.requests.filter(r=>r.trang_thai==='pending').length})</h3>
  <table style="margin-bottom:26px"><thead><tr><th>Họ tên</th><th>Email</th><th>Vị trí xin cấp</th><th>Ghi chú</th><th>Ngày gửi</th><th></th></tr></thead>
  <tbody>${duLieuTrang.requests.filter(r=>r.trang_thai==='pending').map(r => `
    <tr>
      <td><b>${maHoaHtml(r.ho_ten) || '(chưa rõ)'}</b></td>
      <td>${maHoaHtml(r.email)}</td>
      <td><span class="role-badge">${nhanVaiTro(r.vai_tro_de_xuat)}</span></td>
      <td style="font-size:12.5px;color:var(--steel)">${maHoaHtml(r.ghi_chu) || '—'}</td>
      <td>${new Date(r.ngay_tao).toLocaleString("vi-VN")}</td>
      <td style="display:flex;gap:6px">
        <button class="btn small" data-approve="${r.id}">✓ Duyệt</button>
        <button class="btn small ghost" data-reject="${r.id}">✕ Từ chối</button>
      </td>
    </tr>
  `).join("")}</tbody></table>
  ` : ''}

  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px">
    <h3 style="font-size:14px;margin:0">Nhân viên đang làm việc (${dangLam.length})</h3>
    <div style="display:flex;gap:8px">
      <input id="qStaff" placeholder="🔍 Tìm theo tên hoặc email..." value="${duLieuTrang.staffSearch}" style="width:200px"/>
      <select id="fRole" style="width:160px">
        <option value="all" ${duLieuTrang.roleFilter==='all'?'selected':''}>Tất cả vai trò</option>
        <option value="sales" ${duLieuTrang.roleFilter==='sales'?'selected':''}>Kinh doanh</option>
        <option value="warehouse" ${duLieuTrang.roleFilter==='warehouse'?'selected':''}>Thủ kho</option>
        <option value="admin" ${duLieuTrang.roleFilter==='admin'?'selected':''}>Quản trị viên</option>
      </select>
    </div>
  </div>
  <table class="pq-table"><thead><tr><th>Họ tên</th><th>Vai trò hiện tại</th><th>Đổi vai trò</th><th>Trạng thái</th></tr></thead>
  <tbody>${dangLam.map(s => `
    <tr>
      <td>${oTen(s)}</td>
      <td><span class="role-badge ${lopMau(s)}">${nhanVaiTro(s.vai_tro)}</span></td>
      <td>${!suaDuoc(s)
        ? `<span style="font-size:12.5px;color:var(--steel)">Không tự đổi vai trò của mình</span>`
        : `<select data-role-select="${s.id}">
        ${['admin','warehouse','sales'].map(r => `<option value="${r}" ${s.vai_tro===r?'selected':''}>${nhanVaiTro(r)}</option>`).join("")}
      </select>`}</td>
      <td>${s.id === nguCanh.staff.id ? '<span style="font-size:12px;color:var(--steel)">(Bạn)</span>'
        : !suaDuoc(s) ? '<span style="font-size:12px;color:var(--steel)">—</span>'
        : `<button class="btn small ghost pq-nghi" data-active="${s.id}" data-value="false">Cho nghỉ việc</button>`}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="empty">${duLieuTrang.staffSearch || duLieuTrang.roleFilter!=='all' ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'}</td></tr>`}</tbody></table>

  ${daNghi.length ? `
  <details class="pq-nghi-box" ${duLieuTrang.staffSearch ? 'open' : ''}>
    <summary>Nhân viên đã nghỉ việc (${daNghi.length}) — bấm để xem</summary>
    <table style="margin-top:10px"><thead><tr><th>Họ tên</th><th>Vai trò trước khi nghỉ</th><th></th></tr></thead>
    <tbody>${daNghi.map(s => `
      <tr style="opacity:.7">
        <td>${oTen(s)}</td>
        <td><span class="role-badge ${lopMau(s)}">${nhanVaiTro(s.vai_tro)}</span></td>
        <td>${suaDuoc(s)
          ? `<button class="btn small ghost" data-active="${s.id}" data-value="true">Khôi phục</button>`
          : '<span style="font-size:12px;color:var(--steel)">—</span>'}</td>
      </tr>`).join("")}</tbody></table>
  </details>` : ''}
  <p style="font-size:12.5px;color:var(--steel);margin-top:14px">
    Nhân viên mới cần tự đăng ký (tick "Tôi là nhân viên ABA" ở trang <code>tai-khoan.html</code>),
    yêu cầu sẽ xuất hiện ở bảng phía trên để bạn Duyệt hoặc Từ chối. Chỉ khi Duyệt thì tài khoản đó
    mới có quyền truy cập khu vực nhân viên — trước đó tài khoản không có quyền gì đặc biệt.
  </p>
  `;
  document.getElementById("khuVucModal").innerHTML = "";
  ganDangXuat(nguCanh.supabase);

  const qStaff = document.getElementById("qStaff");
  if (qStaff) qStaff.oninput = (e) => {
    duLieuTrang.staffSearch = e.target.value;
    const cursorPos = e.target.selectionStart;
    hienThiTrang();
    const el = document.getElementById("qStaff");
    el.focus();
    el.setSelectionRange(cursorPos, cursorPos);
  };
  const fRole = document.getElementById("fRole");
  if (fRole) fRole.onchange = (e) => { duLieuTrang.roleFilter = e.target.value; hienThiTrang(); };

  document.querySelectorAll("[data-role-select]").forEach(el => {
    el.onchange = async () => {
      const id = el.getAttribute("data-role-select");
      const newRole = el.value;
      const { error } = await nguCanh.supabase.from("ho_so_nhan_vien").update({ vai_tro: newRole }).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); taiNhanVien(); return; }
      hienThongBaoNhanh("Đã cập nhật vai trò");
      taiNhanVien();
    };
  });

  // Cho nghỉ việc / khôi phục: chỉ đổi cờ dang_lam_viec, KHÔNG xoá hồ sơ để giữ lịch sử
  // (các giao dịch kho, quy tắc chiết khấu... vẫn trỏ về nhân viên này).
  document.querySelectorAll("[data-active]").forEach(el => {
    el.onclick = async () => {
      const id = el.getAttribute("data-active");
      const conLam = el.getAttribute("data-value") === "true";
      if (!conLam && !confirm("Cho nhân viên này nghỉ việc? Họ sẽ mất toàn bộ quyền nhân viên ngay lập tức (có thể khôi phục lại).")) return;
      const { error } = await nguCanh.supabase.from("ho_so_nhan_vien").update({ dang_lam_viec: conLam }).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh(conLam ? "Đã khôi phục nhân viên" : "Đã cho nhân viên nghỉ việc");
      taiNhanVien();
    };
  });

  document.querySelectorAll("[data-approve]").forEach(el => {
    el.onclick = async () => {
      const id = el.getAttribute("data-approve");
      const req = duLieuTrang.requests.find(r => r.id === id);
      if (!req) return;
      const { error: insErr } = await nguCanh.supabase.from("ho_so_nhan_vien").insert({ id: req.tai_khoan_id, ho_ten: req.ho_ten, vai_tro: req.vai_tro_de_xuat });
      if (insErr) { hienThongBaoNhanh("Lỗi tạo tài khoản nhân viên: " + insErr.message); return; }
      await nguCanh.supabase.from("yeu_cau_dang_ky_nhan_vien").update({ trang_thai: 'approved', nguoi_duyet: nguCanh.staff.id, ngay_duyet: new Date().toISOString() }).eq("id", id);
      hienThongBaoNhanh(`Đã duyệt — ${req.ho_ten} giờ là ${nhanVaiTro(req.vai_tro_de_xuat)}`);
      taiNhanVien();
    };
  });

  document.querySelectorAll("[data-reject]").forEach(el => {
    el.onclick = async () => {
      const id = el.getAttribute("data-reject");
      await nguCanh.supabase.from("yeu_cau_dang_ky_nhan_vien").update({ trang_thai: 'rejected', nguoi_duyet: nguCanh.staff.id, ngay_duyet: new Date().toISOString() }).eq("id", id);
      hienThongBaoNhanh("Đã từ chối yêu cầu");
      taiNhanVien();
    };
  });
}

(async () => {
  nguCanh = await batBuocNhanVien(phanTuGoc, { requireRole: ['admin'], activePage: "phan-quyen.html" });
  if (!nguCanh) return;
  huyHieu = await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff);
  taiNhanVien();
})();
