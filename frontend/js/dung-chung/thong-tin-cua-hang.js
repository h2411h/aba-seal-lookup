/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/thong-tin-cua-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   gio(h, m)              — Định dạng giờ làm việc (7h30)
   khoiThanhToanLienHe()  [export]  — Trả HTML khối "Thanh toán và liên hệ" để chèn vào template
   ========================================================================== */
// Thông tin cửa hàng dùng chung — SỬA Ở ĐÂY MỘT LẦN, mọi nơi hiển thị khối "Thanh toán & liên hệ" sẽ tự cập nhật.
// Hệ thống chạy theo mô hình "đặt hàng → cửa hàng gọi xác nhận và hướng dẫn thanh toán" (nhận hàng trả tiền
// hoặc chuyển khoản), nên khách luôn được nhắc cách liên hệ ngay sau khi đặt và trong từng đơn hàng.
import { KHUNG_GIO_LAM_VIEC } from "./trang-chung.js";

const THONG_TIN_CUA_HANG = {
  dienThoai: "(024) 3873 8055",
  email: "namktaba@gmail.com",
  // Điền thông tin tài khoản thật của công ty để khối bên dưới hiện cách chuyển khoản.
  // Để trống (như hiện tại) thì chỉ hiện dòng "cửa hàng sẽ hướng dẫn thanh toán qua điện thoại" — không bịa số.
  nganHang: { ten: "", soTaiKhoan: "", chuTaiKhoan: "" },
};

// 7h30 – 17h30: lấy từ KHUNG_GIO_LAM_VIEC (cùng nguồn với thông báo ngoài giờ làm việc) để không bao giờ lệch nhau.
const gio = (h, m) => (m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`);
const GIO_LAM_VIEC = `${gio(KHUNG_GIO_LAM_VIEC.openHour, KHUNG_GIO_LAM_VIEC.openMinute)} – ${gio(KHUNG_GIO_LAM_VIEC.closeHour, KHUNG_GIO_LAM_VIEC.closeMinute)}`;

// Trả về chuỗi HTML của khối "Thanh toán & liên hệ"; chèn vào bất kỳ template nào bằng ${khoiThanhToanLienHe()}.
export function khoiThanhToanLienHe() {
  const { dienThoai, email, nganHang } = THONG_TIN_CUA_HANG;
  const coTaiKhoan = nganHang.soTaiKhoan && nganHang.ten;
  const chuyenKhoan = coTaiKhoan
    ? `<p>Chuyển khoản: <b>${nganHang.ten}</b> · STK <b>${nganHang.soTaiKhoan}</b>${nganHang.chuTaiKhoan ? ` · Chủ TK <b>${nganHang.chuTaiKhoan}</b>` : ""}.
       Nội dung: <b>Tên và số điện thoại đặt hàng</b>.</p>`
    : "";
  return `
    <div class="pay-box">
      <b>💳 Thanh toán &amp; liên hệ</b>
      <p>Cửa hàng sẽ gọi xác nhận đơn và hướng dẫn thanh toán (nhận hàng trả tiền hoặc chuyển khoản).</p>
      ${chuyenKhoan}
      <p>📞 <a href="tel:${dienThoai.replace(/\D/g, "")}">${dienThoai}</a> · ✉ ${email} · ⏰ ${GIO_LAM_VIEC}</p>
    </div>`;
}
