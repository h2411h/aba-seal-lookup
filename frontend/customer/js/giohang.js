/* ==========================================================================
   MỤC LỤC HÀM — customer/js/giohang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   danhSachGioHang()      — Đổi giỏ hàng (object) thành mảng các dòng
   giaCuoiSanPham(i)      — Đơn giá của 1 dòng giỏ (gia_le_vnd)
   layDaChon()            — Đọc từ localStorage những dòng đang tick chọn để thanh toán
   luuDaChon(sel)         — Lưu lựa chọn tick vào localStorage
   daDuocChon(id)         — 1 dòng có đang được chọn không (mặc định: có)
   doiChon(id)            — Đảo trạng thái chọn của 1 dòng
   doiChonTatCa(value)    — Chọn / bỏ chọn tất cả dòng
   cacDongDaChon()        — Các dòng giỏ đang được chọn
   soDongDaChon()         — Tổng số lượng của các dòng đã chọn
   tongTienDaChon()       — Tổng tiền (số lượng × đơn giá) của các dòng đã chọn
   taiPhienDangNhap()     [async]  — Lấy phiên đăng nhập hiện tại
   taiKhachHang()         [async]  — Tải hồ sơ khách để điền sẵn khi thanh toán
   datSoLuong(id, qty)    — Đặt số lượng của 1 dòng (giới hạn 1..tồn kho) rồi lưu giỏ
   xoaDong(id)            — Xóa 1 dòng khỏi giỏ
   hienThiMatHang(i)      — Vẽ 1 dòng sản phẩm trong giỏ
   hienThiHopThanhToan()  — Vẽ hộp thoại thanh toán
   hienThiTrang()         — Vẽ toàn bộ trang giỏ hàng
   ganSuKien()            — Gắn sự kiện cho giỏ hàng (tăng giảm, xóa, chọn, mở thanh toán)
   moThanhToan()          [async]  — Mở hộp thanh toán cho các dòng đã chọn
   guiDonHang()           [async]  — Gửi đơn từ các dòng đã chọn (gọi taoDonHang)
   ========================================================================== */
// Logic trang giohang.html — tách từ inline <script type="module"> theo tái cấu trúc dự án.
import { taiHoSoKhach } from "../../js/dung-chung/dam-bao-khach-hang.js";
import { supabase, daCauHinh } from "../../js/dung-chung/ket-noi-supabase.js";
import { NGUONG_MIEN_PHI_SHIP, THUE_SUAT_MAC_DINH, tinhPhiVanChuyen, taiQuyTacChietKhau, phanTramChietKhauTotNhat, tinhTongDonHang } from "../../js/dung-chung/tinh-chiet-khau.js";
import { taoDonHang } from "../../js/dung-chung/tao-don-hang.js";
import { chuyenGioHangCu, layGioHang, luuGioHang, soLuongGioHang, capNhatSoGioHangTrenMenu } from "../../js/dung-chung/luu-gio-hang.js";
import { hienThiThongBaoGioLamViec, hienThongBaoNhanh, chuyenDenDangNhap } from "../../js/dung-chung/trang-chung.js";
import { khoiThanhToanLienHe } from "../../js/dung-chung/thong-tin-cua-hang.js";
import { maHoaHtml, dinhDangTien } from "../../js/dung-chung/dinh-dang.js";
const phanTuGoc = document.getElementById("gh-root");

if (!daCauHinh) {
  phanTuGoc.innerHTML = `<div class="empty"><b>Chưa cấu hình.</b> Mở file <code>config.js</code>, điền SUPABASE_ANON_KEY thật rồi tải lại trang.</div>`;
  throw new Error("Chưa cấu hình config.js");
}
chuyenGioHangCu();

