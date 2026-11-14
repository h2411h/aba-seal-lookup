/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/dau-trang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   dungHtmlDauTrang({ prefix = "", navPrefix = prefix, acti…)         [export]  — Dựng HTML header cho các trang khách (logo, menu, giỏ, tài khoản)
   dungHtmlLienKetGioHang({ prefix = "", isActive = false } = {})     [export]  — HTML link Giỏ hàng
   dungHtmlLienKetTaiKhoan({ prefix = "", initial, name, isActive …)  [export]  — HTML link Tài khoản (avatar chữ cái đầu)
   ========================================================================== */
// ============================================================
// dau-trang.js — NGUỒN DUY NHẤT định nghĩa cấu trúc HEADER của các trang KHÁCH HÀNG (trang công khai).
// Khu vực nhân viên KHÔNG dùng header này: nhân viên điều hướng bằng sidebar (xem staff/nhan-vien-chung.js).
//
// Trước đây mỗi trang tự viết 1 bản HTML header riêng (copy-paste), dẫn tới hàng loạt lỗi lệch
// nhau qua thời gian: avatar méo hình, thiếu link giỏ hàng, trùng lặp "Tài khoản", quên nạp script...
// Từ nay MỌI thay đổi về cấu trúc header (thêm/bớt mục menu, đổi logo, đổi cách hiện avatar...)
// CHỈ sửa DUY NHẤT ở file này — mọi trang tự động nhận thay đổi, không cần sửa từng file.
//
// Cách dùng:
// Cách dùng: xem khoi-tao-dau-trang.js (tự lắp header + tự làm giàu avatar/giỏ hàng/thông báo).
// ============================================================

// 5 mục menu chính — CỐ ĐỊNH, giống hệt nhau ở mọi trang. Muốn thêm/bớt mục menu, sửa Ở ĐÂY.
const CAC_MUC_MENU = [
  { href: "index.html", label: "Trang chủ" },
  { href: "customer/danh-muc.html", label: "Danh mục sản phẩm" },
  { href: "customer/tu-van.html", label: "Tư vấn kỹ thuật" },
  { href: "customer/ve-aba.html", label: "Về ABA" },
  { href: "customer/lien-he.html", label: "Liên hệ" },
];

/**
 * Dựng khung <header> hoàn chỉnh: logo + 6 mục menu + khối tiện ích bên phải.
 * @param {string} prefix - tiền tố cho các liên kết chức năng (giỏ hàng/tài khoản).
 * @param {string} navPrefix - tiền tố riêng cho menu chính, vì trang customer nằm trong thư mục con.
 * @param {string} hrefDangMo - href (trong CAC_MUC_MENU) của trang hiện tại, để tô sáng mục đang đứng.
 * @param {string} htmlNutThaoTac - HTML khối bên phải (giỏ hàng/chuông/tài khoản), dựng bằng các hàm build* bên dưới.
 */
export function dungHtmlDauTrang({ prefix = "", navPrefix = prefix, activeHref = "", actionsHtml = "" }) {
  const navHtml = CAC_MUC_MENU.map(item =>
    `<a href="${navPrefix}${item.href}"${item.href === activeHref ? ' class="active"' : ""}>${item.label}</a>`
  ).join("");
  return `<header class="site-header">
  <div class="header-inner">
    <div class="brand">
      <svg class="mark" viewBox="0 0 30 30" fill="none"><rect x="4" y="4" width="10" height="22" stroke="#e2810f" stroke-width="2"/><path d="M14 4 L26 12 L26 18 L14 26" stroke="#e2810f" stroke-width="2" stroke-linejoin="round"/></svg>
      <div>ABA TECHNICAL<small>Vật liệu làm kín công nghiệp</small></div>
    </div>
    <nav class="main-nav">${navHtml}</nav>
    <div class="header-actions">${actionsHtml}</div>
  </div>
</header>`;
}

/** Link "🛒 Giỏ hàng" của khách hàng. */
export function dungHtmlLienKetGioHang({ prefix = "", isActive = false } = {}) {
  return `<a href="${prefix}giohang.html" class="nav-cart-link${isActive ? " active" : ""}">Giỏ hàng<span id="navCartBadge" class="nav-cart-badge"></span></a>`;
}

/**
 * Link "Tài khoản" của khách hàng — gộp về đúng 1 hàm duy nhất để avatar không bị lệch giữa các trang.
 * plain=true: chưa xác định trạng thái đăng nhập (hiện chữ "Tài khoản" thường, sẽ được
 *   khoi-tao-dau-trang.js / huy-hieu-tai-khoan.js thay bằng avatar sau khi biết đã đăng nhập hay chưa).
 * plain=false: đã biết rõ tên/avatar (huy-hieu-tai-khoan.js dùng sau khi kiểm tra đăng nhập xong).
 */
export function dungHtmlLienKetTaiKhoan({ prefix = "", initial, name, isActive = false, plain = false } = {}) {
  if (plain) {
    return `<a href="${prefix}tai-khoan.html" id="navAccountLink"${isActive ? ' class="active"' : ""}>Tài khoản</a>`;
  }
  const avatarInner = initial || "?";
  const title = (name ? `${name} — vào trang Tài khoản` : "Tài khoản").replace(/"/g, "&quot;");
  return `<a href="${prefix}tai-khoan.html" class="acct-link${isActive ? " active" : ""}" title="${title}"><span class="acct-avatar">${avatarInner}</span>Tài khoản</a>`;
}
