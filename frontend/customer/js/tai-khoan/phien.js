/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/phien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)               — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   xuLyPhien(session)               [export async]  — ★ Xử lý khi đăng nhập/đăng xuất: nhân viên thì chuyển sang dashboard, khách thì tải hồ sơ, đơn, thông báo
   theoDoiDonHangTrucTiep(session)  — Đăng ký kênh realtime: đơn của khách đổi thì tự tải lại
   ========================================================================== */
// Phiên đăng nhập và cập nhật thời gian thực: xử lý session, tải dữ liệu khách, đăng ký realtime đơn hàng.
import { supabase, thamSoTiepTheo, duLieuTrang, kenhDonHang, datKenhDonHang, hanhDong } from "./du-lieu-trang.js";
import { taiDonHang, nhanTrangThaiDon } from "./don-hang.js";
import { taiHoSoKhach } from "./ho-so.js";
import { kiemTraYeuCauDangKy, kiemTraNhanVien, taiThongBao } from "./thong-bao.js";
import { hienThongBaoTrongTrang } from "./thong-bao-nhanh.js";
import { taiYeuCauCuaToi } from "./yeu-cau.js";
import { maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

export async function xuLyPhien(session) {
  duLieuTrang.session = session;
  if (!session) { hienThiTrang(); return; }
  if (duLieuTrang.resetMode) { hienThiTrang(); return; } // đang đặt lại mật khẩu — không tự chuyển hướng đi đâu cả

  duLieuTrang.staffInfo = await kiemTraNhanVien(session);
  if (duLieuTrang.staffInfo) {
    // Tài khoản nhân viên/admin: chuyển thẳng sang khu vực nhân viên, không dừng ở trang Tài khoản
    window.location.replace('../staff/dashboard.html');
    return;
  }
  // Đến từ nút "Mua hàng"/"Đặt hàng" ở trang khác, chưa đăng nhập thì bị đá về đây kèm ?next=...
  // Đăng nhập/đăng ký xong (khách hàng thường) thì tự quay lại đúng trang đó, đỡ phải tự tìm lại
  if (thamSoTiepTheo) { window.location.href = thamSoTiepTheo; return; }

  duLieuTrang.signupRequest = await kiemTraYeuCauDangKy(session);
  await taiHoSoKhach();
  await taiDonHang();
  await taiThongBao();
  await taiYeuCauCuaToi();
  theoDoiDonHangTrucTiep(session);
}

function theoDoiDonHangTrucTiep(session) {
  if (kenhDonHang) supabase.removeChannel(kenhDonHang);
  datKenhDonHang(supabase
    .channel("orders-of-customer-" + session.user.id)
    .on("postgres_changes", { event: "*", schema: "public", table: "don_hang", filter: `khach_hang_id=eq.${session.user.id}` }, (payload) => {
      const wasCancelledByStaff = payload.eventType === "UPDATE" && payload.new?.trang_thai === "cancelled" && payload.old?.trang_thai !== "cancelled" && payload.new?.nguoi_huy === "staff";
      const statusChanged = payload.eventType === "UPDATE" && payload.new?.trang_thai !== payload.old?.trang_thai;
      taiDonHang();
      if (wasCancelledByStaff) hienThongBaoTrongTrang(`🚫 Cửa hàng vừa hủy 1 đơn hàng của bạn.${maHoaHtml(payload.new.ly_do_huy) ? ' Lý do: ' + maHoaHtml(payload.new.ly_do_huy) : ''}`);
      else if (statusChanged) hienThongBaoTrongTrang(`🔔 Đơn hàng vừa được cập nhật: ${nhanTrangThaiDon(payload.new.trang_thai)}`);
      else if (payload.eventType === "INSERT") hienThongBaoTrongTrang("✅ Đơn hàng mới đã được ghi nhận.");
    })
    .subscribe());
}
