// Cập nhật số lượng hiển thị trên icon giỏ hàng ở header, dựa trên giỏ hàng lưu tạm trong
// localStorage — dùng cho các trang KHÔNG có sẵn logic giỏ hàng riêng (index.html, ve-aba.html).
import { chuyenGioHangCu, capNhatSoGioHangTrenMenu } from "./luu-gio-hang.js";
import { supabase, daCauHinh } from "./ket-noi-supabase.js";

(async () => {
  try {
    chuyenGioHangCu();
    const el = document.getElementById("navCartBadge");
    if (!el || !daCauHinh) return;
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    capNhatSoGioHangTrenMenu(session);
  } catch (e) { /* bỏ qua, không chặn tải trang */ }
})();