// Giỏ hàng lưu riêng theo TÀI KHOẢN đang đăng nhập (session.user.id) — xem lý do ở luu-gio-hang.js.
// Trang này chỉ GỌI các hàm giỏ hàng ở luu-gio-hang.js (luôn truyền session), không tự xử lý giỏ hàng.
function danhSachGioHang() { return Object.values(layGioHang(duLieuTrang.session)); }
function giaCuoiSanPham(i) { return Number(i.gia_le_vnd || 0); }
// Lựa chọn sản phẩm để thanh toán (kiểu Shopee) — lưu riêng ở localStorage, không dùng để tính giỏ hàng,
// chỉ để nhớ khách đang muốn đặt món nào ngay, món nào để lại giỏ xem sau.
const KHOA_DA_CHON = "aba_cart_selected_v1";
function layDaChon() { try { return JSON.parse(localStorage.getItem(KHOA_DA_CHON) || "{}"); } catch { return {}; } }
function luuDaChon(sel) { localStorage.setItem(KHOA_DA_CHON, JSON.stringify(sel)); }
function daDuocChon(id) {
  const sel = layDaChon();
  return sel[id] !== undefined ? !!sel[id] : true; // mặc định: sản phẩm mới thêm vào giỏ được chọn sẵn
}
function doiChon(id) {
  const sel = layDaChon();
  sel[id] = !daDuocChon(id);
  luuDaChon(sel);
  hienThiTrang();
}
function doiChonTatCa(value) {
  const sel = layDaChon();
  danhSachGioHang().forEach(i => { sel[i.id] = value; });
  luuDaChon(sel);
  hienThiTrang();
}
function cacDongDaChon() { return danhSachGioHang().filter(i => daDuocChon(i.id)); }
function soDongDaChon() { return cacDongDaChon().reduce((s, i) => s + i.qty, 0); }
function tongTienDaChon() { return cacDongDaChon().reduce((s, i) => s + i.qty * giaCuoiSanPham(i), 0); }

let duLieuTrang = { session: null, customer: null, checkoutOpen: false, submitting: false, success: null,
  checkoutFresh: null,
  itemCategories: {}, discountRules: [] };

// ===== TẢI DỮ LIỆU =====
async function taiPhienDangNhap() {
  const { data } = await supabase.auth.getSession();
  duLieuTrang.session = data.session;
  supabase.auth.onAuthStateChange((_e, s) => { duLieuTrang.session = s; });
}
async function taiKhachHang() { duLieuTrang.customer = await taiHoSoKhach(supabase, duLieuTrang.session); }

function datSoLuong(id, qty) {
  const cart = layGioHang(duLieuTrang.session);
  if (!cart[id]) return;
  qty = Math.max(1, Math.min(cart[id].so_luong_ton ?? 999, Number(qty) || 1));
  cart[id].qty = qty;
  luuGioHang(duLieuTrang.session, cart);
  hienThiTrang();
}
function xoaDong(id) {
  const cart = layGioHang(duLieuTrang.session);
  delete cart[id];
  luuGioHang(duLieuTrang.session, cart);
  const sel = layDaChon();
  delete sel[id];
  luuDaChon(sel);
  hienThiTrang();
}

// ===== HIỂN THỊ GIỎ HÀNG =====
function hienThiMatHang(i) {
  const overStock = (i.so_luong_ton ?? 999) < i.qty;
  const checked = daDuocChon(i.id);
  const finalPrice = Number(i.gia_le_vnd || 0);
  const lineTotal = finalPrice * i.qty;
  return `
    <div class="gh-item" data-item="${i.id}" style="${checked ? '' : 'opacity:.55'}">
      <input type="checkbox" data-select="${i.id}" ${checked ? 'checked' : ''} style="width:18px;height:18px;flex-shrink:0;margin-right:4px;cursor:pointer" title="Chọn để đặt hàng ngay"/>
      <div class="gh-item-icon">🛢️</div>
      <div class="gh-item-main">
        <div class="gh-item-code">${i.ma_san_pham}</div>
        <div class="gh-item-meta">${i.hang_san_xuat || '—'} · ${dinhDangTien(finalPrice)} / sản phẩm</div>
        ${overStock ? `<div class="gh-item-warn">⚠ Chỉ còn ${i.so_luong_ton} trong kho, đã tự điều chỉnh số lượng</div>` : ''}
      </div>
      <div class="gh-qty-stepper">
        <button data-dec="${i.id}" type="button" ${i.qty <= 1 ? 'disabled' : ''}>−</button>
        <input type="number" value="${i.qty}" min="1" max="${i.so_luong_ton ?? 999}" data-qty-input="${i.id}" />
        <button data-inc="${i.id}" type="button" ${i.qty >= (i.so_luong_ton ?? 999) ? 'disabled' : ''}>+</button>
      </div>
      <div class="gh-item-price">${dinhDangTien(lineTotal)}</div>
      <button class="gh-item-remove" data-remove="${i.id}" title="Bỏ khỏi giỏ" type="button">✕</button>
    </div>`;
}

