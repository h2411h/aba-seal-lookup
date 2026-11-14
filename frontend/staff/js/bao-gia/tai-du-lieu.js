/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia/tai-du-lieu.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiKetQua(...a)           — Hàm ủy quyền sang hanhDong.hienThiKetQua
   taiYeuCau()                   [export async]  — Tải các yêu cầu từ bảng yeu_cau_bao_gia
   ganMaKhachHang(quotes)        [async]  — Gắn mã khách hàng KH0001... vào từng yêu cầu để tìm kiếm
   taiBanDoNhanVien()            [export async]  — Tải bảng tra nhân viên (id, tên, vai trò)
   taiSanPhamGoiY()              [export async]  — Tải sản phẩm để làm gợi ý trong ô chọn
   taiDonDaThanhToan()           [export async]  — Tải các đơn đã thanh toán để chọn trong yêu cầu
   taiDongYeuCau(quoteId)        [export async]  — Tải các dòng chi tiết của 1 yêu cầu
   khopTuKhoa(q, rawQuery)       — Yêu cầu có khớp từ khóa tìm kiếm không
   yeuCauDaLoc()                 [export]  — Lọc yêu cầu theo từ khóa, trạng thái, loại, ưu tiên, người xử lý
   danhDauDaDocPhanHoiKhach(id)  [export async]  — Đánh dấu đã đọc phản hồi của khách
   danhDauDaHuy(id)              [export async]  — Đánh dấu yêu cầu "Đã hủy" (không xóa dữ liệu)
   ========================================================================== */
