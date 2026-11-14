/* ==========================================================================
   MỤC LỤC HÀM — customer/js/chi-tiet.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   taiKhachHang()              [async]  — Tải hồ sơ khách (bảng khach_hang) của người đang đăng nhập
   nhanTonKho(qty)             — HTML nhãn tồn kho (Hết hàng / Sắp hết / Còn hàng) theo số lượng
   theTuongDuong(p)            — HTML thẻ 1 sản phẩm tương đương trong mục "Mã tương đương"
   moHopDatHang()              [async]  — Mở hộp thoại đặt hàng "Mua ngay"
   hienThiHopDatHang()         — Vẽ hộp thoại đặt hàng (người nhận, SĐT, địa chỉ, tóm tắt tiền)
   hienThiHopBaoGia()          — Vẽ hộp thoại gửi yêu cầu báo giá
   hienThiTrang()              — Vẽ toàn bộ trang chi tiết sản phẩm từ duLieuTrang
   hienThiSanPhamTuongDuong()  — Vẽ mục "Mã tương đương từ hãng khác" (danh sách thẻ hoặc báo chưa có dữ liệu)
   ganSuKien()                 — Gắn sự kiện cho các nút trên trang chi tiết
   laySanPhamMoiNhat()         [async]  — Đọc lại sản phẩm từ database (giá, tồn mới nhất) trước khi đặt
   guiDonMuaNgay()             [async]  — Gửi đơn "Mua ngay" cho sản phẩm đang xem (kiểm tra form rồi gọi taoDonHang)
   guiYeuCauBaoGia()           [async]  — Gửi yêu cầu báo giá qua hàm DB tao_yeu_cau_ho_tro
   taiMaTuongDuong()           [async]  — ★ QUY ĐỔI: tra quy_doi_tuong_duong (2 chiều) rồi lọc sản phẩm cùng loại tương đương, kích thước ±0,5 mm
   taiSanPham(triggerAutoBuy)  [async]  — Tải sản phẩm đang xem; tham số triggerAutoBuy là cờ tự kích hoạt mua ngay
   ========================================================================== */
// Logic trang chi-tiet.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
import { supabase, daCauHinh } from "../../js/dung-chung/ket-noi-supabase.js";
import { taiHoSoKhach } from "../../js/dung-chung/dam-bao-khach-hang.js";
import { THUE_SUAT_MAC_DINH, taiQuyTacChietKhau, phanTramChietKhauTotNhat, tinhTongDonHang } from "../../js/dung-chung/tinh-chiet-khau.js";
import { taoDonHang } from "../../js/dung-chung/tao-don-hang.js";
import { chuyenGioHangCu, themVaoGioHang, capNhatSoGioHangTrenMenu } from "../../js/dung-chung/luu-gio-hang.js";
import { hienThiThongBaoGioLamViec, hienThongBaoNhanh, chuyenDenDangNhap } from "../../js/dung-chung/trang-chung.js";
import { khoiThanhToanLienHe } from "../../js/dung-chung/thong-tin-cua-hang.js";
import { laHetHang, laSapHet } from "../../js/dung-chung/ton-kho.js";
import { maHoaHtml, dinhDangTien } from "../../js/dung-chung/dinh-dang.js";
const phanTuGoc = document.getElementById("detail-root");

if (!daCauHinh) {
  phanTuGoc.innerHTML = `<div class="panel" style="background:#fdf1e1;border-left:4px solid #e2810f">
    <b>Chưa cấu hình.</b> Mở file <code>config.js</code>, điền SUPABASE_ANON_KEY thật rồi tải lại trang.
  </div>`;
  throw new Error("Chưa cấu hình config.js");
}

chuyenGioHangCu();

const maSanPham = new URLSearchParams(window.location.search).get("code") || "";
const muaNgay = new URLSearchParams(window.location.search).get("buy") === "1";

let duLieuTrang = {
  loading: true, product: null, notFound: false,
  equivalents: [], equivalentsLoaded: false,
  session: null, customer: null,
  orderOpen: false, orderQty: 1, submitting: false,
  quoteOpen: false, discountRules: [],
};

