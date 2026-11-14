/* ==========================================================================
   MỤC LỤC HÀM — staff/js/chiet-khau.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   coQuyenQuanLyChietKhau()  — Cho phép sales, warehouse, admin quản lý chiết khấu
   ngayYmdSangVN(d)          — Đổi chuỗi yyyy-mm-dd của ô ngày sang null nếu rỗng
   trangThaiQuyTac(r)        — Trạng thái 1 quy tắc chiết khấu (đã tắt/…) theo cờ hoạt động và ngày
   nhanPhamVi(r)             — Nhãn tiếng Việt của phạm vi áp dụng (all / product_type / products)
   nhanDieuKien(r)           — Nhãn điều kiện của quy tắc (số lượng tối thiểu, giá trị tối thiểu)
   taiTatCa()                [async]  — Tải quy tắc chiết khấu và danh sách loại sản phẩm
   hienThiFormThem()         — Vẽ form thêm quy tắc chiết khấu
   hienThiBang()             — Vẽ bảng quy tắc chiết khấu
   hienThiTrang()            — Vẽ toàn bộ trang chiết khấu
   ganSuKien()               — Gắn sự kiện thêm/sửa/bật tắt quy tắc
   ========================================================================== */
// Logic trang staff/chiet-khau.html — cấu hình chiết khấu theo SỐ LƯỢNG và/hoặc GIÁ TRỊ đơn hàng
// (mục 2 yêu cầu nghiệp vụ bổ sung). Không hard-code luật giảm giá trong code — mọi quy tắc nằm
// trong bảng discount_rules, admin cấu hình được số lượng tối thiểu / giá trị tối thiểu / % giảm /
// phạm vi áp dụng / thời gian áp dụng. Nếu nhiều quy tắc cùng đạt điều kiện, hệ thống (hàm SQL
// compute_best_discount) tự chọn mức % CAO NHẤT, không cộng dồn.
import { batBuocNhanVien, hienThiThanhBenNhanVien, layHuyHieuThanhBen, ganDangXuat, hienThongBaoNhanh } from "../nhan-vien-chung.js";
import { dinhDangTien } from "../../js/dung-chung/dinh-dang.js";
const phanTuGoc = document.getElementById("root");
let nguCanh = null, huyHieu = {};
let duLieuTrang = { rules: [], productTypes: [], showAdd: false, submitting: false };

function coQuyenQuanLyChietKhau() { return ['sales', 'warehouse', 'admin'].includes(nguCanh.staff.vai_tro); } // Kinh doanh cũng được quản lý chiết khấu
// Nhận chuỗi yyyy-mm-dd của <input type="date">, trả null nếu rỗng (khác dinhDangNgayVN dùng chung, vốn nhận mốc giờ ISO).
function ngayYmdSangVN(d) { return d ? new Date(d + "T00:00:00").toLocaleDateString("vi-VN") : null; }

function trangThaiQuyTac(r) {
  const today = new Date().toISOString().slice(0, 10);
  if (!r.dang_hoat_dong) return { label: "Đã tắt", cls: "cancelled" };
  if (r.ngay_bat_dau && today < r.ngay_bat_dau) return { label: "Chưa bắt đầu", cls: "pending" };
  if (r.ngay_ket_thuc && today > r.ngay_ket_thuc) return { label: "Đã hết hạn", cls: "cancelled" };
  return { label: "Đang áp dụng", cls: "completed" };
}
function nhanPhamVi(r) {
  if (r.pham_vi === "all") return "Toàn bộ sản phẩm";
  if (r.pham_vi === "product_type") {
    const t = duLieuTrang.productTypes.find(t => t.id === r.loai_san_pham_id);
    return t ? `Loại: ${t.hang_san_xuat} ${t.ma_loai}` : "Theo loại hình dáng";
  }
  return `${(r.danh_sach_ma_san_pham || []).length} mã: ${(r.danh_sach_ma_san_pham || []).slice(0, 3).join(", ")}${(r.danh_sach_ma_san_pham || []).length > 3 ? '…' : ''}`;
}
function nhanDieuKien(r) {
  const parts = [];
  if (r.so_luong_toi_thieu) parts.push(`≥ ${r.so_luong_toi_thieu} sản phẩm cùng loại`);
  if (r.gia_tri_don_toi_thieu) parts.push(`≥ ${dinhDangTien(r.gia_tri_don_toi_thieu)}`);
  return parts.length ? parts.join(" và ") : "Không điều kiện (áp dụng luôn)";
}

async function taiTatCa() {
  const [{ data: rules }, { data: types }] = await Promise.all([
    nguCanh.supabase.from("quy_tac_chiet_khau").select("*").order("ngay_tao", { ascending: false }),
    nguCanh.supabase.from("loai_san_pham").select("id, hang_san_xuat, ma_loai")
  ]);
  duLieuTrang.rules = rules || [];
  duLieuTrang.productTypes = types || [];
  hienThiTrang();
}

