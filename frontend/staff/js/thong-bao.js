/* ==========================================================================
   MỤC LỤC HÀM — staff/js/thong-bao.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   dem(q)              — Đổi kết quả truy vấn thành {tong, dong}
   hienThiNhom(n, kq)  — Vẽ 1 nhóm việc cần xử lý trong trang thông báo
   hienThiTrang()      [async]  — Vẽ trang thông báo của nhân viên (các nhóm theo vai trò, mảng NHOM)
   ========================================================================== */
// Trang THÔNG BÁO của nhân viên: gom các việc đang chờ xử lý vào một chỗ để đọc.
// Mỗi nhóm hiện số lượng + danh sách các mục (mới nhất trước); bấm vào dòng để mở đúng trang xử lý.
// Không có bảng riêng: dữ liệu lấy thẳng từ các bảng đơn hàng, yêu cầu, trả hàng, tồn kho.
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, nhanVaiTro } from "../nhan-vien-chung.js";
import { NGUONG_SAP_HET } from "../../js/dung-chung/ton-kho.js";
import { dinhDangTien, maHoaHtml } from "../../js/dung-chung/dinh-dang.js";

const phanTuGoc = document.getElementById("root");
const nguCanh = {};
const huyHieu = {};
const SO_DONG = 50;     // số mục tối đa hiện trong mỗi nhóm (nhiều hơn thì mở trang xử lý để xem đủ)

const dem = (q) => q.then(({ data, count }) => ({ tong: count || 0, dong: data || [] }));

// Mỗi nhóm: tiêu đề, trang xử lý, vai trò được thấy, hàm lấy dữ liệu, cách hiện 1 dòng ({ chu, luc }).
const NHOM = [
  { tieuDe: "Đơn hàng chờ xử lý", href: "don-hang.html", vaiTro: ["sales", "admin"],
    lay: (sb) => dem(sb.from("don_hang").select("ten_nguoi_nhan, tong_tien, ngay_tao", { count: "exact" })
      .eq("trang_thai", "pending").order("ngay_tao", { ascending: false }).limit(SO_DONG)),
    dong: (d) => ({ chu: `${d.ten_nguoi_nhan || "Khách"} — ${dinhDangTien(d.tong_tien)}`, luc: d.ngay_tao }) },

  { tieuDe: "Yêu cầu khách hàng mới", href: "bao-gia.html", vaiTro: ["sales", "warehouse", "admin"],
    lay: (sb) => dem(sb.from("yeu_cau_bao_gia").select("ten_khach_hang, loai_yeu_cau, ngay_tao", { count: "exact" })
      .eq("trang_thai", "new").order("ngay_tao", { ascending: false }).limit(SO_DONG)),
    dong: (d) => ({ chu: `${d.ten_khach_hang || "Khách"} — ${d.loai_yeu_cau || "yêu cầu"}`, luc: d.ngay_tao }) },

  { tieuDe: "Khách hàng vừa phản hồi", href: "bao-gia.html", vaiTro: ["sales", "warehouse", "admin"],
    lay: async (sb) => {
      const { data } = await sb.from("yeu_cau_bao_gia")
        .select("ten_khach_hang, tin_nhan_cuoi_luc, tin_nhan_cuoi_xem_truoc, nhan_vien_doc_luc")
        .eq("tin_nhan_cuoi_boi", "customer").order("tin_nhan_cuoi_luc", { ascending: false });
      // chưa đọc = nhân viên chưa mở, hoặc khách nhắn sau lần mở cuối
      const chuaDoc = (data || []).filter(q => !q.nhan_vien_doc_luc || new Date(q.tin_nhan_cuoi_luc) > new Date(q.nhan_vien_doc_luc));
      return { tong: chuaDoc.length, dong: chuaDoc.slice(0, SO_DONG) };
    },
    dong: (d) => ({ chu: `${d.ten_khach_hang || "Khách"}: ${d.tin_nhan_cuoi_xem_truoc || ""}`, luc: d.tin_nhan_cuoi_luc }) },

  { tieuDe: "Hàng trả cần xử lý", href: "don-hang.html", vaiTro: ["sales", "admin"],
    lay: async (sb) => {
      const [a, b] = await Promise.all([
        dem(sb.from("yeu_cau_tra_hang").select("ly_do, so_luong, ngay_tao", { count: "exact" }).in("trang_thai", ["pending", "approved"]).order("ngay_tao", { ascending: false }).limit(SO_DONG)),
        dem(sb.from("hang_cho_ve_kho").select("ly_do, so_luong, ngay_tao", { count: "exact" }).eq("trang_thai", "pending").order("ngay_tao", { ascending: false }).limit(SO_DONG)),
      ]);
      const dong = [...a.dong, ...b.dong].sort((x, y) => new Date(y.ngay_tao) - new Date(x.ngay_tao)).slice(0, SO_DONG);
      return { tong: a.tong + b.tong, dong };
    },
    dong: (d) => ({ chu: `${d.ly_do || "Trả hàng"} — ${d.so_luong} sản phẩm`, luc: d.ngay_tao }) },

  { tieuDe: "Yêu cầu cấp quyền nhân viên", href: "phan-quyen.html", vaiTro: ["admin"],
    lay: (sb) => dem(sb.from("yeu_cau_dang_ky_nhan_vien").select("ho_ten, vai_tro_de_xuat, ngay_tao", { count: "exact" })
      .eq("trang_thai", "pending").order("ngay_tao", { ascending: false }).limit(SO_DONG)),
    dong: (d) => ({ chu: `${d.ho_ten || "Chưa có tên"} — xin vai trò ${nhanVaiTro(d.vai_tro_de_xuat)}`, luc: d.ngay_tao }) },

  { tieuDe: "Sắp hết hàng", href: "kho.html", vaiTro: ["warehouse", "admin"],
    lay: (sb) => dem(sb.from("ton_kho").select("so_luong, ngay_cap_nhat, san_pham(ma_san_pham), kho(ten)", { count: "exact" })
      .lt("so_luong", NGUONG_SAP_HET).order("so_luong").limit(SO_DONG)),
    dong: (d) => ({ chu: `${d.san_pham?.ma_san_pham || "?"} (${d.kho?.ten || "kho"}) — còn ${d.so_luong}`, luc: d.ngay_cap_nhat }) },
];