// ===== THANH TOÁN =====
function hienThiHopThanhToan() {
  const items = duLieuTrang.checkoutFresh || [];
  const { subtotal, qtyDiscount, tax, shippingFee, total } = tinhTongDonHang(items, duLieuTrang.discountRules);
  return `
    <div class="modal-bg" id="ghCheckoutBg">
      <div class="modal">
        <h2 style="font-size:17px;margin-top:0">Xác nhận đặt ${items.length} sản phẩm</h2>
        <div class="gh-checkout-list">
          ${items.map(i => {
            const pct = phanTramChietKhauTotNhat(duLieuTrang.discountRules, i);
            return `<div class="gh-checkout-row"><span>${i.ma_san_pham} × ${i.qty}${pct > 0 ? ` <span style="color:var(--ok);font-size:11px">(-${pct}% mua ${i.qty})</span>` : ''}</span><span>${dinhDangTien(Number(i.price*i.qty))}</span></div>`;
          }).join("")}
        </div>
        <div class="gh-summary-row" style="margin-top:10px"><span>Tạm tính (chưa VAT)</span><span>${dinhDangTien(subtotal)}</span></div>
        ${qtyDiscount > 0 ? `<div class="gh-summary-row" style="color:var(--ok)"><span>Chiết khấu mua số lượng</span><span>−${dinhDangTien(Math.round(qtyDiscount))}</span></div>` : ''}
        <div class="gh-summary-row"><span>Thuế VAT (${THUE_SUAT_MAC_DINH}%)</span><span>${dinhDangTien(tax)}</span></div>
        <div class="gh-summary-row">
          <span>Phí vận chuyển</span>
          <span>${shippingFee === 0 ? '<span style="color:var(--ok);font-weight:700">Miễn phí</span>' : shippingFee.toLocaleString("vi-VN")+'₫'}</span>
        </div>
        ${shippingFee > 0 ? `<p style="font-size:11px;color:var(--steel);margin:-4px 0 0">Mua thêm ${dinhDangTien((NGUONG_MIEN_PHI_SHIP - subtotal))} (tạm tính) để được miễn phí vận chuyển.</p>` : ''}
        <p style="font-weight:700;text-align:right;margin:10px 0 16px">Tổng thanh toán: ${dinhDangTien(total)}</p>
        ${hienThiThongBaoGioLamViec()}
        <p style="font-weight:700;font-size:13px;margin:14px 0 10px">Thông tin giao hàng</p>
        <div class="field"><label class="field-label">Người nhận</label><input id="ghRecipient" value="${maHoaHtml(duLieuTrang.customer?.ho_ten) || ''}" placeholder="Họ tên người nhận hàng" /></div>
        <div class="field"><label class="field-label">SĐT liên hệ giao hàng</label><input id="ghPhone" value="${maHoaHtml(duLieuTrang.customer?.so_dien_thoai) || ''}" placeholder="SĐT nhận hàng" /></div>
        <div class="field"><label class="field-label">Địa chỉ giao hàng *</label><textarea id="ghAddress" rows="2" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành">${maHoaHtml(duLieuTrang.customer?.dia_chi_mac_dinh) || ''}</textarea></div>
        <div class="row" style="justify-content:flex-end;gap:8px">
          <button class="btn ghost" id="ghCancel" type="button">Quay lại</button>
          <button class="btn" id="ghSubmit" type="button" ${duLieuTrang.submitting ? 'disabled' : ''}>${duLieuTrang.submitting ? 'Đang xử lý…' : 'Xác nhận đặt hàng'}</button>
        </div>
      </div>
    </div>`;
}

