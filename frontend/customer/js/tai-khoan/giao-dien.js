/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/giao-dien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang()     — Vẽ trang: chưa đăng nhập thì form đăng nhập/đăng ký, đã đăng nhập thì hienThiTaiKhoan
   hienThiTaiKhoan()  — Vẽ trang tài khoản (các nhóm: đơn hàng, thông báo, hồ sơ, yêu cầu)
   ========================================================================== */
// Vẽ giao diện trang Tài khoản: khung trang, màn hình đăng nhập/đăng ký, và màn hình sau khi đăng nhập.
import { phanTuGoc, supabase, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { donHangDaLoc, hienThiTheDonHang, chiSoTongQuanDon } from "./don-hang.js";
import { hienThiHopSuaHoSo, hienThiTheHoSo } from "./ho-so.js";
import { ganSuKienTaiKhoan, ganSuKienDangNhap } from "./su-kien.js";
import { hienThiThongBao, hienThiThongBaoDangKyNhanVien } from "./thong-bao.js";
import { hienThiHopChiTietYeuCau, hienThiYeuCauCuaToi } from "./yeu-cau.js";
import { maHoaHtml, dinhDangTien } from "../../../js/dung-chung/dinh-dang.js";
import { CAC_TRANG_THAI, NHAN_TRANG_THAI_DON } from "../../../js/dung-chung/trang-thai-don.js";

function hienThiTrang() {
  if (duLieuTrang.session && !duLieuTrang.resetMode) { hienThiTaiKhoan(); return; }
  phanTuGoc.style.maxWidth = "480px";

  // Người dùng bấm link đặt lại mật khẩu trong email — Supabase tự tạo session tạm (type=recovery)
  if (duLieuTrang.resetMode) {
    phanTuGoc.innerHTML = `
      <span class="eyebrow">Đặt lại mật khẩu</span>
      <h1 class="page-title">Tạo mật khẩu mới</h1>
      <p class="lead" style="margin-bottom:20px">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      <div class="panel auth-panel">
        ${duLieuTrang.msg ? `<div class="msg ${duLieuTrang.msg.type}">${duLieuTrang.msg.text}</div>` : ''}
        <div class="field"><label class="field-label">Mật khẩu mới (tối thiểu 6 ký tự)</label><input id="fNewPassword" type="password" /></div>
        <div class="field"><label class="field-label">Nhập lại mật khẩu mới</label><input id="fNewPassword2" type="password" /></div>
        <button class="btn" id="fResetSubmit">Lưu mật khẩu mới</button>
      </div>`;
    document.getElementById("fResetSubmit").onclick = async () => {
      const p1 = document.getElementById("fNewPassword").value;
      const p2 = document.getElementById("fNewPassword2").value;
      if (p1.length < 6) { duLieuTrang.msg = { type: "error", text: "Mật khẩu cần tối thiểu 6 ký tự." }; hienThiTrang(); return; }
      if (p1 !== p2) { duLieuTrang.msg = { type: "error", text: "Mật khẩu nhập lại không khớp." }; hienThiTrang(); return; }
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) { duLieuTrang.msg = { type: "error", text: "Lỗi: " + error.message }; hienThiTrang(); return; }
      duLieuTrang.resetMode = false;
      duLieuTrang.msg = { type: "ok", text: "Đã đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới." };
      await supabase.auth.signOut();
      hienThiTrang();
    };
    return;
  }

  // Quên mật khẩu — chỉ cần nhập email, gửi link đặt lại
  if (duLieuTrang.forgotMode) {
    phanTuGoc.innerHTML = `
      <span class="eyebrow">Quên mật khẩu</span>
      <h1 class="page-title">Lấy lại mật khẩu</h1>
      <p class="lead" style="margin-bottom:20px">Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
      <div class="panel auth-panel">
        ${duLieuTrang.msg ? `<div class="msg ${duLieuTrang.msg.type}">${duLieuTrang.msg.text}</div>` : ''}
        <div class="field"><label class="field-label">Email</label><input id="fForgotEmail" type="email" /></div>
        <button class="btn" id="fForgotSubmit">Gửi link đặt lại mật khẩu</button>
        <p class="acc-edit-link" id="fBackToSignin" style="margin-top:14px;display:inline-block">← Quay lại đăng nhập</p>
      </div>`;
    document.getElementById("fForgotSubmit").onclick = async () => {
      const email = document.getElementById("fForgotEmail").value.trim();
      if (!email) { duLieuTrang.msg = { type: "error", text: "Vui lòng nhập email." }; hienThiTrang(); return; }
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
      if (error) { duLieuTrang.msg = { type: "error", text: "Lỗi: " + error.message }; hienThiTrang(); return; }
      duLieuTrang.msg = { type: "ok", text: "Nếu email này đã đăng ký, chúng tôi đã gửi link đặt lại mật khẩu — kiểm tra hộp thư (kể cả mục Spam)." };
      hienThiTrang();
    };
    document.getElementById("fBackToSignin").onclick = () => { duLieuTrang.forgotMode = false; duLieuTrang.msg = null; hienThiTrang(); };
    return;
  }

  const isStaffSignup = duLieuTrang.tab === 'signup' && duLieuTrang.staffMode;
  phanTuGoc.innerHTML = `
    <span class="eyebrow">Tài khoản khách hàng</span>
    <h1 class="page-title">Đăng nhập / Đăng ký</h1>
    <p class="lead" style="margin-bottom:20px">Cần có tài khoản để đặt hàng và theo dõi đơn mua.</p>
    <div class="panel auth-panel">
      <div class="auth-tabs">
        <div class="auth-tab ${duLieuTrang.tab==='signin'?'active':''}" data-tab="signin">Đăng nhập</div>
        <div class="auth-tab ${duLieuTrang.tab==='signup'?'active':''}" data-tab="signup">Đăng ký</div>
      </div>
      ${duLieuTrang.msg ? `<div class="msg ${duLieuTrang.msg.type}">${duLieuTrang.msg.text}</div>` : ''}
      ${duLieuTrang.tab === 'signup' ? `
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--steel);margin:2px 0 14px;cursor:pointer">
          <input type="checkbox" id="fStaffMode" ${duLieuTrang.staffMode?'checked':''}/> Tôi là nhân viên ABA, đăng ký tài khoản nhân viên
        </label>
        <div class="field"><label class="field-label">Họ tên</label><input id="fName" /></div>
      ` : ''}
      <div class="field"><label class="field-label">Email</label><input id="fEmail" type="email" /></div>
      <div class="field"><label class="field-label">Mật khẩu</label><input id="fPassword" type="password" /></div>
      ${duLieuTrang.tab === 'signup' && !isStaffSignup ? `<div class="field"><label class="field-label">Số điện thoại *</label><input id="fPhone" type="tel" placeholder="Bắt buộc — để ABA liên hệ xác nhận đơn hàng"/></div>` : ''}
      ${isStaffSignup ? `
        <div class="field"><label class="field-label">Vị trí xin cấp quyền</label>
          <select id="fRole" style="width:100%">
            <option value="sales">Kinh doanh</option>
            <option value="warehouse">Thủ kho</option>
          </select>
        </div>
        <div class="field"><label class="field-label">Ghi chú (mã nhân viên nội bộ, phòng ban, người quản lý...)</label><input id="fNote" placeholder="Giúp Admin xác minh nhanh hơn"/></div>
        <p style="font-size:12px;color:var(--steel);margin:-6px 0 14px">Yêu cầu sẽ được gửi tới Admin duyệt. Tài khoản của bạn <b>chưa có quyền truy cập khu vực nhân viên</b> cho tới khi được duyệt.</p>
      ` : ''}
      <button class="btn" id="fSubmit">${duLieuTrang.tab === 'signin' ? 'Đăng nhập' : (isStaffSignup ? 'Gửi yêu cầu đăng ký nhân viên' : 'Đăng ký')}</button>
      ${duLieuTrang.tab === 'signin' ? `<p class="acc-edit-link" id="fForgotLink" style="margin-top:14px;display:inline-block">Quên mật khẩu?</p>` : ''}
    </div>
  `;
  ganSuKienDangNhap();
  const forgotLink = document.getElementById("fForgotLink");
  if (forgotLink) forgotLink.onclick = () => { duLieuTrang.forgotMode = true; duLieuTrang.msg = null; hienThiTrang(); };
}

