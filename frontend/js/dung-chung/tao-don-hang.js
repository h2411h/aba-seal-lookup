/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/tao-don-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   taoDonHang(supabase, session, { items, rules, nguo…)  [export async]  — ★ Tạo đơn: tính tổng xem trước, đảm bảo có hồ sơ khách, insert don_hang rồi chi_tiet_don_hang
   ========================================================================== */
// Tạo 1 đơn hàng — DÙNG CHUNG cho "Đặt từ giỏ hàng" (giohang.js) và "Mua ngay" (chi-tiet.js).
// Các bước: đảm bảo có hồ sơ khách -> thêm don_hang -> thêm chi_tiet_don_hang -> lưu địa chỉ mặc định.
// Việc kiểm tra tồn kho, trừ kho, tính lại tổng tiền do trigger trong database làm.
//
// items: [{ id, ma_san_pham, loai_san_pham_id, qty, price }]  (id = id sản phẩm)
// Trả về { ok: true, tien, khach } nếu thành công, hoặc { ok: false, loi: "thông báo cho khách" }.
import { damBaoCoKhachHang } from "./dam-bao-khach-hang.js";
import { THUE_SUAT_MAC_DINH, tinhTongDonHang, phanTramChietKhauTotNhat } from "./tinh-chiet-khau.js";

export async function taoDonHang(supabase, session, { items, rules, nguoiNhan, sdt, diaChi }) {
  const tien = tinhTongDonHang(items, rules);

  // Tài khoản chưa có hồ sơ khách (vd. nhân viên) sẽ bị lỗi khóa ngoại nếu không tạo hồ sơ trước
  const khach = await damBaoCoKhachHang(supabase, session, { ho_ten: nguoiNhan, so_dien_thoai: sdt });
  if (!khach) return { ok: false, loi: "Không tạo được hồ sơ khách hàng. Vui lòng thử lại." };

  const { data: don, error } = await supabase.from("don_hang").insert({
    khach_hang_id: session.user.id,
    tien_hang: tien.subtotal, tien_giam_gia: 0, tien_chiet_khau_so_luong: tien.qtyDiscount,
    thue_suat: THUE_SUAT_MAC_DINH, tien_thue: tien.tax, phi_van_chuyen: tien.shippingFee, tong_tien: tien.total,
    trang_thai: "pending",
    ten_nguoi_nhan: nguoiNhan, sdt_nguoi_nhan: sdt, dia_chi_giao_hang: diaChi
  }).select().single();
  if (error) return { ok: false, loi: "Không thể tạo đơn: " + error.message };

  const dong = items.map(i => {
    const pct = phanTramChietKhauTotNhat(rules, i);
    return { don_hang_id: don.id, san_pham_id: i.id, so_luong: i.qty, don_gia: i.price,
             phan_tram_chiet_khau: pct, tien_chiet_khau_dong: Math.round(i.qty * i.price * pct / 100) };
  });
  const { error: loiDong } = await supabase.from("chi_tiet_don_hang").insert(dong);
  if (loiDong) {
    // Khách không được xóa đơn (còn lịch sử trạng thái) -> hủy đơn rỗng thay vì xóa
    await supabase.from("don_hang").update({ trang_thai: "cancelled", nguoi_huy: "customer", ly_do_huy: "Lỗi hệ thống khi tạo đơn hàng", ngay_huy: new Date().toISOString() }).eq("id", don.id);
    return { ok: false, loi: "Không thể thêm sản phẩm vào đơn: " + loiDong.message };
  }

  await supabase.from("khach_hang").update({ dia_chi_mac_dinh: diaChi }).eq("id", session.user.id);
  return { ok: true, tien, khach };
}