// ===== RENDER TRANG =====
function hienThiTrang() {
  capNhatSoGioHangTrenMenu(duLieuTrang.session);

  if (duLieuTrang.success) {
    phanTuGoc.innerHTML = `
      <div class="panel gh-success">
        <span class="big">🎉</span>
        <h2 style="margin:0 0 8px">Đặt hàng thành công!</h2>
        <p class="lead">Đã ghi nhận ${duLieuTrang.success.count} sản phẩm, tổng ${dinhDangTien(duLieuTrang.success.total)}.</p>
        <p style="font-size:13px;color:var(--steel);max-width:420px;margin:8px auto 0">
          Cửa hàng sẽ liên hệ xác nhận đơn với bạn trong giờ làm việc (7h30–17h30).
        </p>
        ${khoiThanhToanLienHe()}
        <div class="row" style="justify-content:center;margin-top:18px">
          <a href="danh-muc.html" class="btn ghost">← Tiếp tục xem sản phẩm</a>
          <a href="tai-khoan.html" class="btn">Xem đơn hàng của tôi</a>
        </div>
      </div>`;
    return;
  }

  const items = danhSachGioHang();

  if (items.length === 0) {
    phanTuGoc.innerHTML = `
      <div class="panel gh-empty">
        <span class="big">🛒</span>
        <p style="font-size:16px;font-weight:700;color:var(--graphite);margin:0 0 6px">Giỏ hàng đang trống</p>
        <p style="margin:0 0 18px">Vào Danh mục sản phẩm hoặc Tra cứu sản phẩm, bấm "➕ Thêm vào giỏ" ở sản phẩm bạn cần.</p>
        <a href="danh-muc.html" class="btn">Xem danh mục sản phẩm →</a>
      </div>`;
    return;
  }

  const selItems = cacDongDaChon();
  const selCount = soDongDaChon();
  const selTotal = tongTienDaChon();
  const allChecked = items.length > 0 && items.every(i => daDuocChon(i.id));

  phanTuGoc.innerHTML = `
    <div class="gh-grid">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--steel);cursor:pointer">
            <input type="checkbox" id="ghSelectAll" ${allChecked ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer"/>
            Chọn tất cả (${soLuongGioHang(duLieuTrang.session)} sản phẩm trong giỏ)
          </label>
          <span class="gh-clear-link" id="ghClearAll">Xoá tất cả</span>
        </div>
        ${items.map(hienThiMatHang).join("")}
      </div>
      <div class="panel gh-summary">
        <p style="font-weight:800;font-size:14.5px;margin:0 0 12px">Tóm tắt đơn hàng</p>
        <div class="gh-summary-row"><span>Đã chọn</span><span>${selCount} sản phẩm</span></div>
        <div class="gh-summary-row"><span>Tạm tính</span><span>${dinhDangTien(selTotal)}</span></div>
        <div class="gh-summary-row"><span>Phí vận chuyển dự kiến</span><span>${tinhPhiVanChuyen(selTotal) === 0 ? '<span style="color:var(--ok);font-weight:700">Miễn phí</span>' : tinhPhiVanChuyen(selTotal).toLocaleString("vi-VN")+'₫'}</span></div>
        <div class="gh-summary-total"><span>Tổng cộng (tạm tính, chưa gồm VAT)</span><b>${dinhDangTien((selTotal + tinhPhiVanChuyen(selTotal)))}</b></div>
        <button class="btn" id="ghCheckoutBtn" style="width:100%;margin-top:16px" ${items.length === 0 ? 'disabled' : ''}>${items.length === 0 ? 'Giỏ hàng đang trống' : (selItems.length === 0 ? 'Đặt hàng — chọn tất cả sản phẩm →' : `Đặt ${selCount} sản phẩm đã chọn →`)}</button>
        <p style="font-size:11px;color:var(--steel);margin:10px 0 0">Sản phẩm chưa chọn vẫn được lưu trong giỏ hàng, không bị mất. Số tồn kho được kiểm tra lại lần cuối ngay trước khi xác nhận đặt hàng. Miễn phí vận chuyển cho đơn từ ${dinhDangTien(NGUONG_MIEN_PHI_SHIP)}.</p>
      </div>
    </div>
    ${duLieuTrang.checkoutOpen && duLieuTrang.checkoutFresh ? hienThiHopThanhToan() : ''}
  `;
  ganSuKien();
}

