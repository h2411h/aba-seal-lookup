/* ==========================================================================
   MỤC LỤC HÀM — staff/js/han-luu-kho.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   docNamDaNho()                            — Đọc số năm hạn lưu kho đã nhớ trong trình duyệt (mặc định HAN_MAC_DINH_NAM)
   quanLy()                                 — Người dùng có phải warehouse/admin không
   dinhDangNgay(d)                          — Định dạng ngày kiểu Việt Nam
   congThang(d, n)                          — Cộng n tháng vào một ngày
   tinhHanLuuKho({ ton, vao, costs, nam })  — ★ Dựng lại các lô theo FIFO ngược từ sổ giao dịch, tính số lượng quá hạn / sắp hết hạn
   hienThiTrang()                           — Vẽ trang hạn lưu kho
   ganSuKien()                              — Gắn sự kiện (đổi số năm, tiêu hủy, in biên bản)
   docHet(taoTruyVan)                       [async]  — Đọc hết dữ liệu khi Supabase giới hạn 1000 dòng/lần (lặp .range)
   taiDuLieu()                              [async]  — Tải tồn kho, giao dịch nhập, giá vốn
   dongTieuHuy(r)                           — Tạo 1 dòng giao dịch kho loại disposal (DB tự trừ tồn)
   tieuHuyTatCa(btn)                        [async]  — Tiêu hủy toàn bộ hàng quá hạn bằng 1 lần xác nhận và 1 lệnh insert
   tieuHuy(key, btn)                        [async]  — Tiêu hủy hàng quá hạn của 1 mã tại 1 kho
   inBienBan()                              — In biên bản tiêu hủy hàng quá hạn (mở cửa sổ mới rồi print)
   ========================================================================== */
// Logic trang staff/han-luu-kho.html — "Hạn lưu kho & tiêu hủy".
//
// CHÍNH SÁCH: hàng nhập kho quá N năm (N do công ty quyết định từng lúc, nhập tự do ở ô "Hạn lưu kho") mà chưa bán hết thì phải đem đi tiêu hủy.
//
// Cách tính (không cần thêm bảng "lô hàng"):
//  1) Mỗi lần hàng VÀO một kho (nhập kho / chuyển đến / khách trả) là một "lô", ngày lô = ngày giao dịch.
//  2) Hàng bán/xuất theo nguyên tắc nhập trước – xuất trước (FIFO) nên phần còn lại trong kho thuộc các lô
//     MỚI nhất. Vì vậy chia số tồn hiện tại cho các lô, đi từ lô mới nhất về lô cũ nhất.
//  3) Nếu tồn lớn hơn tổng các lần nhập (hàng có từ trước, chưa có phiếu nhập) thì phần dư tính là lô cũ nhất,
//     ngày lô = ngày tạo mã sản phẩm.
//  4) Hạn của lô = ngày lô + N năm. Hạn đã qua => "Quá hạn"; còn dưới CANH_BAO_THANG tháng => "Sắp hết hạn".
//
// Tiêu hủy = ghi 1 giao dịch kho loại 'disposal' (DB tự trừ tồn kho).
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, hienThongBaoNhanh } from "../nhan-vien-chung.js";
import { DIA_CHI_CONG_TY, TEN_CONG_TY } from "./don-hang/hang-so.js";
import { dinhDangTien, maHoaHtml } from "../../js/dung-chung/dinh-dang.js";

const HAN_MAC_DINH_NAM = 10;   // dùng khi chưa ai lưu số năm nào
const CANH_BAO_THANG = 12;    // báo "sắp hết hạn" trước 12 tháng
const LOAI_VAO = ["import", "transfer_in", "customer_return"];

const phanTuGoc = document.getElementById("root");
const nguCanh = {};
const huyHieu = {};
// ton: các dòng ton_kho | vao: các lần hàng vào kho | costs: giá vốn (chỉ Kho/Admin xem được)
// Số năm đang xem được nhớ trong trình duyệt để đổi trang rồi quay lại không bị về 10.
const KHOA_NHO_NAM = "aba_han_luu_kho_nam";
function docNamDaNho() {
  try { const v = Number(localStorage.getItem(KHOA_NHO_NAM)); return v > 0 ? v : HAN_MAC_DINH_NAM; }
  catch { return HAN_MAC_DINH_NAM; }
}
const duLieuTrang = { ton: [], vao: [], costs: {}, nam: docNamDaNho(), tatCa: false };

