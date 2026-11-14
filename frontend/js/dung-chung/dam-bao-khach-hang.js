/* ==========================================================================
   MỤC LỤC HÀM — js/dung-chung/dam-bao-khach-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   damBaoCoKhachHang(supabase, session, extra = {})  [export async]  — Đảm bảo tài khoản có hồ sơ khach_hang (cần cho khóa ngoại của đơn và giỏ)
   taiHoSoKhach(supabase, session)                   [export async]  — Đọc hồ sơ khach_hang của tài khoản (null nếu chưa có)
   ========================================================================== */
// Đảm bảo tài khoản đang đăng nhập có hồ sơ trong bảng khach_hang.
// Lý do: don_hang.khach_hang_id và gio_hang.khach_hang_id là khóa ngoại tới khach_hang(id).
// Tài khoản tự đăng ký đã có hồ sơ (tai-khoan.js), nhưng tài khoản nhân viên do admin duyệt
// thì chưa có -> đặt hàng / thêm giỏ hàng lên server báo lỗi khóa ngoại. Hàm này tạo hồ sơ
// tối thiểu (chỉ cần id) nếu chưa có, rồi trả về hồ sơ. Trả về null nếu không tạo được.
export async function damBaoCoKhachHang(supabase, session, extra = {}) {
  if (!session || !session.user) return null;
  const uid = session.user.id;

  const { data: existing } = await supabase.from("khach_hang").select("*").eq("id", uid).maybeSingle();
  if (existing) return existing;

  const meta = session.user.user_metadata || {};
  const email = session.user.email || null;
  const row = {
    id: uid,
    ho_ten: extra.ho_ten || meta.full_name || meta.ho_ten || (email ? email.split("@")[0] : "Khách hàng"),
    so_dien_thoai: extra.so_dien_thoai || meta.phone || meta.so_dien_thoai || null,
    email
  };
  const { data, error } = await supabase.from("khach_hang").insert(row).select().single();
  if (!error) return data;

  // Hai nơi cùng tạo một lúc -> trùng khóa chính: đọc lại bản đã được tạo
  if (error.code === "23505") {
    const { data: again } = await supabase.from("khach_hang").select("*").eq("id", uid).maybeSingle();
    if (again) return again;
  }
  console.error("Không tạo được hồ sơ khach_hang:", error.message);
  return null;
}

// Đọc hồ sơ khach_hang của tài khoản đang đăng nhập (null nếu chưa đăng nhập hoặc chưa có hồ sơ).
export async function taiHoSoKhach(supabase, session) {
  if (!session) return null;
  const { data } = await supabase.from("khach_hang").select("*").eq("id", session.user.id).maybeSingle();
  return data || null;
}
