/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)        — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   theoDoiDonHangTrucTiep()  — Đăng ký kênh realtime của đơn hàng; có thay đổi thì tải lại
   * Điểm vào trang Đơn hàng: (async () => ...) gọi batBuocNhanVien (sales, admin) rồi nạp và vẽ; logic nằm trong thư mục don-hang/.
   ========================================================================== */
// Logic trang staff/don-hang.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
// Trang được chia thành các module nhỏ trong thư mục ./don-hang/ (state, constants, helpers, data, giao-dien, su-kien,
// hop-thoai, giao-hang, in-xuat); file này chỉ giữ phần khởi tạo và đăng ký realtime.
import { batBuocNhanVien, layHuyHieuThanhBen, hienThongBaoNhanh } from "../nhan-vien-chung.js";
import { phanTuGoc, nguCanh, duLieuTrang, kenhDonHang, datNguCanh, datHuyHieu, datBanDoNhanVien, datKenhDonHang, hanhDong } from "./don-hang/du-lieu-trang.js";
import { taiDonHang, taiLichSuDon } from "./don-hang/tai-du-lieu.js";
import "./don-hang/giao-dien.js"; // đăng ký actions
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

(async () => {
  datNguCanh(await batBuocNhanVien(phanTuGoc, { requireRole: ['sales', 'admin'], activePage: "don-hang.html" }));
  if (!nguCanh) return;
  datHuyHieu(await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff));
  const { data: staffRows } = await nguCanh.supabase.from("ho_so_nhan_vien").select("id, ho_ten");
  datBanDoNhanVien(Object.fromEntries((staffRows || []).map(s => [s.id, s.ho_ten])));
  // Danh sách kho — dùng để tự động ghi giao dịch trả kho khi khách từ chối/nhận thiếu hàng.
  const { data: whRows } = await nguCanh.supabase.from("kho").select("id, ten").order("ngay_tao");
  duLieuTrang.warehouses = whRows || [];
  hienThiTrang();
  await taiDonHang();
  // Từ trang "Yêu cầu khách hàng" bấm "Mở đơn →": tự mở sẵn đơn tương ứng.
  const deepId = new URLSearchParams(location.search).get("order");
  if (deepId && duLieuTrang.orders.some(o => o.id === deepId)) {
    duLieuTrang.expanded = deepId;
    await taiLichSuDon(deepId);
    setTimeout(() => document.querySelector(".expand-row")?.scrollIntoView({ block: "center" }), 100);
  }
  theoDoiDonHangTrucTiep();
})();

function theoDoiDonHangTrucTiep() {
  if (kenhDonHang) nguCanh.supabase.removeChannel(kenhDonHang);
  datKenhDonHang(nguCanh.supabase
    .channel("staff-orders-watch")
    .on("postgres_changes", { event: "*", schema: "public", table: "don_hang" }, (payload) => {
      taiDonHang();
      if (payload.eventType === "INSERT") hienThongBaoNhanh("🔔 Có đơn hàng mới vừa được đặt!");
      else if (payload.eventType === "UPDATE" && payload.new?.trang_thai === "cancelled" && payload.old?.trang_thai !== "cancelled" && payload.new?.nguoi_huy === "customer") {
        hienThongBaoNhanh("🚫 Khách hàng vừa tự hủy 1 đơn hàng.");
      }
    })
    .subscribe());
}

window.addEventListener("beforeunload", () => { if (kenhDonHang && nguCanh) nguCanh.supabase.removeChannel(kenhDonHang); });
