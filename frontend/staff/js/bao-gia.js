/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)  — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   * Điểm vào trang Báo giá/Yêu cầu: chạy (async () => ...) gọi batBuocNhanVien rồi nạp dữ liệu và vẽ trang (logic nằm trong thư mục bao-gia/).
   ========================================================================== */
// Logic trang staff/bao-gia.html — QUẢN LÝ YÊU CẦU KHÁCH HÀNG (trước đây chỉ là "Xử lý Báo giá").
// Đổi hướng theo góp ý thực tế: khách liên hệ ABA không chỉ để hỏi báo giá, mà còn hỏi sản phẩm,
// khuyến mãi, tình trạng hàng, bảo hành, khiếu nại, tư vấn kỹ thuật... Báo giá chỉ là 1 loại yêu cầu
// trong nhiều loại. Giữ nguyên tên file/đường dẫn (bao-gia.html) để không phá vỡ liên kết sidebar/badge
// đã có, chỉ đổi toàn bộ nội dung + logic nghiệp vụ.
// Trang được chia thành các module nhỏ trong thư mục ./bao-gia/ (state, nhan, data, bao-hanh, trao-doi, giao-dien, su-kien);
// file này chỉ giữ phần khởi tạo.
import { batBuocNhanVien, layHuyHieuThanhBen } from "../nhan-vien-chung.js";
import { phanTuGoc, nguCanh, datHuyHieu, datNguCanh, hanhDong } from "./bao-gia/du-lieu-trang.js";
import { taiDonDaThanhToan, taiSanPhamGoiY, taiYeuCau, taiBanDoNhanVien } from "./bao-gia/tai-du-lieu.js";
import "./bao-gia/giao-dien.js"; // đăng ký actions
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

(async () => {
  datNguCanh(await batBuocNhanVien(phanTuGoc, { requireRole: ['sales', 'warehouse', 'admin'], activePage: "bao-gia.html" }));
  if (!nguCanh) return;
  datHuyHieu(await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff));
  await Promise.all([taiBanDoNhanVien(), taiSanPhamGoiY(), taiDonDaThanhToan()]);
  hienThiTrang();
  taiYeuCau();
})();
