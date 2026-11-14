/* ==========================================================================
   MỤC LỤC HÀM — staff/js/san-pham.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   coQuyenKho()                      — Người dùng có phải warehouse/admin không
   hienThiOTonKho(p)                 — HTML ô số tồn (đỏ khi hết hàng, cam khi sắp hết); chỉ hiển thị, không sửa tay
   taiDanhSachSanPham()              [async]  — Tải danh sách sản phẩm từ bảng san_pham
   daLoc()                           — Lọc sản phẩm theo từ khóa
   taiAnhSanPham(file, productCode)  [async]  — Tải ảnh sản phẩm lên Storage (đặt tên mã-thời gian.đuôi)
   hienThiChiTietMoRong(p)           — Vẽ dòng chi tiết mở rộng của 1 sản phẩm
   hienThiTrang()                    — Vẽ trang quản lý sản phẩm
   ========================================================================== */
// Logic trang staff/san-pham.html — CHỈ quản lý ảnh, mô tả, thông số kỹ thuật & hiển thị của sản
// phẩm đã có. Theo yêu cầu: giá bán, tồn kho, và việc TẠO sản phẩm mới đều đã chuyển hẳn sang
// trang Kho hàng (kho.js) — vì một sản phẩm mới chỉ thực sự "tồn tại" khi có lô hàng nhập kho
// thật kèm giá vốn, tránh việc tạo sản phẩm/đặt giá tùy tiện không gắn với thực tế nhập hàng.
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, hienThongBaoNhanh, xuatRaExcel } from "../nhan-vien-chung.js";
import { maHoaHtml } from "../../js/dung-chung/dinh-dang.js";
import { laHetHang, laSapHet } from "../../js/dung-chung/ton-kho.js";

const phanTuGoc = document.getElementById("root");
let nguCanh = null;
let huyHieu = {};
let duLieuTrang = { products: [], q: "", expandedId: null, uploading: false, tonTheoKho: {} };

// Kinh doanh không có quyền vào trang Kho hàng → các dòng hướng dẫn "vào Kho hàng" phải đổi lời.
const coQuyenKho = () => ['warehouse', 'admin'].includes(nguCanh.staff.vai_tro);

// Số lượng tồn lấy từ san_pham.so_luong_ton — cột này do trigger của Kho hàng tự cộng/trừ mỗi khi
// nhập/xuất/chuyển kho, nên luôn khớp với trang Kho hàng, trang này CHỈ HIỂN THỊ (không sửa tay).
function hienThiOTonKho(p) {
  const n = Number(p.so_luong_ton ?? 0);
  const mau = laHetHang(n) ? '#c0392b' : (laSapHet(n) ? '#d97706' : 'inherit');
  const nhan = laHetHang(n) ? '<div style="font-size:10px;color:#c0392b">Hết hàng</div>'
    : (laSapHet(n) ? '<div style="font-size:10px;color:#d97706">Sắp hết</div>' : '');
  return `<b style="color:${mau}">${n.toLocaleString("vi-VN")}</b>${nhan}`;
}

async function taiDanhSachSanPham() {
  const { data, error } = await nguCanh.supabase.from("san_pham").select("*").order("ma_san_pham");
  if (error) { hienThongBaoNhanh("Lỗi tải sản phẩm: " + error.message); return; }
  duLieuTrang.products = data || [];
  // Chi tiết tồn theo từng kho: chỉ Thủ kho/Admin (Kinh doanh không đọc bảng ton_kho).
  duLieuTrang.tonTheoKho = {};
  if (coQuyenKho()) {
    const { data: ton } = await nguCanh.supabase.from("ton_kho").select("san_pham_id, so_luong, kho(ten)");
    (ton || []).forEach(t => { (duLieuTrang.tonTheoKho[t.san_pham_id] ||= []).push(t); });
  }
  hienThiTrang();
}

function daLoc() {
  if (!duLieuTrang.q.trim()) return duLieuTrang.products;
  const q = duLieuTrang.q.trim().toLowerCase();
  return duLieuTrang.products.filter(p => (p.ma_san_pham||'').toLowerCase().includes(q) || (p.hang_san_xuat||'').toLowerCase().includes(q));
}


