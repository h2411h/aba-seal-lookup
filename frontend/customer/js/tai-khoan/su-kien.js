/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/su-kien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)   — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   ganSuKienTaiKhoan()  [export]  — Gắn sự kiện cho trang tài khoản (đăng xuất, đánh dấu đã đọc, sửa hồ sơ...)
   ganSuKienDangNhap()  [export]  — ★ Gắn sự kiện form đăng nhập/đăng ký (signInWithPassword, signUp, ghi khach_hang hoặc yeu_cau_dang_ky_nhan_vien)
   ========================================================================== */
// Gắn sự kiện: các thao tác sau khi đăng nhập (hồ sơ, đơn hàng, yêu cầu, thông báo) và đăng nhập/đăng ký/quên mật khẩu.
import { supabase, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { huyDon, muaLaiDon, moRongDon } from "./don-hang.js";
import { danhDauTatCaDaDoc, danhDauThongBaoDaDoc } from "./thong-bao.js";
import { taiTinNhanYeuCau, guiTinNhanTiep } from "./yeu-cau.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

export function ganSuKienTaiKhoan() {
  document.getElementById("btnSignOut").onclick = async () => { await supabase.auth.signOut(); };

  const btnMarkAllRead = document.getElementById("btnMarkAllRead");
  if (btnMarkAllRead) btnMarkAllRead.onclick = danhDauTatCaDaDoc;
  document.querySelectorAll("[data-notif]").forEach(el => {
    el.onclick = () => danhDauThongBaoDaDoc(el.getAttribute("data-notif"));
  });
  const btnToggleNotif = document.getElementById("btnToggleNotif");
  if (btnToggleNotif) btnToggleNotif.onclick = () => { duLieuTrang.notifExpanded = !duLieuTrang.notifExpanded; hienThiTrang(); };

  const btnToggleRequests = document.getElementById("btnToggleRequests");
  if (btnToggleRequests) btnToggleRequests.onclick = () => { duLieuTrang.myRequestsExpanded = !duLieuTrang.myRequestsExpanded; hienThiTrang(); };
  document.querySelectorAll("[data-request-detail]").forEach(el => {
    el.onclick = async () => { duLieuTrang.myRequestDetailId = el.getAttribute("data-request-detail"); await taiTinNhanYeuCau(duLieuTrang.myRequestDetailId); hienThiTrang(); };
  });
  const closeRequestDetail = document.getElementById("closeRequestDetail");
  if (closeRequestDetail) closeRequestDetail.onclick = () => { duLieuTrang.myRequestDetailId = null; hienThiTrang(); };
  const btnRequestFollowup = document.getElementById("btnRequestFollowup");
  if (btnRequestFollowup) btnRequestFollowup.onclick = () => guiTinNhanTiep(duLieuTrang.myRequestDetailId);
  const requestDetailBg = document.getElementById("requestDetailBg");
  if (requestDetailBg) requestDetailBg.onclick = (e) => { if (e.target.id === "requestDetailBg") { duLieuTrang.myRequestDetailId = null; hienThiTrang(); } };
  const editProfileBg = document.getElementById("editProfileBg");
  if (editProfileBg) editProfileBg.onclick = (e) => { if (e.target.id === "editProfileBg") { duLieuTrang.editingProfile = false; hienThiTrang(); } };

  const pfEdit = document.getElementById("pfEdit");
  if (pfEdit) pfEdit.onclick = () => { duLieuTrang.editingProfile = true; hienThiTrang(); };
  const pfCancel = document.getElementById("pfCancel");
  if (pfCancel) pfCancel.onclick = () => { duLieuTrang.editingProfile = false; hienThiTrang(); };
  const pfSave = document.getElementById("pfSave");
  if (pfSave) pfSave.onclick = async () => {
    const ho_ten = document.getElementById("pfName").value.trim();
    const so_dien_thoai = document.getElementById("pfPhone").value.trim();
    const ten_cong_ty = document.getElementById("pfCompany").value.trim();
    const dia_chi_mac_dinh = document.getElementById("pfAddress").value.trim();
    duLieuTrang.profileSaving = true; hienThiTrang();
    try {
      const payload = { ho_ten, so_dien_thoai, ten_cong_ty: ten_cong_ty || null, dia_chi_mac_dinh };
      const { error } = duLieuTrang.customer
        ? await supabase.from("khach_hang").update(payload).eq("id", duLieuTrang.session.user.id)
        : await supabase.from("khach_hang").insert({ id: duLieuTrang.session.user.id, ...payload });
      if (error) throw error;
      duLieuTrang.customer = { ...(duLieuTrang.customer || {}), ...payload };
      duLieuTrang.editingProfile = false;
      duLieuTrang.actionMsg = { type: "ok", text: "Đã lưu hồ sơ." };
    } catch (err) {
      duLieuTrang.actionMsg = { type: "error", text: "Lỗi lưu hồ sơ: " + (err?.message || err) };
    }
    duLieuTrang.profileSaving = false;
    hienThiTrang();
    setTimeout(() => { duLieuTrang.actionMsg = null; hienThiTrang(); }, 3000);
  };

  const btnToggleAdvanced = document.getElementById("btnToggleAdvanced");
  if (btnToggleAdvanced) btnToggleAdvanced.onclick = () => { duLieuTrang.advancedFilterOpen = !duLieuTrang.advancedFilterOpen; hienThiTrang(); };
  const btnShowAllOrders = document.getElementById("btnShowAllOrders");
  if (btnShowAllOrders) btnShowAllOrders.onclick = () => { duLieuTrang.statusFilter = "all"; hienThiTrang(); };
  document.querySelectorAll("[data-status-filter]").forEach(el => { el.onclick = () => { duLieuTrang.statusFilter = el.getAttribute("data-status-filter"); hienThiTrang(); }; });
  document.querySelectorAll("[data-order-toggle]").forEach(el => { el.onclick = () => moRongDon(el.getAttribute("data-order-toggle")); });
  document.querySelectorAll("[data-reorder]").forEach(el => { el.onclick = (e) => { e.stopPropagation(); muaLaiDon(el.getAttribute("data-reorder")); }; });
  document.querySelectorAll("[data-cancel-order]").forEach(el => { el.onclick = (e) => { e.stopPropagation(); huyDon(el.getAttribute("data-cancel-order")); }; });
}

export function ganSuKienDangNhap() {
  document.querySelectorAll("[data-tab]").forEach(el => { el.onclick = () => { duLieuTrang.tab = el.getAttribute("data-tab"); duLieuTrang.msg = null; hienThiTrang(); }; });

  const staffModeEl = document.getElementById("fStaffMode");
  if (staffModeEl) staffModeEl.onchange = (e) => { duLieuTrang.staffMode = e.target.checked; hienThiTrang(); };

  document.getElementById("fSubmit").onclick = async () => {
    const email = document.getElementById("fEmail").value.trim();
    const password = document.getElementById("fPassword").value;
    if (!email || !password) { duLieuTrang.msg = { type: "error", text: "Vui lòng nhập email và mật khẩu" }; hienThiTrang(); return; }

    if (duLieuTrang.tab === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { duLieuTrang.msg = { type: "error", text: "Lỗi: " + error.message }; hienThiTrang(); return; }
      return;
    }

    const fullName = document.getElementById("fName").value.trim();
    if (!fullName) { duLieuTrang.msg = { type: "error", text: "Vui lòng nhập họ tên" }; hienThiTrang(); return; }

    let so_dien_thoai = "";
    if (!duLieuTrang.staffMode) {
      so_dien_thoai = document.getElementById("fPhone").value.trim();
      if (!so_dien_thoai) { duLieuTrang.msg = { type: "error", text: "Vui lòng nhập số điện thoại — bắt buộc để chúng tôi liên hệ xác nhận đơn hàng" }; hienThiTrang(); return; }
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      duLieuTrang.msg = { type: "error", text: error.message.includes("rate limit")
        ? "Hệ thống đang giới hạn gửi email xác nhận. Nếu quản trị viên đã tắt 'Confirm email' trong Supabase, vui lòng thử lại sau ít phút."
        : "Lỗi: " + error.message };
      hienThiTrang(); return;
    }

    if (data.user) {
      if (duLieuTrang.staffMode) {
        const requestedRole = document.getElementById("fRole").value;
        const ghi_chu = document.getElementById("fNote").value.trim();
        const { error: reqErr } = await supabase.from("yeu_cau_dang_ky_nhan_vien").insert({
          tai_khoan_id: data.user.id, email, ho_ten: fullName, vai_tro_de_xuat: requestedRole, ghi_chu: ghi_chu || null
        });
        if (reqErr) console.error("Lỗi gửi yêu cầu nhân viên:", reqErr);
      } else {
        await supabase.from("khach_hang").insert({ id: data.user.id, ho_ten: fullName, so_dien_thoai });
      }
    }

    // Nếu project đã tắt "Confirm email", data.session sẽ có sẵn và tự đăng nhập luôn
    if (!data.session) {
      duLieuTrang.msg = { type: "ok", text: duLieuTrang.staffMode
        ? "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận, sau đó chờ Admin duyệt yêu cầu nhân viên."
        : "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận trước khi đăng nhập." };
      duLieuTrang.tab = "signin"; duLieuTrang.staffMode = false; hienThiTrang(); return;
    }
  };
}