const quanLy = () => ["warehouse", "admin"].includes(nguCanh.staff?.vai_tro);
const dinhDangNgay = d => new Date(d).toLocaleDateString("vi-VN");
function congThang(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

// Mỗi (mã sản phẩm, kho) còn tồn => danh sách lô còn lại + số lượng quá hạn / sắp hết hạn.
function tinhHanLuuKho({ ton, vao, costs, nam }) {
  const thang = Math.round(Number(nam) * 12);
  const bayGio = new Date();
  const moCanhBao = congThang(bayGio, CANH_BAO_THANG);
  const ketQua = [];
  for (const s of ton) {
    let conLai = Number(s.so_luong || 0);
    if (conLai <= 0) continue;
    const dsVao = vao
      .filter(t => t.san_pham_id === s.san_pham_id && t.kho_id === s.kho_id)
      .sort((a, b) => new Date(a.ngay_tao) - new Date(b.ngay_tao));
    const lo = [];
    for (let i = dsVao.length - 1; i >= 0 && conLai > 0; i--) {      // lô mới nhất -> cũ nhất
      const sl = Math.min(Number(dsVao[i].so_luong), conLai);
      lo.unshift({ ngay: dsVao[i].ngay_tao, sl });
      conLai -= sl;
    }
    if (conLai > 0) {                                                 // tồn có từ trước khi có phiếu nhập
      const moc = [s.san_pham?.ngay_tao, dsVao[0]?.ngay_tao].filter(Boolean).map(d => new Date(d));
      const ngay = moc.length ? new Date(Math.min(...moc)).toISOString() : bayGio.toISOString();
      lo.unshift({ ngay, sl: conLai, tonDau: true });
    }
    for (const l of lo) {
      l.han = congThang(l.ngay, thang);
      l.tt = l.han <= bayGio ? "qua" : l.han <= moCanhBao ? "sap" : "con";
    }
    const tong = tt => lo.filter(l => l.tt === tt).reduce((n, l) => n + l.sl, 0);
    const qua = tong("qua");
    const gia = costs[s.san_pham_id];
    ketQua.push({ s, lo, qua, sap: tong("sap"), giaTri: gia != null ? qua * Number(gia) : null });
  }
  return ketQua.sort((a, b) => b.qua - a.qua || a.lo[0].han - b.lo[0].han);
}

const NHAN_TT = {
  qua: '<span class="badge cancelled">Quá hạn</span>',
  sap: '<span class="badge pending">Sắp hết hạn</span>',
  con: '<span class="badge completed">Còn hạn</span>'
};

// ===== VẼ TRANG =====
function hienThiTrang() {
  const tatCa = tinhHanLuuKho(duLieuTrang);
  const ds = duLieuTrang.tatCa ? tatCa : tatCa.filter(r => r.qua > 0 || r.sap > 0);
  const tongQua = tatCa.reduce((n, r) => n + r.qua, 0);
  const soMaQua = tatCa.filter(r => r.qua > 0).length;
  const tongSap = tatCa.reduce((n, r) => n + r.sap, 0);
  const giaTriQua = tatCa.reduce((n, r) => n + (r.giaTri || 0), 0);
  const q = quanLy();

  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, "han-luu-kho.html", huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <section class="kho-hero">
    <div>
      <div class="kho-eyebrow">QUẢN LÝ KHO</div>
      <h1 class="page-title">Hạn lưu kho &amp; tiêu hủy</h1>
      <p class="kho-subtitle">Hàng nhập kho quá <b>${Number(duLieuTrang.nam)} năm</b> mà chưa bán hết phải tiêu hủy.</p>
    </div>
    <div class="kho-hero-actions">
      <button class="btn ghost" id="btnInBienBan">In biên bản tiêu hủy</button>
      ${q && soMaQua > 0 ? `<button class="btn" id="btnTieuHuyTatCa">Tiêu hủy tất cả quá hạn (${soMaQua} mã)</button>` : ""}
    </div>
  </section>

  <section class="kho-stats">
    <div class="kho-stat ${tongQua ? "warning" : ""}"><span class="kho-stat-label">Quá hạn lưu kho</span><strong>${tongQua.toLocaleString("vi-VN")}</strong><small>${soMaQua} mã cần tiêu hủy</small></div>
    <div class="kho-stat ${tongSap ? "warning" : ""}"><span class="kho-stat-label">Sắp hết hạn</span><strong>${tongSap.toLocaleString("vi-VN")}</strong><small>trong ${CANH_BAO_THANG} tháng tới</small></div>
    ${q ? `<div class="kho-stat"><span class="kho-stat-label">Giá trị cần tiêu hủy</span><strong>${dinhDangTien(giaTriQua)}</strong><small>theo giá vốn bình quân</small></div>` : ""}
  </section>

  <section class="kho-card">
    <div class="kho-card-head kho-card-head-stack">
      <div><div><h2>Danh sách hàng theo hạn lưu kho</h2></div></div>
      <div class="kho-toolbar">
        <label style="font-size:13px">Hạn lưu kho <input id="hanNam" type="number" min="0" step="any" value="${Number(duLieuTrang.nam)}" style="width:70px"> năm</label>
        <button class="btn small" id="btnLuuNam">Lưu</button>
        <label style="font-size:13px"><input id="hanTatCa" type="checkbox" ${duLieuTrang.tatCa ? "checked" : ""}> Xem tất cả mã</label>
      </div>
    </div>
    <div class="kho-table-wrap">
      <table class="kho-table">
        <thead><tr><th>Sản phẩm</th><th>Kho</th><th>Tồn</th><th>Các lô còn trong kho</th><th>Quá hạn</th>${q ? "<th>Giá trị hủy</th><th></th>" : ""}</tr></thead>
        <tbody>${ds.map(r => `<tr>
          <td><strong>${maHoaHtml(r.s.san_pham?.ma_san_pham || "—")}</strong> ${r.s.san_pham?.hang_san_xuat ? `<span class="role-badge">${maHoaHtml(r.s.san_pham.hang_san_xuat)}</span>` : ""}</td>
          <td>${maHoaHtml(r.s.kho?.ten || "—")}</td>
          <td><strong>${Number(r.s.so_luong).toLocaleString("vi-VN")}</strong></td>
          <td>${r.lo.map(l => `<div style="font-size:12px;margin:2px 0">${l.sl} · ${l.tonDau ? "tồn có từ trước" : "nhập " + dinhDangNgay(l.ngay)} → hạn <b>${dinhDangNgay(l.han)}</b> ${NHAN_TT[l.tt]}</div>`).join("")}</td>
          <td>${r.qua > 0 ? `<strong style="color:#c0392b">${r.qua}</strong>` : "—"}</td>
          ${q ? `<td>${r.giaTri != null && r.qua > 0 ? dinhDangTien(r.giaTri) : "—"}</td>
          <td>${r.qua > 0 ? `<button class="btn small" data-tieu-huy="${r.s.san_pham_id}|${r.s.kho_id}">Tiêu hủy ${r.qua}</button>` : ""}</td>` : ""}
        </tr>`).join("") || `<tr><td colspan="${q ? 7 : 5}" class="empty">${duLieuTrang.tatCa ? "Kho chưa có hàng" : `Không có hàng quá hạn hoặc sắp hết hạn lưu kho ${Number(duLieuTrang.nam)} năm.`}</td></tr>`}</tbody>
      </table>
    </div>
  </section>`;
  ganDangXuat(nguCanh.supabase);
  ganSuKien();
}

function ganSuKien() {
  const nam = document.getElementById("hanNam");
  // Gõ số năm xong phải bấm Lưu (hoặc Enter) mới áp dụng, tránh lỡ tay sửa mà không để ý.
  const luuNam = () => {
    const v = Number(nam.value);
    if (!(v > 0)) { hienThongBaoNhanh("Số năm phải lớn hơn 0"); nam.value = duLieuTrang.nam; return; }
    duLieuTrang.nam = v;
    try { localStorage.setItem(KHOA_NHO_NAM, v); } catch {}
    hienThiTrang();
    hienThongBaoNhanh(`Đã lưu hạn lưu kho ${v} năm`);
  };
  document.getElementById("btnLuuNam").onclick = luuNam;
  nam.onkeydown = (e) => { if (e.key === "Enter") luuNam(); };
  const tatCa = document.getElementById("hanTatCa");
  tatCa.onchange = () => { duLieuTrang.tatCa = tatCa.checked; hienThiTrang(); };
  document.getElementById("btnInBienBan").onclick = inBienBan;
  const btnTatCa = document.getElementById("btnTieuHuyTatCa");
  if (btnTatCa) btnTatCa.onclick = () => tieuHuyTatCa(btnTatCa);
  document.querySelectorAll("[data-tieu-huy]").forEach(el => { el.onclick = () => tieuHuy(el.getAttribute("data-tieu-huy"), el); });
}

// ===== TẢI DỮ LIỆU =====
// Supabase trả tối đa 1000 dòng/lần nên đọc theo từng trang cho tới khi hết.
async function docHet(taoTruyVan) {
  const kq = [];
  for (let tu = 0; ; tu += 1000) {
    const { data, error } = await taoTruyVan().range(tu, tu + 999);
    if (error) { hienThongBaoNhanh("Lỗi tải dữ liệu: " + error.message); break; }
    kq.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return kq;
}

async function taiDuLieu() {
  const sb = nguCanh.supabase;
  duLieuTrang.ton = await docHet(() => sb.from("ton_kho").select("san_pham_id, kho_id, so_luong, san_pham(ma_san_pham, hang_san_xuat, ngay_tao), kho(ten)"));
  duLieuTrang.vao = await docHet(() => sb.from("giao_dich_kho").select("san_pham_id, kho_id, loai_giao_dich, so_luong, ngay_tao").in("loai_giao_dich", LOAI_VAO).order("ngay_tao"));
  duLieuTrang.costs = {};
  if (quanLy()) {   // giá vốn là dữ liệu nội bộ: RLS chỉ cho Kho/Admin đọc
    const { data } = await sb.from("gia_von_san_pham").select("san_pham_id, gia_von_binh_quan_vnd");
    (data || []).forEach(c => { duLieuTrang.costs[c.san_pham_id] = c.gia_von_binh_quan_vnd; });
  }
  hienThiTrang();
}

// ===== TIÊU HỦY =====
// 1 dòng giao dịch kho loại 'disposal' cho 1 mã tại 1 kho (DB tự trừ tồn kho).
function dongTieuHuy(r) {
  const ngayLo = r.lo.filter(l => l.tt === "qua").map(l => dinhDangNgay(l.ngay)).join(", ");
  return {
    san_pham_id: r.s.san_pham_id, kho_id: r.s.kho_id, loai_giao_dich: "disposal", so_luong: r.qua,
    ghi_chu_tham_chieu: `Tiêu hủy hàng tồn quá hạn lưu kho ${Number(duLieuTrang.nam)} năm (lô nhập ${ngayLo})`,
    nguoi_tao: nguCanh.staff.id
  };
}

// Tiêu hủy toàn bộ hàng quá hạn bằng MỘT lần xác nhận và MỘT lệnh insert (được cả hoặc không được gì).
async function tieuHuyTatCa(btn) {
  if (!quanLy()) return;
  const ds = tinhHanLuuKho(duLieuTrang).filter(r => r.qua > 0);
  if (!ds.length) return;
  const tong = ds.reduce((n, r) => n + r.qua, 0);
  if (!confirm(`Xác nhận ĐÃ TIÊU HỦY ${ds.length} mã (tổng ${tong} sản phẩm) quá hạn lưu kho ${Number(duLieuTrang.nam)} năm?\n\nTồn kho sẽ bị trừ. Không hoàn tác được.`)) return;
  btn.disabled = true;
  const { error } = await nguCanh.supabase.from("giao_dich_kho").insert(ds.map(dongTieuHuy));
  if (error) { btn.disabled = false; hienThongBaoNhanh("Không ghi được tiêu hủy: " + error.message); return; }
  hienThongBaoNhanh(`Đã ghi tiêu hủy ${ds.length} mã (${tong} sản phẩm).`);
  await taiDuLieu();
}

async function tieuHuy(key, btn) {
  if (!quanLy()) return;
  const [spId, khoId] = key.split("|");
  const r = tinhHanLuuKho(duLieuTrang).find(x => x.s.san_pham_id === spId && x.s.kho_id === khoId);
  if (!r || r.qua <= 0) return;
  const ma = r.s.san_pham?.ma_san_pham || "";
  if (!confirm(`Xác nhận ĐÃ TIÊU HỦY ${r.qua} sản phẩm ${ma} (kho ${r.s.kho?.ten || ""}) quá hạn lưu kho ${Number(duLieuTrang.nam)} năm?\n\nTồn kho sẽ bị trừ ${r.qua}. Không hoàn tác được.`)) return;
  btn.disabled = true;
  const { error } = await nguCanh.supabase.from("giao_dich_kho").insert(dongTieuHuy(r));
  if (error) { btn.disabled = false; hienThongBaoNhanh("Không ghi được tiêu hủy: " + error.message); return; }
  hienThongBaoNhanh(`Đã ghi tiêu hủy ${r.qua} sản phẩm ${ma}.`);
  await taiDuLieu();
}

// Biên bản tiêu hủy để in/ký: liệt kê toàn bộ hàng đang quá hạn theo hạn lưu kho hiện tại.
function inBienBan() {
  const ds = tinhHanLuuKho(duLieuTrang).filter(r => r.qua > 0);
  if (!ds.length) { hienThongBaoNhanh("Không có hàng quá hạn nên chưa cần lập biên bản."); return; }
  const w = window.open("", "_blank");
  if (!w) { hienThongBaoNhanh("Trình duyệt đang chặn cửa sổ in — hãy cho phép pop-up rồi thử lại."); return; }
  const q = quanLy();
  const tongSL = ds.reduce((n, r) => n + r.qua, 0);
  const tongGT = ds.reduce((n, r) => n + (r.giaTri || 0), 0);
  const dong = ds.map((r, i) => `<tr><td style="text-align:center">${i + 1}</td>
    <td>${maHoaHtml(r.s.san_pham?.ma_san_pham || "")}${r.s.san_pham?.hang_san_xuat ? " · " + maHoaHtml(r.s.san_pham.hang_san_xuat) : ""}</td>
    <td>${maHoaHtml(r.s.kho?.ten || "")}</td><td style="text-align:right">${r.qua}</td>
    <td>${r.lo.filter(l => l.tt === "qua").map(l => `${l.sl} (${l.tonDau ? "tồn cũ" : dinhDangNgay(l.ngay)})`).join("; ")}</td>
    ${q ? `<td style="text-align:right">${r.giaTri != null ? dinhDangTien(r.giaTri) : ""}</td>` : ""}</tr>`).join("");
  w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Biên bản tiêu hủy hàng quá hạn lưu kho</title>
    <style>body{font-family:Arial,sans-serif;font-size:13px;margin:32px;color:#111}h2{text-align:center;margin:18px 0 4px}
    table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #444;padding:6px 8px}th{background:#eee}
    .ky{display:flex;justify-content:space-around;margin-top:36px;text-align:center}.ky div{width:30%}</style></head><body>
    <b>${maHoaHtml(TEN_CONG_TY)}</b><br>${maHoaHtml(DIA_CHI_CONG_TY)}
    <h2>BIÊN BẢN TIÊU HỦY HÀNG TỒN QUÁ HẠN LƯU KHO</h2>
    <p style="text-align:center;margin:0 0 14px">Ngày lập: ${dinhDangNgay(new Date())}</p>
    <p>Căn cứ quy định: hàng nhập kho quá <b>${Number(duLieuTrang.nam)} năm</b> mà chưa bán phải tiêu hủy. Danh sách hàng thuộc diện tiêu hủy:</p>
    <table><thead><tr><th>STT</th><th>Sản phẩm</th><th>Kho</th><th>SL tiêu hủy</th><th>Lô nhập (SL – ngày nhập)</th>${q ? "<th>Giá trị (giá vốn BQ)</th>" : ""}</tr></thead>
    <tbody>${dong}<tr><td colspan="3"><b>Tổng cộng</b></td><td style="text-align:right"><b>${tongSL}</b></td><td></td>${q ? `<td style="text-align:right"><b>${dinhDangTien(tongGT)}</b></td>` : ""}</tr></tbody></table>
    <div class="ky"><div><b>Thủ kho</b><br><i>(ký, ghi rõ họ tên)</i></div><div><b>Kế toán</b><br><i>(ký, ghi rõ họ tên)</i></div><div><b>Giám đốc</b><br><i>(ký, đóng dấu)</i></div></div>
    </body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

(async () => {
  const login = await batBuocNhanVien(phanTuGoc, { requireRole: ['warehouse', 'admin'], activePage: "han-luu-kho.html" }); // Kinh doanh không có quyền vào
  if (!login) return;
  Object.assign(nguCanh, login);
  Object.assign(huyHieu, await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff));
  taiDuLieu();
})();