async function taiAnhSanPham(file, productCode) {
  const ext = file.name.split(".").pop();
  const path = `${productCode}-${Date.now()}.${ext}`;
  const { error } = await nguCanh.supabase.storage.from("product-images").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = nguCanh.supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

function hienThiChiTietMoRong(p) {
  return `<tr class="expand-row"><td colspan="9"><div class="expand-panel">
    <div class="img-row">
      ${p.url_anh ? `<img src="${p.url_anh}" class="img-preview"/>` : `<div class="img-preview" style="display:flex;align-items:center;justify-content:center;color:var(--steel);font-size:26px">🖼️</div>`}
      <div style="flex:1">
        <label class="field-label">Ảnh sản phẩm</label>
        <input type="file" accept="image/*" data-image-input="${p.id}" style="display:block;margin:6px 0"/>
        <p style="font-size:11px;color:var(--steel);margin:0">${duLieuTrang.uploading===p.id ? 'Đang tải ảnh lên...' : 'Chọn ảnh để thay — lưu tự động ngay khi chọn xong.'}</p>
      </div>
    </div>
    <div class="field"><label class="field-label">Mô tả thêm cho sản phẩm (hiển thị cho khách)</label><textarea rows="2" data-note="${p.id}" style="width:100%">${maHoaHtml(p.ghi_chu) || ''}</textarea></div>
    <div style="display:flex;gap:20px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <label style="font-size:12.5px;display:flex;align-items:center;gap:6px">Thứ tự hiển thị <input type="number" data-order2="${p.id}" value="${p.thu_tu_hien_thi ?? 0}" style="width:70px"/></label>
      <button class="btn small" data-save-detail="${p.id}">Lưu chi tiết</button>
    </div>
    <p style="font-size:12px;color:var(--steel);margin:10px 0 0">
      ${coQuyenKho() ? 'Thông số lấy từ trang Kho hàng — muốn sửa, vào Kho hàng bấm "Sửa"' : 'Thông số do bộ phận Kho quản lý — cần sửa hãy báo Thủ kho'}: <b>${p.hang_san_xuat || '—'}</b> ·
      ${p.duong_kinh_trong ?? '—'} × ${p.duong_kinh_ngoai ?? '—'} × ${p.do_day ?? '—'} mm ·
      vật liệu <b>${p.vat_lieu || '—'}</b> · ĐVT ${p.don_vi_tinh || 'Cái'}
    </p>
    <p style="font-size:12px;color:var(--steel);margin:6px 0 0">
      Tồn kho tổng: <b>${Number(p.so_luong_ton ?? 0).toLocaleString("vi-VN")}</b>
      ${(duLieuTrang.tonTheoKho[p.id] || []).length ? ' — theo kho: ' + duLieuTrang.tonTheoKho[p.id].map(t => `${t.kho?.ten || '—'}: <b>${t.so_luong}</b>`).join(' · ') : ''}
    </p>
  </div></td></tr>`;
}

function hienThiTrang() {
  const list = daLoc();
  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'san-pham.html', huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <div class="toolbar">
    <h1 class="page-title" style="margin:0">Sản phẩm — Ảnh &amp; Mô tả</h1>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input id="qSearch" placeholder="Tìm mã hàng / hãng..." value="${duLieuTrang.q}" style="width:200px"/>
      <button class="btn ghost" id="btnExport">⬇ Xuất Excel</button>
    </div>
  </div>
  <p style="font-size:12px;color:var(--steel);margin:-8px 0 14px">
    Trang này chỉ để quản lý ảnh, mô tả, thông số kỹ thuật &amp; hiển thị của sản phẩm ĐÃ CÓ.
    ${coQuyenKho()
      ? 'Muốn <b>thêm sản phẩm mới</b> hoặc sửa <b>giá bán / tồn kho</b>, vào trang <b>Kho hàng</b> — vì sản phẩm mới chỉ thực sự tồn tại khi gắn với 1 lô hàng nhập kho thật.'
      : 'Cột <b>Tồn kho</b> được đồng bộ tự động từ bộ phận Kho (chỉ xem). Cần thêm sản phẩm mới hoặc chỉnh giá / tồn, hãy báo Thủ kho hoặc Quản trị viên.'}
  </p>

  <table><thead><tr><th></th><th>Mã hàng</th><th>Hãng</th><th>Kích thước (ID×OD×TH)</th><th>ĐVT</th><th>Giá bán lẻ</th><th>Tồn kho</th><th>Đang bán</th><th></th></tr></thead>
  <tbody>${list.map(p => `
    <tr>
      <td>${p.url_anh ? `<img src="${p.url_anh}" class="prod-thumb"/>` : `<div class="prod-thumb-empty">🖼️</div>`}</td>
      <td><b>${p.ma_san_pham}</b></td>
      <td>${p.hang_san_xuat || '—'}</td>
      <td>${[p.duong_kinh_trong,p.duong_kinh_ngoai,p.do_day].filter(v=>v!=null).join(' × ') || '—'}</td>
      <td>${p.don_vi_tinh || 'Cái'}</td>
      <td>${p.gia_le_vnd != null ? Number(p.gia_le_vnd).toLocaleString("vi-VN")+'₫' : '—'}${coQuyenKho() ? '<div style="font-size:10px;color:var(--steel)">Sửa ở Kho hàng</div>' : ''}</td>
      <td>${hienThiOTonKho(p)}</td>
      <td><input type="checkbox" data-active="${p.id}" ${p.dang_hoat_dong?'checked':''}/></td>
      <td><button class="btn small ghost" data-expand="${p.id}">${duLieuTrang.expandedId===p.id?'Thu gọn':'Chi tiết'}</button></td>
    </tr>
    ${duLieuTrang.expandedId === p.id ? hienThiChiTietMoRong(p) : ''}
  `).join("") || `<tr><td colspan="9" class="empty">${duLieuTrang.q ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}</td></tr>`}</tbody></table>
  `;
  document.getElementById("khuVucModal").innerHTML = "";
  ganDangXuat(nguCanh.supabase);

  document.getElementById("qSearch").oninput = (e) => {
    duLieuTrang.q = e.target.value;
    const cursorPos = e.target.selectionStart;
    hienThiTrang();
    const el = document.getElementById("qSearch");
    el.focus();
    el.setSelectionRange(cursorPos, cursorPos);
  };

  // Xuất đúng danh sách đang hiển thị.
  document.getElementById("btnExport").onclick = () => {
    const rows = daLoc().map(p => ({
      ma_san_pham: p.ma_san_pham, hang_san_xuat: p.hang_san_xuat || "", duong_kinh_trong: p.duong_kinh_trong ?? "",
      duong_kinh_ngoai: p.duong_kinh_ngoai ?? "", do_day: p.do_day ?? "", vat_lieu: p.vat_lieu || "",
      don_vi_tinh: p.don_vi_tinh || "Cái", so_luong_ton: p.so_luong_ton ?? 0, dang_hoat_dong: p.dang_hoat_dong ? "TRUE" : "FALSE",
      ghi_chu: p.ghi_chu || ""
    }));
    xuatRaExcel("san-pham-" + new Date().toISOString().slice(0, 10), "SanPham", rows);
  };

  // "Đang bán" ảnh hưởng khách có mua được không nên vẫn giữ yêu cầu khai báo lý do khi đổi —
  // không phải dữ liệu tài chính nhưng vẫn có tác động vận hành thực tế.
  document.querySelectorAll("[data-active]").forEach(el => {
    el.onchange = async () => {
      const id = el.getAttribute("data-active");
      const newActive = el.checked;
      const { error } = await nguCanh.supabase.from("san_pham").update({ dang_hoat_dong: newActive }).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); el.checked = !newActive; return; }
      hienThongBaoNhanh("Đã lưu");
      taiDanhSachSanPham();
    };
  });

  document.querySelectorAll("[data-expand]").forEach(el => {
    el.onclick = () => { const id = el.getAttribute("data-expand"); duLieuTrang.expandedId = duLieuTrang.expandedId===id ? null : id; hienThiTrang(); };
  });

  document.querySelectorAll("[data-image-input]").forEach(el => {
    el.onchange = async (e) => {
      const id = el.getAttribute("data-image-input");
      const file = e.target.files[0];
      if (!file) return;
      const product = duLieuTrang.products.find(p => p.id === id);
      duLieuTrang.uploading = id; hienThiTrang();
      try {
        const url = await taiAnhSanPham(file, product.ma_san_pham);
        const { error } = await nguCanh.supabase.from("san_pham").update({ url_anh: url }).eq("id", id);
        if (error) throw error;
        hienThongBaoNhanh("Đã cập nhật ảnh sản phẩm");
      } catch (err) {
        hienThongBaoNhanh("Lỗi tải ảnh: " + err.message);
      }
      duLieuTrang.uploading = false;
      taiDanhSachSanPham();
    };
  });

  document.querySelectorAll("[data-save-detail]").forEach(el => {
    el.onclick = async () => {
      const id = el.getAttribute("data-save-detail");
      const ghi_chu = document.querySelector(`[data-note="${id}"]`).value.trim();
      const order = Number(document.querySelector(`[data-order2="${id}"]`).value) || 0;
      const { error } = await nguCanh.supabase.from("san_pham").update({
        ghi_chu: ghi_chu || null, thu_tu_hien_thi: order
      }).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("Đã lưu chi tiết sản phẩm");
      taiDanhSachSanPham();
    };
  });
}

(async () => {
  nguCanh = await batBuocNhanVien(phanTuGoc, { requireRole: ['sales', 'warehouse', 'admin'], activePage: "san-pham.html" });
  if (!nguCanh) return;
  huyHieu = await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff);
  taiDanhSachSanPham();
})();