// Giỏ hàng: toàn bộ logic nằm ở js/dung-chung/luu-gio-hang.js (mỗi tài khoản 1 giỏ riêng). Trang này chỉ gọi lại.
capNhatSoGioHangTrenMenu(duLieuTrang.session);

const BIEU_TUONG = {
  oil_seal: `<svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="18" height="36" stroke="#2b5f8a" stroke-width="2.5"/><path d="M28 10 L58 22 L58 34 L28 46" stroke="#2b5f8a" stroke-width="2.5" stroke-linejoin="round"/><line x1="10" y1="28" x2="70" y2="28" stroke="#e2810f" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`,
  packing: `<svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 12 L34 12 L46 24 L46 32 L34 44 L14 44 Z" stroke="#2b5f8a" stroke-width="2.5" stroke-linejoin="round"/><line x1="6" y1="28" x2="66" y2="28" stroke="#e2810f" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`,
  default: `<svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="28" r="20" stroke="#2b5f8a" stroke-width="2.5"/><circle cx="40" cy="28" r="8" stroke="#e2810f" stroke-width="2.5"/></svg>`
};

document.getElementById("crumbCode").textContent = maSanPham || "?";


// ===== TẢI DỮ LIỆU =====
async function taiKhachHang() { duLieuTrang.customer = await taiHoSoKhach(supabase, duLieuTrang.session); }

function nhanTonKho(qty) {
  if (laHetHang(qty)) return `<span class="stock-badge out">Hết hàng</span>`;
  if (laSapHet(qty)) return `<span class="stock-badge low">Còn ${qty} (sắp hết)</span>`;
  return `<span class="stock-badge ok">Còn ${qty} sản phẩm</span>`;
}

function theTuongDuong(p) {
  return `<div class="product-card panel" data-eq="${p.id}">
    <div><span class="pc-code">${p.ma_san_pham}</span><span class="pc-brand-tag">${p.hang_san_xuat}</span></div>
    <div class="pc-dims">⌀${p.duong_kinh_trong} × ⌀${p.duong_kinh_ngoai} × ${p.do_day}mm &nbsp;·&nbsp; Vật liệu ${p.vat_lieu || "—"}${p.loai_san_pham?.ma_loai ? ` &nbsp;·&nbsp; Kiểu ${p.loai_san_pham.ma_loai}` : ""}</div>
    <div class="pc-bottom"><span class="pc-price">${dinhDangTien(Number(p.gia_le_vnd || 0))}</span>${nhanTonKho(p.so_luong_ton ?? 0)}</div>
  </div>`;
}


async function moHopDatHang() {
  duLieuTrang.orderOpen = true; hienThiTrang();
}


