/* ==========================================================================
   MỤC LỤC HÀM — customer/js/danh-muc.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   stockBadge(qty)    — HTML nhãn tồn kho trên thẻ sản phẩm (ngưỡng "sắp hết" ở đây là 20, KHÁC ton-kho.js là 30)
   parseSizeQuery(q)  — ★ TÌM KIẾM: nhận dạng chuỗi kích thước dạng 20x30x5 bằng regex (trả null nếu không phải)
   filtered()         — ★ TÌM KIẾM: lọc mảng sản phẩm theo hãng + (kích thước ±0,5 mm hoặc mã/hãng)
   hienThiTrang()     — Vẽ trang danh mục: bộ lọc, lưới sản phẩm, phân trang (12 sản phẩm/trang)
   ========================================================================== */
// Logic trang danh-muc.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
import { supabase, daCauHinh } from "../../js/dung-chung/ket-noi-supabase.js";
import { chuyenGioHangCu, themVaoGioHang, capNhatSoGioHangTrenMenu } from "../../js/dung-chung/luu-gio-hang.js";
import { hienThongBaoNhanh, chuyenDenDangNhap } from "../../js/dung-chung/trang-chung.js";
import { maHoaHtml, dinhDangTien } from "../../js/dung-chung/dinh-dang.js";
const phanTuGoc = document.getElementById("cat-root");

