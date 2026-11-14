/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/luu-gio-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   khoaCuaKhach(session)                  — Khóa localStorage của giỏ: theo id tài khoản hoặc guest
   chuyenGioHangCu()                      [export]  — Chuyển giỏ ở khóa cũ dùng chung thành giỏ khách vãng lai
   layGioHang(session)                    [export]  — ★ Đọc giỏ từ localStorage (JSON.parse)
   luuGioHangTho(session, cart)           [export]  — Ghi giỏ vào localStorage
   soLuongGioHang(session)                [export]  — Tổng số lượng trong giỏ
   veSoGioHangTrenMenu(n)                 — Hiện số lượng trên icon giỏ ở header
   capNhatSoGioHangTrenMenu(session)      [export]  — Tính lại và cập nhật số giỏ trên header
   taoDongGioHang(p, qty)                 [export]  — Tạo 1 dòng giỏ chỉ với các trường cần thiết
   luuGioHang(session, cart)              [export]  — Lưu giỏ, cập nhật số trên menu, đồng bộ lên server (chạy ngầm)
   themVaoGioHang(session, product, qty)  [export]  — ★ Thêm vào giỏ (cộng dồn, không vượt tồn kho), trả về số lượng mới
   ========================================================================== */
// Giỏ hàng lưu trong localStorage — TÁCH RIÊNG theo từng tài khoản đăng nhập.
//
// [VÁ LỖI] Trước đây mọi trang dùng chung đúng 1 khoá cố định "aba_cart_v1" cho localStorage,
// không phân biệt ai đang đăng nhập. Hậu quả: trên máy dùng chung (ví dụ máy tính ở văn phòng),
// hễ ai đó (khách/nhân viên/admin) thêm sản phẩm vào giỏ, TẤT CẢ tài khoản đăng nhập sau đó trên
// cùng trình duyệt đều nhìn thấy y hệt giỏ hàng đó — kể cả tài khoản nhân viên/admin vốn không
// nên có khái niệm "giỏ hàng khách" cho riêng mình. Đây là lỗi nghiêm trọng vì có thể dẫn đến đặt
// nhầm hàng dưới tài khoản/địa chỉ của người khác.
//
// Nay mỗi tài khoản có 1 giỏ riêng theo session.user.id; khách chưa đăng nhập dùng 1 giỏ "guest"
// dùng chung cho khách vãng lai trên máy đó (đúng như hành vi giỏ hàng thông thường trước khi
// đăng nhập), KHÔNG trộn với giỏ của bất kỳ tài khoản cụ thể nào.
import { supabase } from "./ket-noi-supabase.js";
import { dongBoGioHangLenMayChu } from "./dong-bo-gio-hang.js";

const TIEN_TO_GIO_HANG = "aba_cart_v1";
const KHOA_CU = "aba_cart_v1"; // khoá cũ dùng chung (trước bản vá) — chỉ đọc 1 lần để di chuyển dữ liệu

function khoaCuaKhach(session) {
  return session?.user?.id ? `${TIEN_TO_GIO_HANG}:${session.user.id}` : `${TIEN_TO_GIO_HANG}:guest`;
}

// Gọi 1 lần khi trang tải (không cần đợi session): nếu còn dữ liệu ở khoá cũ dùng chung, coi đó là
// giỏ của "khách vãng lai" — chỉ chuyển sang nếu giỏ guest hiện đang rỗng để không ghi đè mất dữ
// liệu ai đó đã lỡ thêm sau bản vá. Sau đó luôn xoá khoá cũ để không còn trang nào lỡ đọc/ghi nhầm.
// Nhờ vậy, tài khoản nhân viên/admin đăng nhập sau bản vá này sẽ thấy giỏ hàng của MÌNH rỗng, thay
// vì thấy giỏ hàng "ma" sót lại từ khách trước đó dùng chung máy.
export function chuyenGioHangCu() {
  try {
    const legacyRaw = localStorage.getItem(KHOA_CU);
    if (!legacyRaw) return;
    const guestKey = `${TIEN_TO_GIO_HANG}:guest`;
    const guestRaw = localStorage.getItem(guestKey);
    if (!guestRaw || guestRaw === "{}") localStorage.setItem(guestKey, legacyRaw);
    localStorage.removeItem(KHOA_CU);
  } catch (e) { /* bỏ qua, không chặn tải trang */ }
}

export function layGioHang(session) {
  try { return JSON.parse(localStorage.getItem(khoaCuaKhach(session)) || "{}"); } catch { return {}; }
}
export function luuGioHangTho(session, cart) {
  try { localStorage.setItem(khoaCuaKhach(session), JSON.stringify(cart)); } catch (e) { /* bỏ qua */ }
}
export function soLuongGioHang(session) {
  return Object.values(layGioHang(session)).reduce((s, i) => s + i.qty, 0);
}

// Hiển thị số lượng trên icon giỏ hàng ở header
function veSoGioHangTrenMenu(n) {
  const el = document.getElementById("navCartBadge");
  if (!el) return;
  el.textContent = n > 0 ? (n > 99 ? "99+" : n) : "";
  el.style.display = n > 0 ? "inline-flex" : "none";
}
export function capNhatSoGioHangTrenMenu(session) { veSoGioHangTrenMenu(soLuongGioHang(session)); }

// ===== CÁC THAO TÁC GIỎ HÀNG DÙNG CHUNG — mọi trang (danh mục, chi tiết, giỏ hàng, tài khoản) gọi vào đây =====
// 1 dòng trong giỏ: chỉ lưu các trường cần để hiển thị và tính tiền
export function taoDongGioHang(p, qty) {
  return { id: p.id, ma_san_pham: p.ma_san_pham, hang_san_xuat: p.hang_san_xuat ?? null,
           gia_le_vnd: p.gia_le_vnd ?? 0, so_luong_ton: p.so_luong_ton, qty };
}

// Lưu giỏ + cập nhật số trên menu + đồng bộ lên server (chạy ngầm)
export function luuGioHang(session, cart) {
  luuGioHangTho(session, cart);
  capNhatSoGioHangTrenMenu(session);
  dongBoGioHangLenMayChu(supabase, session, cart);
}

// Thêm sản phẩm vào giỏ (cộng dồn, không vượt tồn kho). Trả về số lượng mới của sản phẩm đó.
export function themVaoGioHang(session, product, qty) {
  qty = Math.max(1, Number(qty) || 1);
  const cart = layGioHang(session);
  const tran = product.so_luong_ton ?? 999;
  const soMoi = Math.min(tran, (cart[product.id]?.qty || 0) + qty);
  cart[product.id] = taoDongGioHang(product, soMoi);
  luuGioHang(session, cart);
  return soMoi;
}