function hienThiFormThem() {
  return `
    <div class="panel" style="border-color:var(--blueprint);margin-bottom:16px">
      <p style="font-weight:700;font-size:13.5px;margin:0 0 10px">Quy tắc chiết khấu mới</p>
      <div style="display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <input id="npName" placeholder="Tên quy tắc (VD: Mua 10 giảm 10%)" style="flex:1;min-width:220px"/>
        <input id="npPercent" type="number" min="0" max="100" step="0.5" placeholder="% giảm" style="width:120px"/>
      </div>
      <p style="font-size:12px;color:var(--steel);margin:0 0 6px">Điều kiện áp dụng (để trống ô nào = không xét điều kiện đó):</p>
      <div style="display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <input id="npMinQty" type="number" min="0" placeholder="Số lượng tối thiểu cùng loại (VD: 10)" style="width:280px"/>
        <input id="npMinValue" type="number" min="0" placeholder="Giá trị nhóm SP tối thiểu (VNĐ)" style="width:240px"/>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap;align-items:center">
        <select id="npScope" style="width:220px">
          <option value="all">Áp dụng: Toàn bộ sản phẩm</option>
          <option value="products">Áp dụng: Vài mã sản phẩm cụ thể</option>
        </select>
      </div>
      <div id="npProductCodesWrap" style="display:none;margin-bottom:8px">
        <label style="font-size:12px;color:var(--steel)">Mã sản phẩm áp dụng (cách nhau bởi dấu phẩy)</label><br/>
        <textarea id="npProductCodes" rows="2" style="width:100%" placeholder="FU0276-K, FU0260-K"></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <div><label style="font-size:12px;color:var(--steel)">Bắt đầu (để trống = ngay bây giờ)</label><br/><input id="npStart" type="date" style="width:180px"/></div>
        <div><label style="font-size:12px;color:var(--steel)">Kết thúc (để trống = không giới hạn)</label><br/><input id="npEnd" type="date" style="width:180px"/></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
        <button class="btn ghost" id="cancelAdd">Hủy</button>
        <button class="btn" id="submitAdd">Thêm quy tắc</button>
      </div>
    </div>`;
}

function hienThiBang() {
  return `
    <table><thead><tr><th>Tên quy tắc</th><th>Điều kiện</th><th>Giảm</th><th>Phạm vi</th><th>Thời gian</th><th>Trạng thái</th>${coQuyenQuanLyChietKhau() ? '<th></th>' : ''}</tr></thead>
    <tbody>${duLieuTrang.rules.map(r => {
      const st = trangThaiQuyTac(r);
      return `<tr>
        <td><b>${r.ten}</b></td>
        <td style="font-size:12.5px">${nhanDieuKien(r)}</td>
        <td><b>${Number(r.phan_tram_chiet_khau)}%</b></td>
        <td>${nhanPhamVi(r)}</td>
        <td style="font-size:12px">${ngayYmdSangVN(r.ngay_bat_dau) || 'Ngay khi tạo'} → ${ngayYmdSangVN(r.ngay_ket_thuc) || 'Không giới hạn'}</td>
        <td><span class="badge ${st.cls}">${st.label}</span></td>
        ${coQuyenQuanLyChietKhau() ? `<td style="white-space:nowrap">
          <button class="btn small ghost" data-toggle="${r.id}">${r.dang_hoat_dong ? 'Tắt' : 'Bật'}</button>
          <button class="btn small ghost" data-delete="${r.id}" style="color:#c0392b">Xoá</button>
        </td>` : ''}
      </tr>`;
    }).join("") || `<tr><td colspan="7" class="empty">Chưa có quy tắc chiết khấu nào</td></tr>`}</tbody></table>`;
}