// ===== MUA HÀNG =====
function hienThiHopDatHang() {
  const p = duLieuTrang.product;
  const c = duLieuTrang.customer;
  const finalPrice = Number(p.gia_le_vnd || 0);
  const item = { ma_san_pham: p.ma_san_pham, loai_san_pham_id: p.loai_san_pham_id, qty: duLieuTrang.orderQty, price: finalPrice };
  const { subtotal, qtyDiscount: qtyDiscountAmount, tax, shippingFee, total } = tinhTongDonHang([item], duLieuTrang.discountRules);
  const qtyDiscountPct = phanTramChietKhauTotNhat(duLieuTrang.discountRules, item);
  return `<div class="modal-bg" id="orderModalBg"><div class="modal">
    <h2 style="font-size:17px;margin-top:0">Đặt hàng</h2>
    <p class="lead" style="font-size:13px">${p.ma_san_pham} — ${dinhDangTien(finalPrice)}/sản phẩm</p>
    <div class="field"><label class="field-label">Số lượng</label><input type="number" id="orderQty" value="${duLieuTrang.orderQty}" min="1" max="${p.so_luong_ton}" /></div>
    <hr style="border:none;border-top:1px solid var(--line-soft);margin:14px 0" />
    <p style="font-weight:700;font-size:13px;margin:0 0 10px">Thông tin giao hàng</p>
    <div class="field"><label class="field-label">Người nhận</label><input id="orderRecipient" value="${maHoaHtml(c?.ho_ten) || ''}" placeholder="Họ tên người nhận hàng" /></div>
    <div class="field"><label class="field-label">SĐT liên hệ giao hàng</label><input id="orderRecipientPhone" value="${maHoaHtml(c?.so_dien_thoai)}" placeholder="SĐT nhận hàng (có thể khác SĐT tài khoản)" /></div>
    <div class="field"><label class="field-label">Địa chỉ giao hàng *</label><textarea id="orderAddress" rows="2" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành">${maHoaHtml(c?.dia_chi_mac_dinh) || ''}</textarea></div>
    <div class="gh-summary-row"><span>Tạm tính (chưa VAT)</span><span>${dinhDangTien(subtotal)}</span></div>
    ${qtyDiscountAmount > 0 ? `<div class="gh-summary-row" style="color:var(--ok)"><span>Chiết khấu mua số lượng (-${qtyDiscountPct}%)</span><span>−${dinhDangTien(qtyDiscountAmount)}</span></div>` : ''}
    <div class="gh-summary-row"><span>Thuế VAT (${THUE_SUAT_MAC_DINH}%)</span><span>${dinhDangTien(tax)}</span></div>
    <div class="gh-summary-row"><span>Phí vận chuyển</span><span>${shippingFee === 0 ? '<span style="color:var(--ok);font-weight:700">Miễn phí</span>' : shippingFee.toLocaleString("vi-VN")+'₫'}</span></div>
    <p style="font-weight:700">Tổng thanh toán: ${dinhDangTien(total)}</p>
    ${hienThiThongBaoGioLamViec()}
    <div class="row" style="justify-content:flex-end">
      <button class="btn ghost" id="orderCancel">Hủy</button>
      <button class="btn" id="orderSubmit">Xác nhận đặt hàng</button>
    </div>
  </div></div>`;
}


// ===== YÊU CẦU BÁO GIÁ =====
function hienThiHopBaoGia() {
  const c = duLieuTrang.customer;
  return `<div class="modal-bg" id="modalBg"><div class="modal">
    <h2 style="font-size:17px;margin-top:0">Hỏi về sản phẩm</h2>
    <p class="lead" style="font-size:13px">Sản phẩm này đã có giá bán trực tiếp. Gửi câu hỏi nếu bạn cần ABA tư vấn thêm.</p>
    <div class="field"><label class="field-label">Họ tên</label><input id="qName" value="${maHoaHtml(c?.ho_ten)}" /></div>
    <div class="field"><label class="field-label">Số điện thoại</label><input id="qPhone" value="${maHoaHtml(c?.so_dien_thoai)}" /></div>
    <div class="field"><label class="field-label">Công ty (không bắt buộc)</label><input id="qCompany" value="${maHoaHtml(c?.ten_cong_ty)}" /></div>
    <div class="field"><label class="field-label">Nội dung cần hỏi</label><textarea id="qNote" rows="3">${duLieuTrang.product ? `Mã sản phẩm: ${duLieuTrang.product.ma_san_pham}` : ''}</textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" id="qCancel">Hủy</button><button class="btn blue" id="qSubmit">Gửi yêu cầu</button></div>
  </div></div>`;
}


