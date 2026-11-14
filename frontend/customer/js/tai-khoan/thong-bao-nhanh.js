/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/thong-bao-nhanh.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)           — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   hienThongBaoTrongTrang(msg)  [export]  — Hiện thông báo ngắn trong trang tài khoản rồi tự tắt
   ========================================================================== */
// Thông báo ngắn hiển thị NGAY TRONG trang Tài khoản (khung có màu theo ok/lỗi, lưu ở duLieuTrang.actionMsg).
// Các trang khác dùng hienThongBaoNhanh ở js/dung-chung/trang-chung.js.
import { duLieuTrang, hanhDong } from "./du-lieu-trang.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

export function hienThongBaoTrongTrang(msg) {
  duLieuTrang.actionMsg = { type: "ok", text: msg };
  hienThiTrang();
  setTimeout(() => { duLieuTrang.actionMsg = null; hienThiTrang(); }, 4000);
}
