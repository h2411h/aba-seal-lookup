/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/chan-nhan-vien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   chuyenNhanVienVeKhuNoiBo(duongDanDashboard)  [export async]  — Nếu người dùng là nhân viên đang mở trang khách thì đưa về dashboard
   ========================================================================== */
// ============================================================
// chan-nhan-vien.js — Tài khoản NHÂN VIÊN chỉ được dùng khu vực nhân viên.
//
// Nhân viên mở trang của khách (danh mục, giỏ hàng, liên hệ...) thì tự chuyển về Trang chủ nhân viên,
// nên không thể thêm giỏ hàng hay đặt hàng như khách. Muốn mua hàng phải dùng tài khoản khách riêng.
//
// Ai là nhân viên? Có dòng trong bảng ho_so_nhan_vien và chưa nghỉ việc (dang_lam_viec không phải false).
// Nhân viên đã nghỉ việc hoặc đang chờ duyệt vẫn là khách bình thường.
// ============================================================
import { supabase, daCauHinh } from "./ket-noi-supabase.js";

export async function chuyenNhanVienVeKhuNoiBo(duongDanDashboard) {
  if (!daCauHinh) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // chưa đăng nhập: là khách vãng lai, cho xem bình thường
    const { data: nhanVien } = await supabase.from("ho_so_nhan_vien")
      .select("dang_lam_viec").eq("id", session.user.id).maybeSingle();
    if (nhanVien && nhanVien.dang_lam_viec !== false) window.location.replace(duongDanDashboard);
  } catch (e) { /* lỗi mạng: bỏ qua, không chặn trang khách */ }
}