// ===== RENDER TRANG =====
function hienThiTrang() {
  // nên đọc nhầm giỏ "khách" rỗng) và không cập nhật lại sau khi session load xong. Gọi lại ở đây —
  // đầu mỗi lần hienThiTrang() — để badge luôn khớp đúng giỏ hàng của tài khoản đang đăng nhập.
  capNhatSoGioHangTrenMenu(duLieuTrang.session);
  if (duLieuTrang.loading) { phanTuGoc.innerHTML = `<div class="empty">Đang tải sản phẩm...</div>`; return; }
  if (duLieuTrang.notFound || !duLieuTrang.product) {
    phanTuGoc.innerHTML = `<div class="empty"><span class="big">📭</span>Không tìm thấy sản phẩm mã <b>${maSanPham}</b> trong hệ thống.
      <div style="margin-top:14px"><a href="danh-muc.html" class="btn ghost">← Về Danh mục sản phẩm</a></div></div>`;
    return;
  }
  const p = duLieuTrang.product;
  phanTuGoc.innerHTML = `
    <div class="detail-grid">
      <div class="panel detail-image">
        ${p.url_anh ? `<img src="${p.url_anh}" alt="${p.ma_san_pham}" />` : (BIEU_TUONG[p.loai_san_pham?.nhom_san_pham] || BIEU_TUONG.default)}
      </div>
      <div class="panel">
        <div class="detail-top-row"><span class="tag">${p.hang_san_xuat || '—'}</span>${p.dang_hoat_dong === false ? `<span class="tag" style="background:var(--danger-soft);color:var(--danger)">Ngừng bán</span>` : ''}</div>
        <div class="detail-code">${p.ma_san_pham}</div>
        <div class="detail-dims">⌀${p.duong_kinh_trong ?? '?'} (trong) × ⌀${p.duong_kinh_ngoai ?? '?'} (ngoài) × ${p.do_day ?? '?'}mm (dày) &nbsp;·&nbsp; Vật liệu ${p.vat_lieu || '—'}${p.loai_san_pham?.ma_loai ? ` &nbsp;·&nbsp; Kiểu ${p.loai_san_pham.ma_loai} (${p.loai_san_pham.hang_san_xuat})` : ''}</div>
        <div class="detail-price">${dinhDangTien(Number(p.gia_le_vnd || 0))}</div>
        ${nhanTonKho(p.so_luong_ton ?? 0)}
        ${maHoaHtml(p.ghi_chu) ? `<div class="detail-note">${maHoaHtml(p.ghi_chu)}</div>` : ''}
        <div class="detail-qty-row">
          <label class="field-label" style="margin:0">Số lượng</label>
          <input type="number" id="qtyInput" value="1" min="1" max="${p.so_luong_ton}" ${((p.so_luong_ton ?? 0) <= 0) ? 'disabled' : ''} />
        </div>
        <div class="detail-actions">
          <button class="btn" id="buyBtn" ${((p.so_luong_ton ?? 0) <= 0) ? 'disabled' : ''}>🛒 Mua ngay</button>
          <button class="btn cart-add-btn" data-cart-qty="#qtyInput" data-cart-add='${JSON.stringify({id:p.id, ma_san_pham:p.ma_san_pham, hang_san_xuat:p.hang_san_xuat||null, gia_le_vnd:p.gia_le_vnd||0, so_luong_ton:p.so_luong_ton??0}).replace(/'/g,"&#39;")}' ${((p.so_luong_ton ?? 0) <= 0) ? 'disabled' : ''}>➕ Thêm vào giỏ</button>
          <button class="btn ghost" id="quoteBtn">🔍 Hỏi về sản phẩm</button>
        </div>
        <p style="font-size:11.5px;color:var(--steel);margin:10px 0 0">🛒 Mua ngay = đặt riêng sản phẩm này. Muốn gom nhiều sản phẩm khác nhau rồi đặt chung 1 đơn thì dùng "➕ Thêm vào giỏ" rồi vào mục "Giỏ hàng" trên thanh menu.</p>
      </div>
    </div>
    <div id="eqZone" style="margin-top:8px">
      ${duLieuTrang.equivalentsLoaded ? hienThiSanPhamTuongDuong() : ''}
    </div>
    ${duLieuTrang.orderOpen ? hienThiHopDatHang() : ''}
    ${duLieuTrang.quoteOpen ? hienThiHopBaoGia() : ''}
  `;
  ganSuKien();
}

function hienThiSanPhamTuongDuong() {
  return `<div class="results-title">Mã tương đương từ hãng khác</div>
    ${duLieuTrang.equivalents.length === 0 ? `<div class="empty">Chưa có dữ liệu quy đổi cho loại sản phẩm này trong hệ thống</div>` : duLieuTrang.equivalents.map(theTuongDuong).join("")}`;
}

