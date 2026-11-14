/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/trang-chung.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiThongBaoGioLamViec()       [export]  — Thông báo tĩnh về giờ làm việc và xác nhận đơn
   hienThongBaoNhanh(message)        [export]  — Hiện toast thông báo ở góc màn hình
   chuyenDenDangNhap(trangTiepTheo)  [export]  — Chuyển khách chưa đăng nhập sang trang tài khoản, đăng nhập xong quay lại
   ========================================================================== */
// Hàm dùng chung cho các trang khách hàng.

export const KHUNG_GIO_LAM_VIEC = {
  openHour: 7,
  openMinute: 30,
  closeHour: 17,
  closeMinute: 30
};

// Thông báo tĩnh: đơn đặt lúc nào cũng được ghi nhận, nhân viên sẽ gọi xác nhận trong giờ làm việc.
export function hienThiThongBaoGioLamViec() {
  return `<div class="gh-hours-notice">ℹ️ Giờ làm việc: 7h30–17h30. Đơn đặt ngoài giờ vẫn được ghi nhận, cửa hàng sẽ gọi xác nhận khi vào ca.</div>`;
}

export function hienThongBaoNhanh(message) {
  const toast = document.createElement("div");
  toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:var(--graphite);color:#fff;padding:12px 18px;border-radius:4px;font-size:13px;border-left:3px solid var(--amber);z-index:var(--z-toast)";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Chuyển khách chưa đăng nhập sang trang Tài khoản; đăng nhập xong sẽ tự quay lại `trangTiepTheo`
// (xem thamSoTiepTheo trong customer/js/tai-khoan/du-lieu-trang.js). Dùng được ở mọi trang trong thư mục customer/.
export function chuyenDenDangNhap(trangTiepTheo) {
  window.location.href = "tai-khoan.html?next=" + encodeURIComponent(trangTiepTheo);
}
