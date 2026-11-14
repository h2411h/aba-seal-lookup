/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/tai-du-lieu.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiKetQua(...a)      — Hàm ủy quyền sang hanhDong.hienThiKetQua
   taiDonHang()             [export async]  — Tải đơn hàng kèm khách, chi tiết và các dữ liệu liên quan
   canhBaoKhach(khachId)    [export]  — Cảnh báo khách hay hủy/từ chối nhận hàng (vượt ngưỡng đơn có vấn đề)
   nhanCanhBao(khachId)     [export]  — Nhãn cảnh báo nhỏ cạnh tên khách
   boDau(text)              — Đổi chữ thường và bỏ dấu tiếng Việt để tìm kiếm
   chiGiuSo(text)           — Chỉ giữ lại chữ số (ví dụ số điện thoại)
   khopTuKhoa(o, rawQuery)  — Đơn có khớp từ khóa tìm kiếm không (so riêng từng loại dữ liệu)
   trongKhoangNgay(o)       — Đơn có nằm trong khoảng ngày lọc không
   donDangChoXuLy(o)        [export]  — Đơn còn việc chờ nhân viên xử lý (trả hàng, hàng chờ về kho)
   donHangDaLoc()           [export]  — Lọc đơn theo trạng thái, từ khóa, ngày
   thongTinNhom(o)          — Tính khóa và nhãn nhóm (tháng/tuần) của 1 đơn
   dungNhom(list)           [export]  — Gom danh sách đơn thành các nhóm bằng Map
   tinhThongKe(list)        [export]  — Tính thống kê nhanh theo bộ lọc đang chọn
   taiLichSuDon(orderId)    [export async]  — Tải lịch sử trạng thái của 1 đơn từ lich_su_don_hang
   ========================================================================== */