// ===== SỰ KIỆN =====
function ganSuKien() {
  const clearAll = document.getElementById("ghClearAll");
  if (clearAll) clearAll.onclick = () => {
    if (!confirm("Xoá toàn bộ sản phẩm trong giỏ hàng?")) return;
    luuGioHang(duLieuTrang.session, {}); hienThiTrang();
  };

  document.querySelectorAll("[data-remove]").forEach(btn => { btn.onclick = () => xoaDong(btn.getAttribute("data-remove")); });
  document.querySelectorAll("[data-inc]").forEach(btn => { btn.onclick = () => { const id = btn.getAttribute("data-inc"); datSoLuong(id, (layGioHang(duLieuTrang.session)[id]?.qty || 0) + 1); }; });
  document.querySelectorAll("[data-dec]").forEach(btn => { btn.onclick = () => { const id = btn.getAttribute("data-dec"); datSoLuong(id, (layGioHang(duLieuTrang.session)[id]?.qty || 0) - 1); }; });
  document.querySelectorAll("[data-qty-input]").forEach(inp => { inp.onchange = () => datSoLuong(inp.getAttribute("data-qty-input"), inp.value); });
  document.querySelectorAll("[data-select]").forEach(cb => { cb.onchange = () => doiChon(cb.getAttribute("data-select")); });
  const selectAll = document.getElementById("ghSelectAll");
  if (selectAll) selectAll.onchange = () => doiChonTatCa(selectAll.checked);

  const checkoutBtn = document.getElementById("ghCheckoutBtn");
  if (checkoutBtn) checkoutBtn.onclick = async () => {
    if (!duLieuTrang.session) { chuyenDenDangNhap("giohang.html"); return; }
    // Nếu người dùng bỏ chọn hết, không khóa nút đặt hàng. Một lần bấm sẽ chọn lại toàn bộ
    // sản phẩm đang có trong giỏ rồi mở ngay màn hình xác nhận.
    if (cacDongDaChon().length === 0) {
      doiChonTatCa(true);
      await taiKhachHang();
      await moThanhToan();
      return;
    }
    await taiKhachHang();
    await moThanhToan();
  };

  const ghCancel = document.getElementById("ghCancel");
  if (ghCancel) ghCancel.onclick = () => { duLieuTrang.checkoutOpen = false; hienThiTrang(); };
  const ghSubmit = document.getElementById("ghSubmit");
  if (ghSubmit) ghSubmit.onclick = guiDonHang;
}

// Lấy giá/tồn kho/category mới nhất cho từng sản phẩm trong giỏ trước khi mở modal thanh toán.

// ===== MỞ THANH TOÁN =====
async function moThanhToan() {
  const items = cacDongDaChon();
  if (items.length === 0) return;
  const ids = items.map(i => i.id);
  const [{ data: fresh }, discountRules] = await Promise.all([
    supabase.from("san_pham").select("id, ma_san_pham, gia_le_vnd, so_luong_ton, dang_hoat_dong, loai_san_pham_id, loai_san_pham(nhom_san_pham)").in("id", ids),
    taiQuyTacChietKhau(supabase)
  ]);
  const freshMap = Object.fromEntries((fresh || []).map(p => [p.id, p]));
  duLieuTrang.checkoutFresh = items.map(i => ({
    id: i.id, ma_san_pham: i.ma_san_pham, qty: i.qty,
    price: freshMap[i.id]?.gia_le_vnd ?? i.gia_le_vnd ?? 0,
    so_luong_ton: freshMap[i.id]?.so_luong_ton ?? 0,
    dang_hoat_dong: !!freshMap[i.id] && freshMap[i.id].dang_hoat_dong !== false,
    category: freshMap[i.id]?.loai_san_pham?.nhom_san_pham || null,
    loai_san_pham_id: freshMap[i.id]?.loai_san_pham_id || null
  }));
  duLieuTrang.discountRules = discountRules || [];
  duLieuTrang.checkoutOpen = true;
  hienThiTrang();
}

