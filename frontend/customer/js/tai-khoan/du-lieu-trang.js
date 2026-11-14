/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/du-lieu-trang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   datKenhDonHang(v)  [export]  — Lưu kênh realtime đơn hàng để hủy/đăng ký lại
   * Export duLieuTrang (trạng thái trang) và hanhDong (cầu nối giữa module, tránh import vòng).
   ========================================================================== */
// Khởi tạo và trạng thái dùng chung của trang Tài khoản (customer/tai-khoan.html): cấu hình, client Supabase, state. Các module trong thư mục này cùng import từ đây.
import { chuyenGioHangCu } from "../../../js/dung-chung/luu-gio-hang.js";
import { supabase, daCauHinh } from "../../../js/dung-chung/ket-noi-supabase.js";
export const phanTuGoc = document.getElementById("root");
if (!daCauHinh) {
  phanTuGoc.innerHTML = `<div class="panel" style="background:#fdf1e1;border-left:4px solid #e2810f">Chưa cấu hình config.js</div>`;
  throw new Error("config chưa sẵn sàng");
}
export { supabase };
chuyenGioHangCu();
export const thamSoTiepTheo = new URLSearchParams(window.location.search).get("next");
export const duLieuTrang = { session: null, tab: "signin", msg: null, orders: [], customer: null, staffInfo: null, staffMode: false,
  signupRequest: null, statusFilter: "today", expandedOrderId: null, orderItemsCache: {}, editingProfile: false,
  profileSaving: false, reorderingId: null, actionMsg: null, resetMode: false, forgotMode: false,
  notifications: [], myRequests: [],
  myRequestsExpanded: false, myRequestDetailId: null, requestMessagesCache: {}, notifExpanded: false, advancedFilterOpen: false,
  orderHistoryCache: {} };
// ---- Realtime: tự đồng bộ khi nhân viên đổi trạng thái đơn hàng, không cần khách tự tải lại
// trang. Chỉ lắng nghe đúng đơn hàng của CHÍNH khách này (nhờ RLS chặn sẵn — dù có nghe "tất cả"
// thì Supabase cũng tự lọc chỉ gửi về những dòng khách này có quyền SELECT theo policy hiện có,
// nhưng vẫn lọc thêm ở filter cho rõ ràng & đỡ tốn băng thông không cần thiết). ----
export let kenhDonHang = null;
export function datKenhDonHang(v) { kenhDonHang = v; }

// Đăng ký hàm vẽ lại/điều phối để các module gọi lẫn nhau mà không import vòng.
export const hanhDong = {};
