/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/tinh-chiet-khau.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   tinhPhiVanChuyen(subtotal)              [export]  — Phí vận chuyển theo tạm tính (miễn phí từ ngưỡng, ngược lại phí cố định)
   khuyenMaiConHieuLuc(p)                  — Quy tắc còn hiệu lực theo ngày bắt đầu/kết thúc
   taiQuyTacChietKhau(supabase)            [export async]  — Tải các quy tắc chiết khấu từ database
   quyTacChietKhauApDung(rule, item)       — Quy tắc có áp dụng cho dòng này theo phạm vi không
   phanTramChietKhauTotNhat(rules, item)   [export]  — ★ Lấy % chiết khấu CAO NHẤT trong các quy tắc đạt (không cộng dồn)
   tinhTongChietKhauSoLuong(rules, items)  — Tổng chiết khấu số lượng cho cả giỏ/đơn (tính từng dòng rồi cộng)
   tinhTongDonHang(items, rules = [])      [export]  — ★ Tính tạm tính, chiết khấu, VAT, phí vận chuyển, tổng cuối
   ========================================================================== */
// Cách TÍNH TIỀN đơn hàng DÙNG CHUNG cho mọi luồng đặt hàng (giỏ hàng, mua ngay ở trang chi
// tiết) — đặt 1 chỗ duy nhất để đổi chính sách thì sửa đúng 1 nơi.
export const THUE_SUAT_MAC_DINH = 10; // % VAT, cộng thêm vào tổng thanh toán Tính theo GIÁ TRỊ đơn hàng
// (đơn giản, dễ giải thích) — không tính theo khoảng cách GPS.
export const NGUONG_MIEN_PHI_SHIP = 500000; // đơn từ 500.000đ (tạm tính) trở lên được miễn phí ship
const PHI_SHIP_CO_DINH = 30000;        // dưới mức trên, phí ship cố định 30.000đ
export function tinhPhiVanChuyen(subtotal) { return subtotal >= NGUONG_MIEN_PHI_SHIP ? 0 : PHI_SHIP_CO_DINH; }

// Còn hiệu lực theo ngày bắt đầu/kết thúc (dùng chung cho discount_rules)
function khuyenMaiConHieuLuc(p) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.ngay_bat_dau && today < p.ngay_bat_dau) return false;
  if (p.ngay_ket_thuc && today > p.ngay_ket_thuc) return false;
  return true;
}

// ---- Chiết khấu theo số lượng/giá trị (bảng discount_rules) ----
// Chiết khấu mua sỉ, tự động áp theo số lượng CÙNG 1 mã sản phẩm và/hoặc tổng giá trị nhóm đó
// trong đơn. Ghi chú: cart item ở storefront hiện chưa lưu loai_san_pham_id nên chiết khấu phạm
// vi "theo loại hình dáng" chỉ áp dụng đúng ở luồng báo giá nội bộ (bao-gia.html), không áp ở
// giỏ hàng khách — phạm vi "toàn bộ" và "vài mã cụ thể" thì áp được ở cả hai nơi.
export async function taiQuyTacChietKhau(supabase) {
  const { data } = await supabase.from("quy_tac_chiet_khau").select("*").eq("dang_hoat_dong", true);
  return (data || []).filter(khuyenMaiConHieuLuc);
}

function quyTacChietKhauApDung(rule, item) {
  if (rule.pham_vi === "all") return true;
  if (rule.pham_vi === "products") return (rule.danh_sach_ma_san_pham || []).includes(item.ma_san_pham);
  if (rule.pham_vi === "product_type") return item.loai_san_pham_id && item.loai_san_pham_id === rule.loai_san_pham_id;
  return false;
}

// Trả về % chiết khấu cao nhất áp dụng cho 1 dòng sản phẩm (không cộng dồn nhiều quy tắc cùng đạt)
export function phanTramChietKhauTotNhat(rules, item) {
  const lineTotal = item.qty * item.price;
  let best = 0;
  for (const r of rules) {
    if (!quyTacChietKhauApDung(r, item)) continue;
    if (r.so_luong_toi_thieu && item.qty < r.so_luong_toi_thieu) continue;
    if (r.gia_tri_don_toi_thieu && lineTotal < r.gia_tri_don_toi_thieu) continue;
    if (Number(r.phan_tram_chiet_khau) > best) best = Number(r.phan_tram_chiet_khau);
  }
  return best;
}

// Tổng tiền chiết khấu số lượng cho toàn bộ giỏ/đơn — tính riêng từng dòng rồi cộng lại
function tinhTongChietKhauSoLuong(rules, items) {
  return items.reduce((sum, i) => {
    const pct = phanTramChietKhauTotNhat(rules, i);
    return sum + (pct > 0 ? Math.round(i.qty * i.price * pct / 100) : 0);
  }, 0);
}

// Tính toàn bộ tóm tắt tiền của 1 đơn: tạm tính, chiết khấu số lượng, thuế VAT, phí vận chuyển, tổng cuối.
// items: [{ ma_san_pham, loai_san_pham_id, qty, price }]
export function tinhTongDonHang(items, rules = []) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const qtyDiscount = tinhTongChietKhauSoLuong(rules, items);
  const taxable = Math.max(0, subtotal - Math.min(subtotal, qtyDiscount));
  const tax = Math.round(taxable * THUE_SUAT_MAC_DINH / 100);
  const shippingFee = tinhPhiVanChuyen(subtotal);
  const total = taxable + tax + shippingFee;
  return { subtotal, qtyDiscount, tax, shippingFee, total };
}