// Tải yêu cầu/đơn/sản phẩm từ Supabase, tìm kiếm, phát hiện yêu cầu trùng, lọc, đánh dấu đã đọc/hủy.
import { hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { nguCanh, huyHieu, dsNhanVien, duLieuTrang, datDsNhanVien, datBanDoNhanVien, datTatCaSanPham, datHuyHieu, hanhDong } from "./du-lieu-trang.js";
const hienThiKetQua = (...a) => hanhDong.hienThiKetQua(...a); // hienThiKetQua nằm ở module khác; gọi qua actions để tránh import vòng

export async function taiYeuCau() {
  const { data, error } = await nguCanh.supabase.from("yeu_cau_bao_gia").select("*").order("ngay_tao", { ascending: false });
  if (error) { hienThongBaoNhanh('Không tải được yêu cầu: ' + error.message); return; }
  duLieuTrang.quotes = data || [];
  await ganMaKhachHang(duLieuTrang.quotes);
  if (duLieuTrang.quotes.length) {
    const ids = duLieuTrang.quotes.map(q => q.id);
    const { data: messages, error: msgError } = await nguCanh.supabase.from('tin_nhan_ho_tro').select('*').in('yeu_cau_id', ids).order('ngay_tao', { ascending:true });
    if (msgError) console.error('Không tải được tin nhắn hỗ trợ:', msgError.message);
    const byRequest = {};
    (messages || []).forEach(m => { (byRequest[m.yeu_cau_id] ||= []).push(m); });
    duLieuTrang.quotes.forEach(q => { q._dbMessages = byRequest[q.id] || []; });
  }
  hienThiKetQua();
}

// Gắn mã khách hàng (KH0001...) vào từng yêu cầu để tìm kiếm/hiển thị.
// Chỉ khách có tài khoản mới có mã; khách vãng lai (khach_hang_id = null) thì không có.
// Tải riêng (không join) để không phụ thuộc khóa ngoại; lỗi quyền/mạng chỉ làm mất tính năng tìm theo mã, không chặn trang.
async function ganMaKhachHang(quotes) {
  const ids = [...new Set(quotes.map(q => q.khach_hang_id).filter(Boolean))];
  if (!ids.length) return;
  const { data, error } = await nguCanh.supabase.from("khach_hang").select("id, ma_khach_hang").in("id", ids);
  if (error) { console.warn("Không tải được mã khách hàng:", error.message); return; }
  const banDo = Object.fromEntries((data || []).map(c => [c.id, c.ma_khach_hang]));
  quotes.forEach(q => { q.ma_khach_hang = banDo[q.khach_hang_id] || null; });
}

export async function taiBanDoNhanVien() {
  const { data } = await nguCanh.supabase.from("ho_so_nhan_vien").select("id, ho_ten, vai_tro");
  datDsNhanVien(data || []);
  datBanDoNhanVien(Object.fromEntries(dsNhanVien.map(s => [s.id, s.ho_ten])));
}

export async function taiSanPhamGoiY() {
  const { data } = await nguCanh.supabase.from("san_pham").select("id, ma_san_pham, hang_san_xuat, gia_le_vnd, so_luong_ton").eq("dang_hoat_dong", true).limit(1000);
  datTatCaSanPham(data || []);
}

export async function taiDonDaThanhToan() {
  const { data, error } = await nguCanh.supabase
    .from("don_hang")
    .select("id, khach_hang_id, ngay_tao, trang_thai, tong_tien, khach_hang(ho_ten, so_dien_thoai), chi_tiet_don_hang(id, so_luong, don_gia, san_pham(id, ma_san_pham, hang_san_xuat))")
    .in("trang_thai", ["completed", "partially_delivered"])
    .order("ngay_tao", { ascending: false })
    .limit(500);
  if (error) { console.warn("Không tải được danh sách đơn đã giao:", error.message); duLieuTrang.paidOrders = []; return; }
  duLieuTrang.paidOrders = data || [];
}

export async function taiDongYeuCau(quoteId) {
  const { data } = await nguCanh.supabase.from("chi_tiet_yeu_cau_bao_gia").select("*, san_pham(ma_san_pham, gia_le_vnd)").eq("yeu_cau_bao_gia_id", quoteId);
  duLieuTrang.quoteItems = data || [];
  hienThiKetQua();
}

// ---- Tìm kiếm nhanh + lọc trạng thái/loại/ưu tiên/người xử lý + phát hiện trùng lặp ----
function khopTuKhoa(q, rawQuery) {
  const s = (rawQuery || "").trim().toLowerCase();
  if (!s) return true;
  // Mã khách hàng (KH0001...) — khớp chính xác, giống trang Đơn hàng, để KH0001 không lẫn với KH00012
  if (q.ma_khach_hang && q.ma_khach_hang.toLowerCase() === s) return true;
  const haystack = [q.ten_khach_hang, q.sdt_khach_hang, q.ten_cong_ty, q.ghi_chu, q.id].filter(Boolean).join(" ").toLowerCase();
  if (haystack.includes(s)) return true;
  // Cho phép tìm theo mã/tên sản phẩm nếu yêu cầu đó đã có dòng sản phẩm khớp (chỉ áp dụng khi đang mở chi tiết)
  return false;
}

export function yeuCauDaLoc() {
  return duLieuTrang.quotes.filter(q =>
    (duLieuTrang.filterStatus === "all" || q.trang_thai === duLieuTrang.filterStatus) &&
    (duLieuTrang.filterType === "all" || q.loai_yeu_cau === duLieuTrang.filterType) &&
    (duLieuTrang.filterAssignee === "all" || (duLieuTrang.filterAssignee === "unassigned" ? !q.nguoi_xu_ly : q.nguoi_xu_ly === duLieuTrang.filterAssignee)) &&
    khopTuKhoa(q, duLieuTrang.search)
  );
}

export async function danhDauDaDocPhanHoiKhach(id) {
  const q = duLieuTrang.quotes.find(item => item.id === id);
  if (!q || q.tin_nhan_cuoi_boi !== 'customer') return;
  const lastMessageAt = q.tin_nhan_cuoi_luc ? new Date(q.tin_nhan_cuoi_luc).getTime() : 0;
  const readAt = q.nhan_vien_doc_luc ? new Date(q.nhan_vien_doc_luc).getTime() : 0;
  if (readAt && lastMessageAt && readAt >= lastMessageAt) return;
  const now = new Date().toISOString();
  const { error } = await nguCanh.supabase.from('yeu_cau_bao_gia').update({ nhan_vien_doc_luc: now }).eq('id', id);
  if (error) { console.warn('Không đánh dấu đã xem phản hồi khách:', error.message); return; }
  q.nhan_vien_doc_luc = now;
  datHuyHieu(await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff));
  const sidebar = document.getElementById('staffSidebar');
  if (sidebar) sidebar.innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'bao-gia.html', huyHieu);
  ganDangXuat(nguCanh.supabase);
}

// Không xoá dữ liệu thật (mục 11) — chỉ đánh dấu "Đã hủy", giữ nguyên lịch sử để tra cứu về sau.
export async function danhDauDaHuy(id) {
  if (!confirm("Đánh dấu yêu cầu này là Đã hủy? Dữ liệu vẫn được giữ lại, không bị xóa.")) return;
  const { error } = await nguCanh.supabase.from("yeu_cau_bao_gia").update({ trang_thai: "cancelled" }).eq("id", id);
  if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
  hienThongBaoNhanh("Đã đánh dấu hủy");
  taiYeuCau();
}