function hienThiTrang() {
  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'chiet-khau.html', huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <div class="toolbar"><h1 class="page-title" style="margin:0">Chiết khấu theo số lượng</h1>
    ${coQuyenQuanLyChietKhau() && !duLieuTrang.showAdd ? `<button class="btn" id="btnAdd">+ Thêm quy tắc</button>` : ''}
  </div>
  <p style="color:var(--steel);font-size:13px;margin:-10px 0 20px">
    Chiết khấu <b>tự động áp dụng</b> khi khách mua đủ số lượng/giá trị cùng 1 loại sản phẩm trong đơn — hiển thị rõ trên báo giá và đơn hàng. Nếu đạt nhiều quy tắc cùng lúc, hệ thống chỉ áp mức % <b>cao nhất</b>, không cộng dồn.
    ${!coQuyenQuanLyChietKhau() ? '<br/>🔒 Quản trị viên, Kinh doanh và Thủ kho được thêm/sửa/xoá quy tắc.' : ''}
  </p>
  ${duLieuTrang.showAdd ? hienThiFormThem() : ''}
  ${hienThiBang()}
  `;
  document.getElementById("khuVucModal").innerHTML = "";
  ganDangXuat(nguCanh.supabase);
  ganSuKien();
}

function ganSuKien() {
  const btnAdd = document.getElementById("btnAdd");
  if (btnAdd) btnAdd.onclick = () => { duLieuTrang.showAdd = true; hienThiTrang(); };
  const cancelAdd = document.getElementById("cancelAdd");
  if (cancelAdd) cancelAdd.onclick = () => { duLieuTrang.showAdd = false; hienThiTrang(); };

  const npScope = document.getElementById("npScope");
  const npProductCodesWrap = document.getElementById("npProductCodesWrap");
  if (npScope) npScope.onchange = () => {
    npProductCodesWrap.style.display = npScope.value === "products" ? "block" : "none";
  };

  const submitAdd = document.getElementById("submitAdd");
  if (submitAdd) submitAdd.onclick = async () => {
    if (duLieuTrang.submitting) return;
    const ten = document.getElementById("npName").value.trim();
    const phan_tram_chiet_khau = Number(document.getElementById("npPercent").value);
    const so_luong_toi_thieu = Number(document.getElementById("npMinQty").value) || null;
    const gia_tri_don_toi_thieu = Number(document.getElementById("npMinValue").value) || null;
    const pham_vi = document.getElementById("npScope").value;
    const danh_sach_ma_san_pham = pham_vi === "products"
      ? document.getElementById("npProductCodes").value.split(",").map(s => s.trim()).filter(Boolean)
      : null;
    // Ô ngày là <input type="date"> mặc định: .value là "yyyy-mm-dd" hoặc "" (để trống = không giới hạn).
    const ngay_bat_dau = document.getElementById("npStart").value || null;
    const ngay_ket_thuc = document.getElementById("npEnd").value || null;

    if (!ten) { hienThongBaoNhanh("Vui lòng nhập tên quy tắc"); return; }
    if (!phan_tram_chiet_khau || phan_tram_chiet_khau <= 0 || phan_tram_chiet_khau > 100) { hienThongBaoNhanh("Vui lòng nhập % giảm hợp lệ (0-100)"); return; }
    if (!so_luong_toi_thieu && !gia_tri_don_toi_thieu) { hienThongBaoNhanh("Cần ít nhất 1 điều kiện: số lượng tối thiểu hoặc giá trị tối thiểu"); return; }
    if (pham_vi === "products" && (!danh_sach_ma_san_pham || danh_sach_ma_san_pham.length === 0)) { hienThongBaoNhanh("Vui lòng nhập ít nhất 1 mã sản phẩm"); return; }
    if (ngay_bat_dau && ngay_ket_thuc && ngay_bat_dau > ngay_ket_thuc) { hienThongBaoNhanh("Ngày bắt đầu phải trước ngày kết thúc"); return; }

    duLieuTrang.submitting = true;
    submitAdd.disabled = true;
    submitAdd.textContent = "Đang thêm…";
    try {
      const { error } = await nguCanh.supabase.from("quy_tac_chiet_khau").insert({
        ten, phan_tram_chiet_khau, so_luong_toi_thieu, gia_tri_don_toi_thieu,
        pham_vi, danh_sach_ma_san_pham, ngay_bat_dau, ngay_ket_thuc, dang_hoat_dong: true, nguoi_tao: nguCanh.staff.id
      });
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("Đã thêm quy tắc chiết khấu");
      duLieuTrang.showAdd = false;
      taiTatCa();
    } catch (e) {
      hienThongBaoNhanh("Lỗi không xác định: " + e.message);
    } finally {
      duLieuTrang.submitting = false;
    }
  };

  document.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-toggle");
      const rule = duLieuTrang.rules.find(r => r.id === id);
      const { error } = await nguCanh.supabase.from("quy_tac_chiet_khau").update({ dang_hoat_dong: !rule.dang_hoat_dong }).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      taiTatCa();
    };
  });

  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Xoá vĩnh viễn quy tắc chiết khấu này?")) return;
      const id = btn.getAttribute("data-delete");
      const { error } = await nguCanh.supabase.from("quy_tac_chiet_khau").delete().eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("Đã xoá quy tắc");
      taiTatCa();
    };
  });
}

(async () => {
  nguCanh = await batBuocNhanVien(phanTuGoc, { requireRole: ['sales', 'warehouse', 'admin'], activePage: "chiet-khau.html" });
  if (!nguCanh) return;
  huyHieu = await layHuyHieuThanhBen(nguCanh.supabase, nguCanh.staff);
  taiTatCa();
})();
