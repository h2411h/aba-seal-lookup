/* ==========================================================================
   MỤC LỤC HÀM — staff/js/kho/hop-thoai.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang()           — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   hienThiHopThemSanPham()  [export]  — Vẽ hộp thoại thêm sản phẩm
   hienThiHopGiaoDich()     [export]  — Vẽ hộp thoại ghi giao dịch kho
   ganSuKienHopThoai()      [export]  — Gắn sự kiện cho hộp thoại thêm sản phẩm / giao dịch / sửa giá
   ========================================================================== */
// Hộp thoại "Thêm sản phẩm" và "Giao dịch kho" cùng sự kiện của chúng (kể cả sửa giá bán).
import { hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { nguCanh, duLieuTrang } from "./du-lieu-trang.js";
import { taiDuLieu } from "./tai-du-lieu.js";
import { soHoacNull, taoSoPhieuNhap, CHUA_CO_HOA_DON } from "./tien-ich.js";
import { hanhDong } from "./du-lieu-trang.js";
import { dinhDangTien } from "../../../js/dung-chung/dinh-dang.js";
const hienThiTrang = () => hanhDong.render(); // hienThiTrang nằm ở kho.js; gọi qua actions để tránh import vòng

// ===== GIAO DIỆN MODAL =====
export function hienThiHopThemSanPham() {
  const sua = duLieuTrang.suaSanPham;           // có giá trị = đang sửa; null = thêm mới
  const v = (x) => (x ?? "");
  const o = (id, nhan, gt = "", type = "text") => `<div class="field"><label class="field-label">${nhan}</label><input id="${id}" type="${type}" ${type === "number" ? 'step="0.01"' : ""} value="${v(gt)}" style="width:100%"/></div>`;
  return `<div style="position:fixed;inset:0;background:rgba(10,16,24,.55);display:flex;z-index:var(--z-modal);padding:20px;box-sizing:border-box;overflow-y:auto">
    <div style="margin:auto;background:#fff;border-radius:6px;padding:22px 26px;width:100%;max-width:560px">
      <h3 style="margin:0 0 12px">${sua ? "Sửa sản phẩm " + sua.ma_san_pham : "Thêm sản phẩm mới"}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 12px">
        <div style="grid-column:span 2">${o("apCode", "Mã hàng *", sua?.ma_san_pham)}</div>
        ${o("apBrand", "Hãng", sua?.hang_san_xuat)}
        ${o("apId", "ĐK trong (mm)", sua?.duong_kinh_trong, "number")}
        ${o("apOd", "ĐK ngoài (mm)", sua?.duong_kinh_ngoai, "number")}
        ${o("apTh", "Độ dày (mm)", sua?.do_day, "number")}
        <div style="grid-column:span 3">${o("apMaterial", "Vật liệu", sua?.vat_lieu)}</div>
      </div>
      ${sua ? "" : `
      <hr style="border:none;border-top:1px solid var(--line-soft);margin:6px 0 12px"/>
      <p style="font-weight:700;font-size:13px;margin:0 0 8px">Nhập kho lần đầu</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 12px">
        <div class="field"><label class="field-label">Kho</label><select id="apWarehouse" style="width:100%">${duLieuTrang.warehouses.map(w=>`<option value="${w.id}">${w.ten}</option>`).join("")}</select></div>
        <div class="field"><label class="field-label">Số lượng *</label><input id="apQty" type="number" min="1" value="1" style="width:100%"/></div>
        <div class="field"><label class="field-label">Giá nhập / cái (VNĐ) *</label><input id="apCost" type="number" min="0" style="width:100%"/></div>
      </div>
      <p style="font-size:11px;color:var(--steel);margin:-6px 0 8px" id="apCostTotal"></p>
      <div class="field"><label class="field-label">Số hóa đơn của nhà cung cấp (không bắt buộc)</label><input id="apNote" placeholder="VD: HĐ 00123 — số phiếu nhập tự tạo khi lưu" style="width:100%"/></div>`}
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px">
        <button class="btn ghost" id="apCancel">Hủy</button>
        <button class="btn" id="apSubmit">${sua ? "Lưu thay đổi" : "Tạo sản phẩm"}</button>
      </div>
    </div>
  </div>`;
}

// Chỉ còn XUẤT KHO không bán hàng (hàng hỏng, hao hụt, xuất mẫu, trả nhà cung cấp). Hàng quá hạn lưu kho thì tiêu hủy ở trang Hạn lưu kho.
// - Nhập kho: dùng nút "Nhập kho nhiều mã" (nhập 1 mã thì điền 1 dòng).
// - Bán cho khách: tạo đơn ở trang Đơn hàng, hệ thống tự xuất kho khi chuyển "Đang giao" và tính tiền ở đơn.
const LY_DO_XUAT_KHO = ["Hàng hỏng / lỗi", "Hao hụt / kiểm kê thiếu", "Xuất mẫu / biếu tặng", "Trả nhà cung cấp", "Điều chỉnh nhập nhầm"];

export function hienThiHopGiaoDich() {
  return `<div style="position:fixed;inset:0;background:rgba(10,16,24,.55);display:flex;z-index:var(--z-modal);padding:20px;box-sizing:border-box;overflow-y:auto">
    <div style="margin:auto;background:#fff;border-radius:6px;padding:26px;width:100%;max-width:420px">
      <h3 style="margin-top:0">Xuất kho (không bán hàng)</h3>
      <div style="background:var(--amber-soft);border-radius:6px;padding:10px 12px;font-size:12.5px;margin-bottom:14px">
        ⚠️ <b>Bán cho khách?</b> Hãy tạo đơn ở trang <b>Đơn hàng</b> — hệ thống sẽ tự xuất kho và tính tiền. Xuất ở đây <b>không tạo doanh thu</b>.
      </div>
      <div class="field"><label>Mã sản phẩm (chính xác)</label><input id="tCode" style="width:100%" placeholder="VD: FU0357-K"/></div>
      <div class="field"><label>Kho</label><select id="tWarehouse" style="width:100%">${duLieuTrang.warehouses.map(w=>`<option value="${w.id}">${w.ten}</option>`).join("")}</select></div>
      <div class="field"><label>Số lượng</label><input id="tQty" type="number" min="1" value="1" style="width:100%"/></div>
      <div class="field"><label>Lý do xuất kho *</label><select id="tReason" style="width:100%">${LY_DO_XUAT_KHO.map(r=>`<option>${r}</option>`).join("")}</select></div>
      <div class="field"><label>Ghi chú thêm (không bắt buộc)</label><input id="tNote" placeholder="VD: lô hỏng do ẩm; hoặc số phiếu nhập bị nhầm PN-20261031-001" style="width:100%"/></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn ghost" id="tCancel">Hủy</button>
        <button class="btn" id="tSubmit">Xuất kho</button>
      </div>
    </div>
  </div>`;
}

// Gắn sự kiện cho hộp thoại thêm sản phẩm / giao dịch / sửa giá (tách ra từ hienThiTrang).
export function ganSuKienHopThoai() {

  const btnNewTrans = document.getElementById("btnNewTrans");
  if (btnNewTrans) btnNewTrans.onclick = () => { duLieuTrang.showTransModal = true; hienThiTrang(); };
  const tCancel = document.getElementById("tCancel");
  if (tCancel) tCancel.onclick = () => { duLieuTrang.showTransModal = false; hienThiTrang(); };

  const btnAddProduct = document.getElementById("btnAddProduct");
  if (btnAddProduct) btnAddProduct.onclick = () => { duLieuTrang.showAddProductModal = true; hienThiTrang(); };
  const apCancel = document.getElementById("apCancel");
  if (apCancel) apCancel.onclick = () => { duLieuTrang.showAddProductModal = false; duLieuTrang.suaSanPham = null; hienThiTrang(); };
  // Nút "Sửa" ở bảng tồn kho: mở lại đúng form này, đã điền sẵn thông số hiện có.
  document.querySelectorAll("[data-edit-sp]").forEach(el => {
    el.onclick = () => {
      const row = duLieuTrang.warehouseStock.find(x => x.san_pham_id === el.getAttribute("data-edit-sp"));
      duLieuTrang.suaSanPham = row?.san_pham || null;
      duLieuTrang.showAddProductModal = !!duLieuTrang.suaSanPham;
      hienThiTrang();
    };
  });
  const apQtyEl = document.getElementById("apQty");
  const apCostEl = document.getElementById("apCost");
  const apCostTotal = document.getElementById("apCostTotal");
  if (apQtyEl && apCostEl && apCostTotal) {
    const syncApTotal = () => {
      const q = Number(apQtyEl.value) || 0, c = Number(apCostEl.value) || 0;
      apCostTotal.textContent = (q > 0 && c > 0) ? `= Tổng tiền lô này: ${dinhDangTien((q * c))} (${q} × ${dinhDangTien(c)})` : "";
    };
    apQtyEl.oninput = syncApTotal; apCostEl.oninput = syncApTotal; syncApTotal();
  }
  const apSubmit = document.getElementById("apSubmit");
  if (apSubmit) apSubmit.onclick = async () => {
    const { supabase, staff } = nguCanh;
    const thongSo = () => ({
      hang_san_xuat: document.getElementById("apBrand").value.trim() || null,
      duong_kinh_trong: soHoacNull(document.getElementById("apId").value),
      duong_kinh_ngoai: soHoacNull(document.getElementById("apOd").value),
      do_day: soHoacNull(document.getElementById("apTh").value),
      vat_lieu: document.getElementById("apMaterial").value.trim() || null
    });
    if (duLieuTrang.suaSanPham) {            // chế độ SỬA: cập nhật mã + thông số, không đụng tới kho/giá
      const maMoi = document.getElementById("apCode").value.trim();
      if (!maMoi) { hienThongBaoNhanh("Mã hàng không được để trống"); return; }
      const { data: trung } = await supabase.from("san_pham").select("id").eq("ma_san_pham", maMoi).neq("id", duLieuTrang.suaSanPham.id).limit(1);
      if (trung?.length) { hienThongBaoNhanh("Mã " + maMoi + " đã có sản phẩm khác dùng — không đổi được"); return; }
      const { error } = await supabase.from("san_pham").update({ ma_san_pham: maMoi, ...thongSo() }).eq("id", duLieuTrang.suaSanPham.id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("Đã cập nhật sản phẩm " + maMoi);
      duLieuTrang.showAddProductModal = false; duLieuTrang.suaSanPham = null;
      taiDuLieu();
      return;
    }
    const code = document.getElementById("apCode").value.trim();
    const warehouseId = document.getElementById("apWarehouse").value;
    const qty = Number(document.getElementById("apQty").value);
    const cost = document.getElementById("apCost").value;
    const ghi_chu = document.getElementById("apNote").value.trim();
    if (!code) { hienThongBaoNhanh("Vui lòng nhập mã hàng"); return; }
    if (!qty || qty <= 0) { hienThongBaoNhanh("Số lượng nhập phải lớn hơn 0"); return; }
    if (cost === "" || Number(cost) < 0) { hienThongBaoNhanh("Vui lòng nhập giá nhập/đơn vị để hệ thống tính giá vốn"); return; }
    const { data: existing } = await supabase.from("san_pham").select("id").eq("ma_san_pham", code).maybeSingle();
    if (existing) { hienThongBaoNhanh("Mã hàng này đã tồn tại — vào Sản phẩm để sửa ảnh/mô tả, hoặc Kho hàng để ghi thêm giao dịch nhập"); return; }
    const { data: newProd, error: prodErr } = await supabase.from("san_pham").insert({
      ma_san_pham: code, ...thongSo(), don_vi_tinh: 'Cái',
      so_luong_ton: 0, gia_le_vnd: 0
    }).select().single();
    if (prodErr) { hienThongBaoNhanh("Lỗi tạo sản phẩm: " + prodErr.message); return; }
    const soPhieu = await taoSoPhieuNhap(supabase);
    const { error: transErr } = await supabase.from("giao_dich_kho").insert({
      san_pham_id: newProd.id, kho_id: warehouseId, loai_giao_dich: 'import',
      so_luong: qty, don_gia_von: Number(cost), so_phieu: soPhieu, ghi_chu_tham_chieu: ghi_chu || CHUA_CO_HOA_DON, nguoi_tao: staff.id
    });
    if (transErr) { hienThongBaoNhanh("Đã tạo sản phẩm nhưng lỗi ghi giao dịch nhập: " + transErr.message); duLieuTrang.showAddProductModal = false; taiDuLieu(); return; }
    hienThongBaoNhanh(`Đã tạo sản phẩm ${code} — phiếu nhập ${soPhieu}`);
    duLieuTrang.showAddProductModal = false;
    taiDuLieu();
  };

  document.querySelectorAll("[data-save-price]").forEach(el => {
    el.onclick = async () => {
      const productId = el.getAttribute("data-save-price");
      const row = duLieuTrang.warehouseStock.find(s => s.san_pham_id === productId);
      const price = Number(document.querySelector(`[data-price="${productId}"]`).value);
      const oldPrice = row?.san_pham?.gia_le_vnd ?? 0;
      if (Number(oldPrice) === price) { hienThongBaoNhanh("Không có thay đổi nào để lưu"); return; }
      const { error } = await nguCanh.supabase.from("san_pham").update({ gia_le_vnd: price }).eq("id", productId);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("Đã lưu giá bán");
      taiDuLieu();
    };
  });

  const tSubmit = document.getElementById("tSubmit");
  if (tSubmit) tSubmit.onclick = async () => {
    const { supabase, staff } = nguCanh;
    const code = document.getElementById("tCode").value.trim();
    const warehouseId = document.getElementById("tWarehouse").value;
    const qty = Number(document.getElementById("tQty").value);
    const lyDo = document.getElementById("tReason").value;
    const ghiThem = document.getElementById("tNote").value.trim();
    const ghi_chu = "Xuất kho không bán — " + lyDo + (ghiThem ? ": " + ghiThem : "");
    if (!code) { hienThongBaoNhanh("Vui lòng nhập mã sản phẩm"); return; }
    if (!(qty >= 1)) { hienThongBaoNhanh("Số lượng phải từ 1 trở lên"); return; }
    const { data: prod } = await supabase.from("san_pham").select("id, so_luong_ton").eq("ma_san_pham", code).single();
    if (!prod) { hienThongBaoNhanh("Không tìm thấy mã sản phẩm " + code); return; }
    // Ghi lại giá vốn bình quân lúc xuất để lịch sử có số tiền (giá trị hàng rời kho). Không làm đổi giá vốn bình quân.
    const { data: giaVon } = await supabase.from("gia_von_san_pham").select("gia_von_binh_quan_vnd").eq("san_pham_id", prod.id).maybeSingle();
    const payload = {
      san_pham_id: prod.id, kho_id: warehouseId, loai_giao_dich: "export",
      so_luong: qty, don_gia_von: giaVon?.gia_von_binh_quan_vnd ?? null, ghi_chu_tham_chieu: ghi_chu, nguoi_tao: staff.id
    };
    const { error } = await supabase.from("giao_dich_kho").insert(payload);
    if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
    duLieuTrang.showTransModal = false;
    hienThongBaoNhanh("Đã xuất kho");
    taiDuLieu();
  };
}