// ===== SỰ KIỆN TRANG CHI TIẾT =====
function ganSuKien() {
  const qtyInput = document.getElementById("qtyInput");

  const cartButtons = document.querySelectorAll("[data-cart-add]");
  cartButtons.forEach(btn => {
    btn.onclick = () => {
      let product;
      try { product = JSON.parse(btn.getAttribute("data-cart-add")); }
      catch { hienThongBaoNhanh("Không đọc được thông tin sản phẩm."); return; }
      const qtyEl = btn.getAttribute("data-cart-qty") ? document.querySelector(btn.getAttribute("data-cart-qty")) : null;
      const qty = Math.max(1, Number(qtyEl?.value || 1));
      const available = Number(product.so_luong_ton ?? 0);
      if (available <= 0) { hienThongBaoNhanh("Sản phẩm hiện đã hết hàng."); return; }
      if (qty > available) { hienThongBaoNhanh(`Chỉ còn ${available} sản phẩm trong kho.`); return; }
      const newQty = themVaoGioHang(duLieuTrang.session, product, qty);
      hienThongBaoNhanh(`🛒 Đã thêm ${product.ma_san_pham} vào giỏ (${newQty} sản phẩm).`);
    };
  });

  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) buyBtn.onclick = async () => {
    if (!duLieuTrang.session) {
      chuyenDenDangNhap(`chi-tiet.html?code=${maSanPham}&buy=1`);
      return;
    }
    const qty = Math.max(1, Number(qtyInput?.value || 1));
    const fresh = await laySanPhamMoiNhat();
    if (!fresh) { hienThongBaoNhanh("Không tải được tồn kho mới nhất."); return; }
    if (fresh.so_luong_ton <= 0) { hienThongBaoNhanh("Sản phẩm hiện đã hết hàng."); return; }
    if (qty > fresh.so_luong_ton) { hienThongBaoNhanh(`Chỉ còn ${fresh.so_luong_ton} sản phẩm.`); return; }
    duLieuTrang.product = { ...duLieuTrang.product, ...fresh };
    duLieuTrang.orderQty = qty;
    await taiKhachHang();
    duLieuTrang.orderOpen = true;
    hienThiTrang();
  };

  const orderQty = document.getElementById("orderQty");
  if (orderQty) orderQty.onchange = () => {
    const max = Number(duLieuTrang.product?.so_luong_ton || 1);
    duLieuTrang.orderQty = Math.max(1, Math.min(max, Number(orderQty.value) || 1));
    orderQty.value = duLieuTrang.orderQty;
  };

  const orderCancel = document.getElementById("orderCancel");
  if (orderCancel) orderCancel.onclick = () => { duLieuTrang.orderOpen = false; duLieuTrang.submitting = false; hienThiTrang(); };

  const orderSubmit = document.getElementById("orderSubmit");
  if (orderSubmit) orderSubmit.onclick = guiDonMuaNgay;

  const quoteBtn = document.getElementById("quoteBtn");
  if (quoteBtn) quoteBtn.onclick = () => { duLieuTrang.quoteOpen = true; hienThiTrang(); };

  const qCancel = document.getElementById("qCancel");
  if (qCancel) qCancel.onclick = () => { duLieuTrang.quoteOpen = false; hienThiTrang(); };

  const qSubmit = document.getElementById("qSubmit");
  if (qSubmit) qSubmit.onclick = guiYeuCauBaoGia;
}

