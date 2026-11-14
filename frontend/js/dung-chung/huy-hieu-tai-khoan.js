// Làm giàu khối "Tài khoản" sau khi header đã lắp xong (xem khoi-tao-dau-trang.js) — nếu khách ĐÃ đăng
// nhập, thay chữ "Tài khoản" thường bằng avatar + tên (dùng ĐÚNG hàm dungHtmlLienKetTaiKhoan trong
// dau-trang.js — nguồn duy nhất định nghĩa markup này). Nếu CHƯA đăng nhập: giữ nguyên chữ "Tài khoản" làm nút mời đăng nhập, không đổi gì.
import { dungHtmlLienKetTaiKhoan } from "./dau-trang.js";
import { supabase, daCauHinh } from "./ket-noi-supabase.js";

(async () => {
  if (!daCauHinh) return;
  const link = document.getElementById("navAccountLink");
  if (!link) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // chưa đăng nhập — không đụng vào link chữ có sẵn

  const { data: customer } = await supabase.from("khach_hang")
    .select("ho_ten").eq("id", session.user.id).maybeSingle();
  const name = (customer?.ho_ten || session.user.email || "").trim();
  const isActive = link.classList.contains("active"); // đang đứng trên chính trang Tài khoản

  const dangOTrangKhachHang = window.location.pathname.includes("/customer/");
  const pathPrefix = dangOTrangKhachHang ? "" : "customer/";
  const wrap = document.createElement("div");
  wrap.innerHTML = dungHtmlLienKetTaiKhoan({
    prefix: pathPrefix,
    initial: name.charAt(0).toUpperCase() || "?",
    name,
    isActive,
  });
  link.replaceWith(wrap.firstElementChild);
})();