// ===== ĐẶT HÀNG =====
async function guiDonHang() {
  if (duLieuTrang.submitting) return;
  const items = duLieuTrang.checkoutFresh || [];
  if (items.length === 0) return;
  const recipientName = document.getElementById("ghRecipient").value.trim();
  const recipientPhone = document.getElementById("ghPhone").value.trim();
  const address = document.getElementById("ghAddress").value.trim();
  if (!recipientName || !recipientPhone || !address) { hienThongBaoNhanh("Vui lòng nhập đầy đủ người nhận, SĐT và địa chỉ giao hàng"); return; }

  duLieuTrang.submitting = true; hienThiTrang();

  const problems = [];
  for (const it of items) {
    if (!it.dang_hoat_dong) problems.push(`${it.ma_san_pham}: sản phẩm hiện không còn bán`);
    else if (it.so_luong_ton < it.qty) problems.push(`${it.ma_san_pham}: chỉ còn ${it.so_luong_ton} sản phẩm (đang đặt ${it.qty})`);
  }
  if (problems.length > 0) {
    duLieuTrang.submitting = false; hienThiTrang();
    hienThongBaoNhanh("Không thể đặt hàng — " + problems[0] + (problems.length > 1 ? ` (và ${problems.length - 1} mục khác)` : ""));
    return;
  }

  const kq = await taoDonHang(supabase, duLieuTrang.session, { items, rules: duLieuTrang.discountRules, nguoiNhan: recipientName, sdt: recipientPhone, diaChi: address });
  if (!kq.ok) { duLieuTrang.submitting = false; hienThiTrang(); hienThongBaoNhanh(kq.loi); return; }
  duLieuTrang.customer = kq.khach;
  const total = kq.tien.total;

  const count = items.length;
  duLieuTrang.submitting = false;
  duLieuTrang.checkoutOpen = false;
  duLieuTrang.success = { count, total };
  // Chỉ xoá khỏi giỏ những sản phẩm VỪA ĐẶT — sản phẩm chưa chọn vẫn được giữ lại trong giỏ hàng
  const remainingCart = layGioHang(duLieuTrang.session);
  items.forEach(i => delete remainingCart[i.id]);
  luuGioHang(duLieuTrang.session, remainingCart);
  hienThiTrang();
}

(async () => {
  await taiPhienDangNhap();

  // Kiểm tra lại tồn kho mới nhất ngay khi mở trang, tự điều chỉnh nếu có món đã bán vượt quá
  const cart = layGioHang(duLieuTrang.session);
  const ids = Object.keys(cart);
  if (ids.length > 0) {
    const { data: fresh } = await supabase.from("san_pham").select("id, so_luong_ton, gia_le_vnd, loai_san_pham(nhom_san_pham)").in("id", ids);
    let changed = false;
    (fresh || []).forEach(f => {
      if (cart[f.id]) {
        cart[f.id].so_luong_ton = f.so_luong_ton;
        cart[f.id].gia_le_vnd = f.gia_le_vnd;
        if (cart[f.id].qty > f.so_luong_ton && f.so_luong_ton > 0) { cart[f.id].qty = f.so_luong_ton; changed = true; }
      }
      duLieuTrang.itemCategories[f.id] = f.loai_san_pham?.nhom_san_pham || null;
    });
    if (changed) luuGioHang(duLieuTrang.session, cart);
  }
  hienThiTrang();
})();

// Bấm Back/Forward giữa các trang có thể khôi phục từ bộ nhớ đệm (bfcache) thay vì tải lại —
// tải lại để luôn thấy đúng giỏ hàng và tồn kho mới nhất.
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});