async function laySanPhamMoiNhat() {
  const { data, error } = await supabase.from("san_pham")
    .select("*, loai_san_pham(nhom_san_pham, ma_loai, hang_san_xuat)")
    .eq("id", duLieuTrang.product?.id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function guiDonMuaNgay() {
  if (duLieuTrang.submitting || !duLieuTrang.session || !duLieuTrang.product) return;
  const recipientName = document.getElementById("orderRecipient")?.value.trim();
  const recipientPhone = document.getElementById("orderRecipientPhone")?.value.trim();
  const address = document.getElementById("orderAddress")?.value.trim();
  if (!recipientName || !recipientPhone || !address) { hienThongBaoNhanh("Vui lòng nhập đầy đủ người nhận, SĐT và địa chỉ giao hàng."); return; }

  duLieuTrang.submitting = true;
  hienThiTrang();

  const fresh = await laySanPhamMoiNhat();
  if (!fresh || !fresh.dang_hoat_dong) { duLieuTrang.submitting = false; duLieuTrang.orderOpen = false; hienThiTrang(); hienThongBaoNhanh("Sản phẩm không còn bán."); return; }
  if (duLieuTrang.orderQty > Number(fresh.so_luong_ton || 0)) {
    duLieuTrang.submitting = false;
    duLieuTrang.product = { ...duLieuTrang.product, ...fresh };
    hienThiTrang();
    hienThongBaoNhanh(`Không đủ hàng. Tồn thực tế hiện tại: ${fresh.so_luong_ton}.`);
    return;
  }

  const item = { id: fresh.id, ma_san_pham: fresh.ma_san_pham, loai_san_pham_id: fresh.loai_san_pham_id, qty: duLieuTrang.orderQty, price: Number(fresh.gia_le_vnd || 0) };
  const kq = await taoDonHang(supabase, duLieuTrang.session, { items: [item], rules: duLieuTrang.discountRules, nguoiNhan: recipientName, sdt: recipientPhone, diaChi: address });
  if (!kq.ok) { duLieuTrang.submitting = false; hienThiTrang(); hienThongBaoNhanh(kq.loi); return; }
  duLieuTrang.customer = kq.khach;
  const total = kq.tien.total;

  duLieuTrang.submitting = false;
  duLieuTrang.orderOpen = false;
  phanTuGoc.innerHTML = `<div class="panel gh-success" style="text-align:center;padding:34px 20px">
    <span class="big">🎉</span>
    <h2 style="margin:0 0 8px">Đặt hàng thành công!</h2>
    <p class="lead">Đã ghi nhận ${duLieuTrang.orderQty} sản phẩm <b>${fresh.ma_san_pham}</b>, tổng ${dinhDangTien(total)}.</p>
    <p style="font-size:13px;color:var(--steel)">Đơn hàng đang ở trạng thái <b>Chờ xác nhận</b>. Tồn kho thực tế chưa bị trừ ở bước đặt hàng; kho chỉ xuất khi đơn chuyển sang trạng thái giao hàng.</p>
    ${khoiThanhToanLienHe()}
    <div class="row" style="justify-content:center;margin-top:18px">
      <a href="danh-muc.html" class="btn ghost">← Tiếp tục xem sản phẩm</a>
      <a href="tai-khoan.html" class="btn">Xem đơn hàng của tôi</a>
    </div>
  </div>`;
}

async function guiYeuCauBaoGia() {
  if (!duLieuTrang.product) return;
  const name = document.getElementById("qName")?.value.trim();
  const phone = document.getElementById("qPhone")?.value.trim();
  const company = document.getElementById("qCompany")?.value.trim();
  const note = document.getElementById("qNote")?.value.trim();
  if (!name || !phone) { hienThongBaoNhanh("Vui lòng nhập họ tên và số điện thoại."); return; }

  let requestId;
  if (duLieuTrang.session?.user?.id) {
    // Khách đã đăng nhập: RLS không cho insert trực tiếp, dùng RPC (tạo yêu cầu + tin nhắn đầu tiên)
    const { data: rid, error: rpcError } = await supabase.rpc("tao_yeu_cau_ho_tro", {
      p_loai: "product_inquiry",
      p_noi_dung: note || `Tôi muốn hỏi về sản phẩm ${duLieuTrang.product.ma_san_pham}.`,
      p_du_lieu: { product_id: duLieuTrang.product.id },
      p_ten: name, p_sdt: phone, p_cong_ty: company || null
    });
    if (rpcError || !rid) { hienThongBaoNhanh("Không gửi được yêu cầu báo giá: " + (rpcError?.message || "lỗi không xác định")); return; }
    requestId = rid;
  } else {
    // Khách vãng lai: tự sinh id phía client, không .select() vì chưa đăng nhập thì không có quyền đọc lại dòng vừa tạo
    requestId = crypto.randomUUID();
    const { error: guestError } = await supabase.from("yeu_cau_bao_gia").insert({
      id: requestId, ten_khach_hang: name, sdt_khach_hang: phone, ten_cong_ty: company || null,
      ghi_chu: note || null, khach_hang_id: null,
      loai_yeu_cau: "product_inquiry", du_lieu_loai: { product_id: duLieuTrang.product.id }
    });
    if (guestError) { hienThongBaoNhanh("Không gửi được yêu cầu báo giá: " + guestError.message); return; }
  }

  // Dòng chi tiết chỉ để nhân viên thấy sản phẩm; nếu lỗi vẫn giữ yêu cầu (khách không có quyền xóa) vì du_lieu_loai đã chứa product_id
  const { error: detailError } = await supabase.from("chi_tiet_yeu_cau_bao_gia").insert({
    yeu_cau_bao_gia_id: requestId, san_pham_id: duLieuTrang.product.id, so_luong: 1
  });
  if (detailError) console.warn("Không lưu được dòng chi tiết yêu cầu:", detailError.message);

  duLieuTrang.quoteOpen = false;
  hienThiTrang();
  hienThongBaoNhanh("🔍 Đã gửi câu hỏi về sản phẩm cho ABA.");
}


// ===== SẢN PHẨM TƯƠNG ĐƯƠNG =====
async function taiMaTuongDuong() {
  const product = duLieuTrang.product;
  const { data: eqA } = await supabase.from("quy_doi_tuong_duong").select("loai_b_id").eq("loai_a_id", product.loai_san_pham_id);
  const { data: eqB } = await supabase.from("quy_doi_tuong_duong").select("loai_a_id").eq("loai_b_id", product.loai_san_pham_id);
  const typeIds = [...(eqA||[]).map(r=>r.loai_b_id), ...(eqB||[]).map(r=>r.loai_a_id)];
  if (typeIds.length === 0) { duLieuTrang.equivalents = []; duLieuTrang.equivalentsLoaded = true; hienThiTrang(); return; }
  const tol = 0.5;
  const { data: candidates } = await supabase.from("san_pham").select("*, loai_san_pham(nhom_san_pham, ma_loai, hang_san_xuat)").in("loai_san_pham_id", typeIds)
    .gte("duong_kinh_trong", product.duong_kinh_trong - tol).lte("duong_kinh_trong", product.duong_kinh_trong + tol)
    .gte("duong_kinh_ngoai", product.duong_kinh_ngoai - tol).lte("duong_kinh_ngoai", product.duong_kinh_ngoai + tol)
    .gte("do_day", product.do_day - tol).lte("do_day", product.do_day + tol);
  duLieuTrang.equivalents = candidates || [];
  duLieuTrang.equivalentsLoaded = true;
  hienThiTrang();
}


// ===== TẢI SẢN PHẨM =====
async function taiSanPham(triggerAutoBuy) {
  duLieuTrang.loading = true; hienThiTrang();
  const { data, error } = await supabase.from("san_pham").select("*, loai_san_pham(nhom_san_pham, ma_loai, hang_san_xuat)").eq("ma_san_pham", maSanPham).maybeSingle();
  duLieuTrang.loading = false;
  if (error || !data) { duLieuTrang.notFound = true; hienThiTrang(); return; }
  duLieuTrang.product = data; duLieuTrang.notFound = false;
  hienThiTrang();
  taiMaTuongDuong();
  if (triggerAutoBuy && muaNgay) {
    if (!duLieuTrang.session) { chuyenDenDangNhap(`chi-tiet.html?code=${maSanPham}&buy=1`); return; }
    duLieuTrang.orderQty = 1; moHopDatHang();
  }
}

if (!maSanPham) {
  duLieuTrang.loading = false; duLieuTrang.notFound = true; hienThiTrang();
} else if (daCauHinh) {
  taiQuyTacChietKhau(supabase).then(rules => { duLieuTrang.discountRules = rules; hienThiTrang(); });
  supabase.auth.getSession().then(async ({ data }) => {
    duLieuTrang.session = data.session;
    await taiKhachHang();
    await taiSanPham(true);
  });
  supabase.auth.onAuthStateChange(async (_event, session) => { duLieuTrang.session = session; await taiKhachHang(); hienThiTrang(); });
}

// Bấm nút Back của trình duyệt sau khi đặt hàng ở giohang.html có thể khiến trang này được khôi
// phục từ bộ nhớ đệm (bfcache) thay vì tải lại — lúc đó số tồn kho hiển thị có thể đã cũ.
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});
