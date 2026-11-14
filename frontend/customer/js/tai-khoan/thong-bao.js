/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/thong-bao.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)                  — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   hienThiThongBao()                   [export]  — Vẽ khu thông báo của khách (đếm chưa đọc, xem thêm)
   hienThiThongBaoDangKyNhanVien(req)  [export]  — Vẽ thẻ trạng thái yêu cầu đăng ký nhân viên (đang chờ duyệt...)
   nhanVaiTroTaiCho(r)                 — Đổi mã vai trò sang tên tiếng Việt
   taiThongBao()                       [export async]  — Tải thông báo của khách từ bảng thong_bao
   danhDauThongBaoDaDoc(id)            [export async]  — Đánh dấu 1 thông báo đã đọc
   danhDauTatCaDaDoc()                 [export async]  — Đánh dấu tất cả thông báo đã đọc
   kiemTraNhanVien(session)            [export async]  — ★ Kiểm tra tài khoản có phải nhân viên ĐANG LÀM không (ho_so_nhan_vien); đã nghỉ việc coi như khách
   kiemTraYeuCauDangKy(session)        [export async]  — Lấy yêu cầu đăng ký nhân viên của tài khoản (nếu có)
   ========================================================================== */
// Thông báo của khách và các thông báo liên quan tài khoản nhân viên (kiểm tra vai trò, yêu cầu đăng ký nhân viên).
import { supabase, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

export function hienThiThongBao() {
  const unreadCount = duLieuTrang.notifications.filter(n => !n.da_doc).length;
  const showAll = duLieuTrang.notifExpanded;
  const list = showAll ? duLieuTrang.notifications.slice(0, 15) : duLieuTrang.notifications.slice(0, 3);
  return `
    <div class="acc-list-title">
      <p>🔔 Thông báo${unreadCount > 0 ? ` <span style="color:var(--amber)">(${unreadCount} mới)</span>` : ''}</p>
      ${unreadCount > 0 ? `<span class="gh-clear-link" id="btnMarkAllRead">Đánh dấu đã đọc hết</span>` : ''}
    </div>
    ${duLieuTrang.notifications.length === 0 ? `<p style="font-size:13px;color:var(--steel);margin:0">Chưa có thông báo nào.</p>` : `
      <div style="max-height:${showAll ? '340px' : 'none'};overflow-y:${showAll ? 'auto' : 'visible'}">
        ${list.map(n => `
        <div data-notif="${n.id}" class="acc-notif-item ${n.da_doc ? 'read' : 'unread'}">
          <span class="ic">${n.da_doc ? '🔔' : '🟠'}</span>
          <div style="min-width:0">
            <p class="acc-notif-msg">${maHoaHtml(n.noi_dung_thong_bao)}</p>
            <p class="acc-notif-time">${new Date(n.ngay_tao).toLocaleString("vi-VN")}</p>
          </div>
        </div>`).join("")}
      </div>
      ${duLieuTrang.notifications.length > 3 ? `<p class="gh-clear-link" id="btnToggleNotif" style="margin:10px 0 0;text-align:center">${showAll ? 'Thu gọn ▲' : `Xem tất cả (${duLieuTrang.notifications.length}) →`}</p>` : ''}
    `}
  `;
}

export function hienThiThongBaoDangKyNhanVien(req) {
  if (req.trang_thai === 'pending') {
    return `<div class="panel" style="background:#eef4fb;border-color:var(--blueprint);margin-bottom:16px">
      <p style="margin:0;font-size:13.5px"><b>⏳ Yêu cầu cấp quyền nhân viên (${nhanVaiTroTaiCho(req.vai_tro_de_xuat)}) đang chờ Quản trị viên duyệt.</b></p>
      <p style="margin:6px 0 0;font-size:12.5px;color:var(--steel)">Gửi lúc ${new Date(req.ngay_tao).toLocaleString("vi-VN")}. Bạn sẽ dùng được khu vực nhân viên ngay sau khi được duyệt — không cần đăng ký lại.</p>
    </div>`;
  }
  if (req.trang_thai === 'rejected') {
    return `<div class="panel" style="background:#fdeeee;border-color:#c0392b;margin-bottom:16px">
      <p style="margin:0;font-size:13.5px"><b>❌ Yêu cầu cấp quyền nhân viên đã bị từ chối.</b></p>
      <p style="margin:6px 0 0;font-size:12.5px;color:var(--steel)">Liên hệ Quản trị viên nếu bạn cho rằng đây là nhầm lẫn.</p>
    </div>`;
  }
  return '';
}

function nhanVaiTroTaiCho(r) {
  return { sales: 'Kinh doanh', warehouse: 'Thủ kho', admin: 'Quản trị viên' }[r] || r;
}

export async function taiThongBao() {
  const { data } = await supabase.from("thong_bao").select("*").order("ngay_tao", { ascending: false }).limit(30);
  const wasEmpty = duLieuTrang.notifications.length === 0;
  duLieuTrang.notifications = data || [];
  hienThiTrang();
  if (wasEmpty && duLieuTrang.notifications.length > 0 && window.location.hash === "#thong-bao") {
    setTimeout(() => document.getElementById("thong-bao")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
}

export async function danhDauThongBaoDaDoc(id) {
  await supabase.from("thong_bao").update({ da_doc: true }).eq("id", id);
  const n = duLieuTrang.notifications.find(x => x.id === id);
  if (n) n.da_doc = true;
  hienThiTrang();
  if (n?.duong_dan) {
    const anchor = n.duong_dan.split("#")[1];
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
}

export async function danhDauTatCaDaDoc() {
  const unread = duLieuTrang.notifications.filter(n => !n.da_doc);
  if (unread.length === 0) return;
  await supabase.from("thong_bao").update({ da_doc: true }).in("id", unread.map(n => n.id));
  duLieuTrang.notifications.forEach(n => n.da_doc = true);
  hienThiTrang();
}

// Kiểm tra tài khoản này có phải nhân viên ĐANG LÀM không. Nhân viên đã nghỉ việc coi như khách thường
// (cùng quy tắc với js/dung-chung/chan-nhan-vien.js).
export async function kiemTraNhanVien(session) {
  try {
    const { data, error } = await supabase.from("ho_so_nhan_vien").select("vai_tro, dang_lam_viec").eq("id", session.user.id).maybeSingle();
    if (error) { console.error("Lỗi kiểm tra ho_so_nhan_vien:", error); return null; }
    if (data && data.dang_lam_viec === false) return null;
    return data; // null nếu không phải nhân viên
  } catch (e) {
    console.error("Lỗi kiểm tra staff:", e);
    return null;
  }
}

export async function kiemTraYeuCauDangKy(session) {
  try {
    const { data } = await supabase.from("yeu_cau_dang_ky_nhan_vien").select("*").eq("tai_khoan_id", session.user.id).maybeSingle();
    return data || null;
  } catch (e) { return null; }
}