if (!daCauHinh) {
  phanTuGoc.innerHTML = `<div class="empty"><b>Chưa cấu hình.</b> Mở file <code>config.js</code>, điền SUPABASE_ANON_KEY thật rồi tải lại trang.</div>`;
} else {

chuyenGioHangCu();

let state = { products: [], q: "", hang_san_xuat: "all", loading: true, session: null, trang: 1 };
const SO_SP_MOI_TRANG = 12; // lưới 4 cột → 12 sản phẩm = 3 hàng đầy, không bị lẻ hàng cuối

// Giỏ hàng: toàn bộ logic nằm ở js/dung-chung/luu-gio-hang.js (mỗi tài khoản 1 giỏ riêng). Trang này chỉ gọi lại.
capNhatSoGioHangTrenMenu(state.session);

const ICONS = {
  oil_seal: `<svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="18" height="36" stroke="#2b5f8a" stroke-width="2.5"/><path d="M28 10 L58 22 L58 34 L28 46" stroke="#2b5f8a" stroke-width="2.5" stroke-linejoin="round"/><line x1="10" y1="28" x2="70" y2="28" stroke="#e2810f" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`,
  packing: `<svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 12 L34 12 L46 24 L46 32 L34 44 L14 44 Z" stroke="#2b5f8a" stroke-width="2.5" stroke-linejoin="round"/><line x1="6" y1="28" x2="66" y2="28" stroke="#e2810f" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`,
  default: `<svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="28" r="20" stroke="#2b5f8a" stroke-width="2.5"/><circle cx="40" cy="28" r="8" stroke="#e2810f" stroke-width="2.5"/></svg>`
};

function stockBadge(qty) {
  if (qty <= 0) return `<span class="stock-badge out">Hết hàng</span>`;
  if (qty < 20) return `<span class="stock-badge low">Còn ${qty}</span>`;
  return `<span class="stock-badge ok">Còn ${qty}</span>`;
}

function parseSizeQuery(q) {
  if (!q) return null;
  return q.replace(/\s/g,"").replace(/[×xX]/g,"*").match(/^(\d+\.?\d*)\*(\d+\.?\d*)\*(\d+\.?\d*)$/);
}

function filtered() {
  const q = state.q.trim();
  const qLower = q.toLowerCase();
  const sizeMatch = parseSizeQuery(q);
  return state.products.filter(p => {
    if (state.hang_san_xuat !== "all" && p.hang_san_xuat !== state.hang_san_xuat) return false;
    if (!q) return true;
    if (sizeMatch) {
      const [, i, o, t] = sizeMatch.map(Number);
      const tol = 0.5;
      return Math.abs((p.duong_kinh_trong ?? -999) - i) <= tol && Math.abs((p.duong_kinh_ngoai ?? -999) - o) <= tol && Math.abs((p.do_day ?? -999) - t) <= tol;
    }
    return p.ma_san_pham.toLowerCase().includes(qLower) || (p.hang_san_xuat || "").toLowerCase().includes(qLower);
  });
}

function hienThiTrang() {
  // [SỬA] Badge giỏ hàng trước đây chỉ tính 1 lần lúc script vừa chạy (trước khi biết ai đăng nhập,
  // nên đọc nhầm giỏ "khách" rỗng) và không cập nhật lại sau khi session load xong. Gọi lại ở đây —
  // đầu mỗi lần hienThiTrang() — để badge luôn khớp đúng giỏ hàng của tài khoản đang đăng nhập.
  capNhatSoGioHangTrenMenu(state.session);
  if (state.loading) { phanTuGoc.innerHTML = `<div class="empty">Đang tải danh mục...</div>`; return; }
  const brands = ["all", ...new Set(state.products.map(p => p.hang_san_xuat).filter(Boolean))];
  const tatCa = filtered();                                   // toàn bộ sản phẩm sau khi lọc
  const tongTrang = Math.max(1, Math.ceil(tatCa.length / SO_SP_MOI_TRANG));
  if (state.trang > tongTrang) state.trang = tongTrang;       // lọc xong còn ít trang hơn thì lùi về
  const tu = (state.trang - 1) * SO_SP_MOI_TRANG;
  const list = tatCa.slice(tu, tu + SO_SP_MOI_TRANG);         // chỉ 12 sản phẩm của trang hiện tại
  const sizeMatch = parseSizeQuery(state.q.trim());
  phanTuGoc.innerHTML = `
    <div class="cat-toolbar">
      <input type="text" id="catSearch" placeholder="Tìm theo mã hàng, hãng hoặc kích thước (vd 20x28x5)..." value="${state.q}" />
      ${brands.map(b => `<div class="cat-chip ${state.hang_san_xuat===b?'active':''}" data-brand="${b}">${b==='all'?'Tất cả hãng':b}</div>`).join("")}
    </div>
    ${state.q && sizeMatch ? `<p style="font-size:11.5px;color:var(--steel);margin:-10px 0 16px">Đang lọc theo kích thước ⌀${sizeMatch[1]} × ⌀${sizeMatch[2]} × ${sizeMatch[3]}mm (sai số ±0.5mm)</p>` : ''}
    ${list.length === 0 ? `<div class="empty"><span class="big">📭</span>Không có sản phẩm phù hợp bộ lọc</div>` : `
    <div class="cat-grid">
      ${list.map(p => {
        return `
        <div class="cat-card" style="position:relative">
          <div class="icon-frame">${p.url_anh ? `<img src="${p.url_anh}" alt="${p.ma_san_pham}" style="width:100%;height:74px;object-fit:cover;border-radius:6px"/>` : (ICONS[p.loai_san_pham?.nhom_san_pham] || ICONS.default)}</div>
          <div><span class="code">${p.ma_san_pham}</span><span class="brand-tag">${p.hang_san_xuat||'—'}</span></div>
          <div class="dims">⌀${p.duong_kinh_trong ?? '?'} × ⌀${p.duong_kinh_ngoai ?? '?'} × ${p.do_day ?? '?'}mm</div>
          ${maHoaHtml(p.ghi_chu) ? `<div style="font-size:11px;color:var(--steel);line-height:1.4">${maHoaHtml(p.ghi_chu.length > 70 ? p.ghi_chu.slice(0,70)+'…' : p.ghi_chu)}</div>` : ''}
          <div class="bottom"><span class="price">${dinhDangTien(Number(p.gia_le_vnd || 0))}</span>${stockBadge(p.so_luong_ton ?? 0)}</div>
          <div class="cat-card-actions">
            <a href="chi-tiet.html?code=${encodeURIComponent(p.ma_san_pham)}" class="btn ghost small">👁 Xem chi tiết</a>
            <button class="btn small cart-add-btn" title="Thêm vào giỏ, gom nhiều món rồi đặt 1 lần" data-cart-add='${JSON.stringify({id:p.id, ma_san_pham:p.ma_san_pham, hang_san_xuat:p.hang_san_xuat||null, gia_le_vnd:p.gia_le_vnd||0, so_luong_ton:p.so_luong_ton??0}).replace(/'/g,"&#39;")}' ${((p.so_luong_ton??0)<=0) ? 'disabled' : ''}>➕</button>
          </div>
        </div>`;
      }).join("")}
    </div>
    ${tongTrang > 1 ? `
    <div class="trans-pagination" style="margin-top:18px">
      <div class="trans-pagination-info">Hiển thị <b>${tu + 1}–${tu + list.length}</b> / ${tatCa.length} sản phẩm</div>
      <div class="trans-pagination-buttons">
        <button class="btn ghost small" data-trang="${state.trang - 1}" ${state.trang === 1 ? 'disabled' : ''}>←</button>
        ${Array.from({ length: tongTrang }, (_, i) => `<button class="btn ghost small trans-page-btn ${state.trang === i + 1 ? 'active' : ''}" data-trang="${i + 1}">${i + 1}</button>`).join("")}
        <button class="btn ghost small" data-trang="${state.trang + 1}" ${state.trang === tongTrang ? 'disabled' : ''}>→</button>
      </div>
    </div>` : ''}`}
  `;
  document.getElementById("catSearch").oninput = (e) => {
    state.q = e.target.value;
    state.trang = 1;
    const cursorPos = e.target.selectionStart;
    hienThiTrang();
    const el = document.getElementById("catSearch");
    el.focus();
    el.setSelectionRange(cursorPos, cursorPos);
  };
  document.querySelectorAll("[data-brand]").forEach(el => { el.onclick = () => { state.hang_san_xuat = el.getAttribute("data-brand"); state.trang = 1; hienThiTrang(); }; });
  document.querySelectorAll("[data-trang]").forEach(btn => {
    btn.onclick = () => { state.trang = Number(btn.getAttribute("data-trang")); hienThiTrang(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  });
  document.querySelectorAll("[data-cart-add]").forEach(btn => {
    btn.onclick = () => {
      if (!state.session) { chuyenDenDangNhap("danh-muc.html"); return; }
      let product; try { product = JSON.parse(btn.getAttribute("data-cart-add")); } catch { return; }
      const newQty = themVaoGioHang(state.session, product, 1);
      hienThongBaoNhanh(`🛒 Đã thêm ${product.ma_san_pham} vào giỏ (số lượng: ${newQty}) — bấm "Giỏ hàng" trên thanh menu để xem`);
    };
  });
}

(async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  state.session = sessionData.session;
  supabase.auth.onAuthStateChange(async (_event, session) => { state.session = session; hienThiTrang(); });

  const { data, error } = await supabase.from("san_pham").select("*, loai_san_pham(nhom_san_pham)").eq("dang_hoat_dong", true)
    .order("thu_tu_hien_thi", { ascending: true }).order("ma_san_pham", { ascending: true });
  state.products = error ? [] : (data || []);
  state.loading = false;
  hienThiTrang();
})();

// Bấm nút Back của trình duyệt sau khi đặt hàng ở giohang.html có thể khiến trang này được khôi
// phục từ bộ nhớ đệm (bfcache) thay vì tải lại — lúc đó số tồn kho hiển thị có thể đã cũ. Tải lại
// khi phát hiện trường hợp đó.
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});

}