// Tải đơn hàng từ Supabase, lọc/nhóm/thống kê, và cảnh báo khách hay từ chối nhận hàng.
import { hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { nguCanh, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { NGUONG_TU_CHOI_THANG, NGUONG_TU_CHOI_TUAN } from "./hang-so.js";
import { khoaNgay, maDon, sdtHienThi } from "./tien-ich.js";
import { thongTinNhomThoiGian } from "../../../js/dung-chung/nhom-thoi-gian.js";
const hienThiKetQua = (...a) => hanhDong.hienThiKetQua(...a); // hienThiKetQua nằm ở module khác; gọi qua actions để tránh import vòng

export async function taiDonHang() {
  const [{ data, error }, { data: refusalRows }] = await Promise.all([
    nguCanh.supabase.from("don_hang").select("*, khach_hang(ma_khach_hang, ho_ten, so_dien_thoai, ten_cong_ty), chi_tiet_don_hang(id, so_luong, don_gia, phan_tram_chiet_khau, tien_chiet_khau_dong, trang_thai_giao_hang, so_luong_da_giao, ly_do_tu_choi, san_pham(id, ma_san_pham, hang_san_xuat)), hang_cho_ve_kho(id, chi_tiet_don_hang_id, san_pham_id, so_luong, ly_do, trang_thai, ngay_tao, ngay_nhan, san_pham(ma_san_pham, hang_san_xuat)), yeu_cau_tra_hang(id, chi_tiet_don_hang_id, san_pham_id, so_luong, ly_do, trang_thai, ghi_chu, ngay_tao, ngay_xu_ly, ngay_nhan_hang, nguoi_xu_ly, san_pham(ma_san_pham, hang_san_xuat))").order("ngay_tao", { ascending: false }),
    // Số đơn hủy/từ chối nhận của từng khách (theo yêu cầu GVHD) — xem canhBaoKhach() bên dưới.
    nguCanh.supabase.from("customer_refusal_stats").select("khach_hang_id, problem_orders_last_7d, problem_orders_this_month"),
  ]);
  if (error) { hienThongBaoNhanh("Lỗi tải đơn hàng: " + error.message); return; }
  duLieuTrang.orders = data || [];
  duLieuTrang.refusalStats = new Map((refusalRows || []).map(r => [r.khach_hang_id, r]));
  hienThiKetQua();
}

// ---- Cảnh báo khách hay hủy / từ chối nhận hàng ----
// Quy tắc: khách bị cảnh báo khi số đơn "có vấn đề" VƯỢT NGUONG_TU_CHOI_TUAN trong 7 ngày qua
// hoặc VƯỢT NGUONG_TU_CHOI_THANG trong tháng này (2 số này nằm ở hang-so.js).
// Số đơn do view customer_refusal_stats đếm sẵn (đếm theo đơn) — ở đây chỉ so với ngưỡng.
// Trả về câu giải thích, ví dụ "5 đơn trong 7 ngày qua"; trả về "" nếu khách không bị cảnh báo.
export function canhBaoKhach(khachId) {
  const s = duLieuTrang.refusalStats?.get(khachId);
  if (!s) return "";
  const tuan = Number(s.problem_orders_last_7d || 0);
  const thang = Number(s.problem_orders_this_month || 0);
  const lyDo = [];
  if (tuan > NGUONG_TU_CHOI_TUAN) lyDo.push(`${tuan} đơn trong 7 ngày qua`);
  if (thang > NGUONG_TU_CHOI_THANG) lyDo.push(`${thang} đơn trong tháng này`);
  return lyDo.join(" · ");
}

// Nhãn ⚠️ nhỏ cạnh tên khách trong danh sách đơn.
export function nhanCanhBao(khachId) {
  const lyDo = canhBaoKhach(khachId);
  return lyDo ? ` <span class="refusal-warn" title="Khách hay hủy/từ chối nhận hàng: ${lyDo} — nên gọi xác nhận trước khi giao">⚠️ ${lyDo}</span>` : '';
}

// ---- Lọc: trạng thái + tìm kiếm từ khóa + khoảng ngày ----

// Đổi chữ thường + bỏ dấu tiếng Việt, để gõ "nguyen" vẫn tìm ra "Nguyễn".
// Ví dụ: "Nguyễn Đức" -> "nguyen duc"
function boDau(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")                 // tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, "")  // xóa các dấu vừa tách
    .replace(/đ/g, "d");              // chữ đ không tách được nên đổi riêng
}

// Chỉ giữ lại chữ số. Ví dụ: "0912 345.678" -> "0912345678"
function chiGiuSo(text) {
  return String(text || "").replace(/\D/g, "");
}

// Trả về true nếu đơn hàng `o` khớp với từ khóa người dùng gõ.
// Mỗi loại dữ liệu được so RIÊNG (không trộn chung 1 chuỗi như trước) nên không bị trùng nhầm.
function khopTuKhoa(o, rawQuery) {
  const tuKhoa = boDau(rawQuery).trim();
  if (!tuKhoa) return true;                       // ô trống -> hiện tất cả

  // 0) Mã khách hàng (KH0001...) — khớp chính xác, không đổi dù khách đổi tên/SĐT
  if (boDau(o.khach_hang?.ma_khach_hang) === tuKhoa) return true;

  // 1) Tên khách hàng hoặc tên công ty (đúng 2 thứ đang hiện ở cột "Khách hàng")
  const cacTen = [o.khach_hang?.ho_ten, o.khach_hang?.ten_cong_ty];
  if (cacTen.some(ten => boDau(ten).includes(tuKhoa))) return true;

  // 2) Số điện thoại: chỉ so khi ô tìm kiếm TOÀN SỐ (cho phép dấu cách, chấm, gạch ngang).
  //    Nếu có chữ (VD "B1") thì không phải SĐT -> bỏ qua, tránh tìm nhầm.
  //    Gõ "0912 345" hay "0912345" đều ra như nhau.
  const laSoDienThoai = /^[\d\s.\-+()]+$/.test(tuKhoa);
  if (laSoDienThoai && chiGiuSo(sdtHienThi(o)).includes(chiGiuSo(tuKhoa))) return true;

  // 3) Mã đơn (8 ký tự như 78605C21). Phải gõ từ 4 ký tự trở lên mới so mã đơn,
  //    vì gõ ngắn như "a" hay "1" sẽ trùng với gần như mọi mã.
  if (tuKhoa.length >= 4 && boDau(maDon(o)).includes(tuKhoa)) return true;

  return false;
}

function trongKhoangNgay(o) {
  if (!duLieuTrang.dateFrom && !duLieuTrang.dateTo) return true;
  const key = khoaNgay(new Date(o.ngay_tao));
  if (duLieuTrang.dateFrom && key < duLieuTrang.dateFrom) return false;
  if (duLieuTrang.dateTo && key > duLieuTrang.dateTo) return false;
  return true;
}

// Đơn còn việc chờ nhân viên xử lý: yêu cầu trả hàng chưa xong (pending/approved) hoặc hàng khách
// không nhận đang trên đường về kho (pending). Cùng điều kiện với 2 nhãn cam ở cột Trạng thái.
export function donDangChoXuLy(o) {
  return (o.yeu_cau_tra_hang || []).some(r => r.trang_thai === 'pending' || r.trang_thai === 'approved')
    || (o.hang_cho_ve_kho || []).some(r => r.trang_thai === 'pending');
}

export function donHangDaLoc() {
  return duLieuTrang.orders.filter(o =>
    (duLieuTrang.filterStatuses.size === 0 || duLieuTrang.filterStatuses.has(o.trang_thai)) &&
    (!duLieuTrang.choXuLy || donDangChoXuLy(o)) &&
    khopTuKhoa(o, duLieuTrang.search) &&
    trongKhoangNgay(o)
  );
}

// ---- Phân nhóm theo Tháng / Tuần trong tháng ----
function thongTinNhom(o) {
  return thongTinNhomThoiGian(o.ngay_tao, duLieuTrang.groupBy);
}

export function dungNhom(list) {
  const map = new Map();
  for (const o of list) {
    const { key, label } = thongTinNhom(o);
    if (!map.has(key)) map.set(key, { key, label, orders: [] });
    map.get(key).orders.push(o);
  }
  return Array.from(map.values());
}

// ---- Thống kê nhanh theo bộ lọc đang chọn ----
export function tinhThongKe(list) {
  const totalOrders = list.length;
  const totalRevenue = list.reduce((s, o) => s + Number(o.tong_tien || 0), 0);

  const productMap = new Map();
  const customerMap = new Map();
  for (const o of list) {
    const custKey = o.khach_hang_id || o.khach_hang?.so_dien_thoai || o.khach_hang?.ho_ten || "unknown";
    const custName = o.khach_hang?.ho_ten || "(chưa cập nhật tên)";
    const prevC = customerMap.get(custKey) || { name: custName, revenue: 0, orderCount: 0 };
    prevC.revenue += Number(o.tong_tien || 0);
    prevC.orderCount += 1;
    customerMap.set(custKey, prevC);

    for (const it of (o.chi_tiet_don_hang || [])) {
      const code = it.san_pham?.ma_san_pham || "—";
      const prevP = productMap.get(code) || { code, hang_san_xuat: it.san_pham?.hang_san_xuat, qty: 0 };
      prevP.qty += Number(it.so_luong || 0);
      productMap.set(code, prevP);
    }
  }
  let topProduct = null;
  for (const p of productMap.values()) if (!topProduct || p.qty > topProduct.qty) topProduct = p;
  let topCustomer = null;
  for (const c of customerMap.values()) if (!topCustomer || c.revenue > topCustomer.revenue) topCustomer = c;

  return { totalOrders, totalRevenue, topProduct, topCustomer };
}

export async function taiLichSuDon(orderId) {
  // Lịch sử trạng thái chính thức nằm ở lich_su_don_hang.
    const { data, error } = await nguCanh.supabase
    .from("lich_su_don_hang")
    .select("trang_thai, ngay_thay_doi, nguoi_thay_doi")
    .eq("don_hang_id", orderId)
    .order("ngay_thay_doi", { ascending: true });
  if (error) {
    duLieuTrang.orderHistory = [];
    hienThongBaoNhanh("Không tải được lịch sử trạng thái: " + error.message);
  } else {
    duLieuTrang.orderHistory = data || [];
  }
  hienThiKetQua();
}
