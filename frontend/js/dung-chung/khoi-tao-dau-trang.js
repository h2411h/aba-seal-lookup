// ============================================================
// khoi-tao-dau-trang.js — Lắp HEADER DÙNG CHUNG cho trang công khai (khách hàng).
//
// Mỗi trang giờ chỉ cần: <div id="header-mount"></div> + <body data-page="tên-file-không-đuôi">
// + 1 dòng <script type="module" src="js/dung-chung/khoi-tao-dau-trang.js"></script> — KHÔNG tự viết HTML
// header, không cần tự nhớ nạp đủ huy-hieu-tai-khoan.js/huy-hieu-gio-hang.js nữa (file này lo
// hết, nên không thể thiếu sót như trước).
// ============================================================
import { dungHtmlDauTrang, dungHtmlLienKetGioHang, dungHtmlLienKetTaiKhoan } from "./dau-trang.js";
import { chuyenNhanVienVeKhuNoiBo } from "./chan-nhan-vien.js";

const dangOTrangKhachHang = window.location.pathname.includes("/customer/");
const prefixChucNang = dangOTrangKhachHang ? "" : "customer/";
const prefixMenu = dangOTrangKhachHang ? "../" : "";
const tenTrang = document.body.dataset.page || "";
const hrefDangMo = (dangOTrangKhachHang ? "customer/" : "") + tenTrang + ".html";

const htmlNutThaoTac =
  dungHtmlLienKetGioHang({ prefix: prefixChucNang, isActive: tenTrang === "giohang" }) +
  dungHtmlLienKetTaiKhoan({ prefix: prefixChucNang, plain: true, isActive: tenTrang === "tai-khoan" });

const phanTuGanHeader = document.getElementById("header-mount");
if (phanTuGanHeader) {
  phanTuGanHeader.outerHTML = dungHtmlDauTrang({ prefix: prefixChucNang, navPrefix: prefixMenu, activeHref: hrefDangMo, actionsHtml: htmlNutThaoTac });
} else {
  console.error("[header-init] Không tìm thấy #header-mount trong trang — kiểm tra lại HTML.");
}

// Header đã có trong DOM — nạp các script "làm giàu" theo trạng thái đăng nhập thực tế:
// - huy-hieu-tai-khoan.js: thay chữ "Tài khoản" bằng avatar nếu đã đăng nhập.
// - huy-hieu-gio-hang.js: điền số lượng giỏ hàng ban đầu (trang nào tự quản lý giỏ hàng riêng để cập nhật
//   tức thời khi thêm/xóa sản phẩm thì vẫn chạy song song bình thường, không xung đột).
// Tài khoản nhân viên không dùng trang khách. Riêng trang Tài khoản thì bỏ qua: trang đó cần cho nhân viên
// đăng nhập / đặt lại mật khẩu và tự chuyển hướng sau khi đăng nhập (xem customer/js/tai-khoan/phien.js).
if (tenTrang !== "tai-khoan") chuyenNhanVienVeKhuNoiBo(prefixMenu + "staff/dashboard.html");

import("./huy-hieu-tai-khoan.js");
import("./huy-hieu-gio-hang.js");