function hienThiNhom(n, kq) {
  if (kq.tong === 0) return `
  <section class="kho-card">
    <div class="kho-card-head"><div><h2>${n.tieuDe} (0)</h2></div></div>
    <p style="padding:12px 18px;margin:0;color:var(--steel);font-size:13px">Không có việc nào đang chờ.</p>
  </section>`;
  return `
  <section class="kho-card">
    <div class="kho-card-head">
      <div><h2>${n.tieuDe} (${kq.tong})</h2></div>
      <a href="${n.href}" class="btn small ghost">Mở trang xử lý</a>
    </div>
    <div class="tb-danh-sach">${kq.dong.map(d => { const r = n.dong(d); return `
    <a class="tb-dong" href="${n.href}"><span>${maHoaHtml(r.chu)}</span><small>${r.luc ? new Date(r.luc).toLocaleString("vi-VN") : ""}</small></a>`; }).join("")}</div>
    ${kq.tong > SO_DONG ? `<div class="kho-note">Đang hiện ${SO_DONG} mục mới nhất, còn ${kq.tong - SO_DONG} mục nữa. Mở trang xử lý để xem đủ.</div>` : ""}
  </section>`;
}

async function hienThiTrang() {
  const { supabase, staff, session } = nguCanh;
  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(staff, session, "thong-bao.html", huyHieu);
  ganDangXuat(supabase);

  const nhomCuaToi = NHOM.filter(n => n.vaiTro.includes(staff.vai_tro));
  const ketQua = await Promise.all(nhomCuaToi.map(n => n.lay(supabase)));
  const tatCa = nhomCuaToi.map((n, i) => ({ n, kq: ketQua[i] }));

  document.getElementById("noiDungTrang").innerHTML = `
  <section class="kho-hero">
    <div>
      <h1 class="page-title">Thông báo</h1>
      <p class="kho-subtitle">Các việc đang chờ bạn xử lý. Bấm vào một dòng để mở trang xử lý.</p>
    </div>
  </section>
  ${tatCa.map(x => hienThiNhom(x.n, x.kq)).join("")}`;
}

(async () => {
  const login = await batBuocNhanVien(phanTuGoc, { requireRole: ["sales", "warehouse", "admin"], activePage: "thong-bao.html" });
  if (!login) return;
  Object.assign(nguCanh, login);
  Object.assign(huyHieu, await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff));
  hienThiTrang();
})();
