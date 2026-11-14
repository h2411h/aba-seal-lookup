/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/dong-bo-gio-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   dongBoGioHangLenMayChu(supabase, session, cart)  [export async]  — Đồng bộ ngầm giỏ lên bảng gio_hang (chỉ ghi lên, không đọc lại)
   ========================================================================== */
// Đồng bộ giỏ hàng (localStorage) lên bảng cart_items phía server cho khách đã đăng nhập.
// Mục đích: giữ lại giỏ hàng qua nhiều thiết bị/phiên, làm nền cho gợi ý sản phẩm liên quan và
// thông báo khi sản phẩm trong giỏ giảm giá (xem trigger notify_cart_price_drop trong Supabase).
// Không chặn UI — chạy ngầm, lỗi thì bỏ qua (giỏ hàng local vẫn là nguồn dữ liệu chính, luôn hoạt động).

import { damBaoCoKhachHang } from "./dam-bao-khach-hang.js";

export async function dongBoGioHangLenMayChu(supabase, session, cart) {
  if (!session) return;
  try {
    // gio_hang.khach_hang_id là khóa ngoại tới khach_hang -> phải có hồ sơ khách trước
    const customer = await damBaoCoKhachHang(supabase, session);
    if (!customer) return;
    const entries = Object.values(cart || {});
    const { data: existing } = await supabase.from("gio_hang").select("id, san_pham_id").eq("khach_hang_id", session.user.id);
    const existingIds = new Set((existing || []).map(r => r.san_pham_id));
    const cartIds = new Set(entries.map(i => i.id));

    // Xoá khỏi server những món khách đã bỏ khỏi giỏ local
    const toDelete = [...existingIds].filter(id => !cartIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("gio_hang").delete().eq("khach_hang_id", session.user.id).in("san_pham_id", toDelete);
    }

    // Thêm/cập nhật từng món — giữ nguyên gia_tai_thoi_diem cũ nếu đã có (để không mất mốc giá phát hiện giảm giá),
    // chỉ ghi gia_tai_thoi_diem mới cho sản phẩm lần đầu được thêm vào giỏ.
    for (const item of entries) {
      if (existingIds.has(item.id)) {
        await supabase.from("gio_hang").update({ so_luong: item.qty, ngay_cap_nhat: new Date().toISOString() })
          .eq("khach_hang_id", session.user.id).eq("san_pham_id", item.id);
      } else {
        await supabase.from("gio_hang").insert({
          khach_hang_id: session.user.id, san_pham_id: item.id, so_luong: item.qty,
          gia_tai_thoi_diem: item.gia_le_vnd || 0
        });
      }
    }
  } catch (e) {
    console.error("Lỗi đồng bộ giỏ hàng lên server (bỏ qua, giỏ local vẫn hoạt động bình thường):", e);
  }
}
