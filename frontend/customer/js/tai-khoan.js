/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)  — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   * Điểm vào trang tài khoản: nối các module trong tai-khoan/, lấy phiên bằng getSession rồi gọi xuLyPhien; lắng nghe onAuthStateChange.
   ========================================================================== */
// Logic trang tai-khoan.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
// Trang được chia thành các module nhỏ trong thư mục ./tai-khoan/ (state, toast, anh-dai-dien, ho-so, don-hang, yeu-cau,
// thong-bao, giao-dien, su-kien, phien); file này chỉ giữ phần khởi động.
import { supabase, duLieuTrang, kenhDonHang, hanhDong } from "./tai-khoan/du-lieu-trang.js";
import { xuLyPhien } from "./tai-khoan/phien.js";
import "./tai-khoan/giao-dien.js"; // đăng ký actions
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

supabase.auth.getSession().then(({ data }) => xuLyPhien(data.session));

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") { duLieuTrang.resetMode = true; duLieuTrang.msg = null; hienThiTrang(); return; }
  xuLyPhien(session);
});

window.addEventListener("beforeunload", () => { if (kenhDonHang) supabase.removeChannel(kenhDonHang); });