function hienThiTaiKhoan() {
  const k = chiSoTongQuanDon();
  // 5 nhóm chính (theo redesign) — gọn, đủ dùng cho phần lớn nhu cầu hằng ngày.
  // "Đơn đặt trong ngày" là bộ lọc dùng thường xuyên (kiểm tra đơn mới mỗi ngày) nên đưa thẳng ra
  // hàng chip chính, không bắt phải mở "Bộ lọc nâng cao" mới thấy như trước.
  const primaryChips = [["today","Hôm nay"],["grp_awaiting","Chờ xử lý"],["shipped","Đang giao"],["completed","Hoàn tất"],["cancelled","Đã hủy"],["all","Tất cả"]];
  // Đầy đủ toàn bộ trạng thái gốc (không đổi) — gấp trong "Bộ lọc nâng cao" cho ai cần lọc chi tiết.
  const advancedChips = [["today","Đơn đặt trong ngày"], ...CAC_TRANG_THAI.map(k => [k, NHAN_TRANG_THAI_DON[k]]), ["all","Tất cả"]];
  phanTuGoc.style.maxWidth = "1200px";
  phanTuGoc.innerHTML = `
    <span class="eyebrow">Tài khoản của bạn</span>
    <h1 class="acc-page-title">Xin chào${maHoaHtml(duLieuTrang.customer?.ho_ten) ? ', ' + maHoaHtml(duLieuTrang.customer.ho_ten).split(' ').pop() : ''} 👋</h1>
    <p class="acc-subtext">Quản lý đơn hàng và các yêu cầu hỗ trợ của bạn.</p>
    ${duLieuTrang.signupRequest ? hienThiThongBaoDangKyNhanVien(duLieuTrang.signupRequest) : ''}

    <div class="acc-kpi-grid">
      <div class="acc-kpi-card c-blue"><span class="kpi-icon">📦</span><div><div class="kpi-value">${k.total}</div><div class="kpi-label">Tổng đơn hàng</div></div></div>
      <div class="acc-kpi-card c-ok"><span class="kpi-icon">💰</span><div><div class="kpi-value">${dinhDangTien(k.spent)}</div><div class="kpi-label">Tổng chi tiêu</div></div></div>
      <div class="acc-kpi-card c-amber"><span class="kpi-icon">⏳</span><div><div class="kpi-value">${k.pending}</div><div class="kpi-label">Đang xử lý</div></div></div>
    </div>

    <div class="acc-two-col">
      <div class="panel" id="thong-bao">${hienThiThongBao()}</div>
      <div class="panel">${hienThiTheHoSo()}</div>
    </div>

    ${duLieuTrang.myRequests.length > 0 ? `<div class="panel" id="yeu-cau" style="margin-bottom:20px">${hienThiYeuCauCuaToi()}</div>` : ''}

    <div class="acc-list-title"><p>Đơn hàng của tôi</p></div>
    ${duLieuTrang.orders.length > 0 ? `
      <div class="acc-filter-chips">${primaryChips.map(([v,l]) => `<div class="acc-chip ${duLieuTrang.statusFilter===v?'active':''}" data-status-filter="${v}">${l}</div>`).join("")}</div>
      <p class="acc-advanced-toggle" id="btnToggleAdvanced">${duLieuTrang.advancedFilterOpen ? '▲ Ẩn bộ lọc nâng cao' : '▾ Bộ lọc nâng cao'}</p>
      ${duLieuTrang.advancedFilterOpen ? `
        <div class="acc-advanced-panel">
          <div class="acc-filter-chips">${advancedChips.map(([v,l]) => `<div class="acc-chip small ${duLieuTrang.statusFilter===v?'active':''}" data-status-filter="${v}">${l}</div>`).join("")}</div>
        </div>` : ''}
    ` : ''}
    ${duLieuTrang.orders.length === 0
      ? `<div class="panel acc-empty"><span class="big">📭</span><h3>Chưa có đơn hàng</h3><p>Bạn chưa từng đặt đơn hàng nào tại ABA Technical.</p><div class="row"><a href="danh-muc.html" class="btn">Khám phá sản phẩm →</a></div></div>`
      : donHangDaLoc().length === 0
        ? `<div class="panel acc-empty"><span class="big">🔎</span><h3>Chưa có đơn hàng</h3><p>Bạn chưa có đơn hàng nào ở trạng thái này.</p><div class="row"><button class="btn ghost" id="btnShowAllOrders" type="button">Xem tất cả đơn hàng</button><a href="danh-muc.html" class="btn">Khám phá sản phẩm →</a></div></div>`
        : donHangDaLoc().map(hienThiTheDonHang).join("")}
    ${duLieuTrang.myRequestDetailId ? hienThiHopChiTietYeuCau() : ''}
    ${duLieuTrang.editingProfile ? hienThiHopSuaHoSo() : ''}
    ${duLieuTrang.actionMsg ? `<div class="toast" style="border-left-color:${duLieuTrang.actionMsg.type === 'error' ? 'var(--danger)' : 'var(--ok)'}">${duLieuTrang.actionMsg.text}</div>` : ''}
  `;
  ganSuKienTaiKhoan();
}

hanhDong.hienThiTrang = hienThiTrang;
hanhDong.hienThiTaiKhoan = hienThiTaiKhoan;
