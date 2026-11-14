/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/don-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)                — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   chiSoTongQuanDon()                [export]  — Tính chỉ số tổng quan đơn của khách (số đơn, tổng chi tiêu bỏ đơn đã hủy)
   donHangDaLoc()                    [export]  — Lọc đơn theo bộ lọc trạng thái đang chọn
   thongTinHuy(o)                    — Cho biết đơn có hủy được không (chỉ khi còn "Chờ xác nhận")
   hienThiTheDonHang(o)              [export]  — Vẽ thẻ 1 đơn (thu gọn / mở rộng xem chi tiết)
   moRongDon(orderId)                [export async]  — Bật/tắt mở rộng 1 đơn, tải chi tiết và lịch sử khi cần
   hienThiTienTrinhDonHang(orderId)  — Vẽ tiến trình trạng thái của đơn từ lịch sử
   muaLaiDon(orderId)                [export async]  — Đưa các món của đơn cũ vào giỏ để mua lại
   huyDon(orderId)                   [export async]  — Khách hủy đơn (hỏi xác nhận rồi cập nhật trạng thái cancelled)
   taiDonHang()                      [export async]  — Tải danh sách đơn của khách (mới nhất trước)
   ========================================================================== */
// Đơn hàng của khách: tải danh sách, thẻ đơn, tiến trình, mở chi tiết, đặt lại, hủy đơn.
import { layGioHang, luuGioHangTho, taoDongGioHang } from "../../../js/dung-chung/luu-gio-hang.js";
import { maDon } from "../../../js/dung-chung/ma-don.js";
import { khoiThanhToanLienHe } from "../../../js/dung-chung/thong-tin-cua-hang.js";
import { supabase, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { maHoaHtml, dinhDangTien } from "../../../js/dung-chung/dinh-dang.js";
import { nhanTrangThaiDon } from "../../../js/dung-chung/trang-thai-don.js";
export { nhanTrangThaiDon }; // phien.js vẫn import từ file này
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

export function chiSoTongQuanDon() {
  const total = duLieuTrang.orders.length;
  const spent = duLieuTrang.orders.filter(o => o.trang_thai !== "cancelled").reduce((s, o) => s + Number(o.tong_tien || 0), 0);
  // trạng thái ĐÃ XỬ LÝ XONG (nhân viên đã quyết định xong từng dòng hàng, chỉ là không giao đủ),
  // không phải đơn còn đang chờ cửa hàng xử lý. Chỉ những đơn thật sự chưa có kết quả cuối cùng
  // (chờ xác nhận / đã xác nhận / đang giao) mới tính là "đang xử lý".
  const pending = duLieuTrang.orders.filter(o => ["pending", "confirmed", "shipped"].includes(o.trang_thai)).length;
  return { total, spent, pending };
}

export function donHangDaLoc() {
  if (duLieuTrang.statusFilter === "all") return duLieuTrang.orders;
  if (duLieuTrang.statusFilter === "today") {
    const today = new Date().toDateString();
    return duLieuTrang.orders.filter(o => new Date(o.ngay_tao).toDateString() === today);
  }
  // Nhóm gộp CHỈ dùng ở tầng lọc hiển thị (UI) — không đụng tới giá trị trang_thai thật trong DB. Đơn
  // "Chờ xử lý" ở bộ lọc nhanh gộp 2 trạng thái pending+confirmed (đặt xong, cửa hàng chưa giao) để
  // giảm số chip chính; "Bộ lọc nâng cao" vẫn cho chọn riêng từng trạng thái gốc như cũ.
  if (duLieuTrang.statusFilter === "grp_awaiting") return duLieuTrang.orders.filter(o => ["pending", "confirmed"].includes(o.trang_thai));
  return duLieuTrang.orders.filter(o => o.trang_thai === duLieuTrang.statusFilter);
}

function thongTinHuy(o) {
  // Chỉ cần đơn còn ở trạng thái "Chờ xác nhận" (cửa hàng chưa xử lý) là hủy được bất cứ lúc nào,
  // không giới hạn thời gian. (Tính năng "Chốt đơn – chắc chắn mua" đã bỏ theo yêu cầu — thấy
  // thừa thãi khi đã cho hủy không giới hạn thời gian rồi.)
  return { canCancel: o.trang_thai === "pending" };
}

export function hienThiTheDonHang(o) {
  const isOpen = duLieuTrang.expandedOrderId === o.id;
  const items = duLieuTrang.orderItemsCache[o.id];
  const { canCancel } = thongTinHuy(o);
  const isCancelled = o.trang_thai === "cancelled";
  return `
    <div class="acc-order-card" data-order-card="${o.id}">
      <div class="acc-order-head" data-order-toggle="${o.id}">
        <span class="acc-order-code" title="Đọc mã này khi liên hệ ABA">#${maDon(o)}</span>
        <span class="acc-order-date">${new Date(o.ngay_tao).toLocaleDateString("vi-VN")}</span>
        <span class="acc-order-addr">${maHoaHtml(o.dia_chi_giao_hang) || '—'}</span>
        <span class="badge ${o.trang_thai}">${nhanTrangThaiDon(o.trang_thai)}</span>
        <span class="acc-order-total">${dinhDangTien(Number(o.tong_tien))}</span>
        <span class="acc-order-caret ${isOpen ? 'open' : ''}">▼</span>
      </div>
      ${isCancelled ? `<div class="acc-cancelled-note">🚫 Đơn bị hủy bởi <b>${o.nguoi_huy === 'staff' ? 'Cửa hàng' : o.nguoi_huy === 'customer' ? 'Khách hàng (bạn)' : 'Không rõ'}</b>${o.ngay_huy ? ' lúc ' + new Date(o.ngay_huy).toLocaleString("vi-VN") : ''}${maHoaHtml(o.ly_do_huy) ? `<br/><b>Lý do:</b> ${maHoaHtml(o.ly_do_huy)}` : ''}</div>` : ''}
      ${isOpen ? `
        <div class="acc-order-body">
          <p style="font-weight:700;font-size:12.5px;margin:0 0 8px">Tiến trình đơn hàng</p>
          ${hienThiTienTrinhDonHang(o.id)}
          ${!items ? `<p style="font-size:12.5px;color:var(--steel);margin:10px 0 0">Đang tải chi tiết…</p>`
            : items.length === 0 ? `<p style="font-size:12.5px;color:var(--steel);margin:10px 0 0">Không có sản phẩm nào ghi nhận cho đơn này</p>`
            : items.map(it => `<div class="acc-order-item-row"><span class="code">${it.san_pham?.ma_san_pham || '—'} <span style="color:var(--steel);font-weight:400">${it.san_pham?.hang_san_xuat ? '· ' + it.san_pham.hang_san_xuat : ''} × ${it.so_luong}</span>${it.trang_thai_giao_hang === 'refused' ? ` <span style="color:#c0392b;font-weight:600">(Bạn đã từ chối nhận)</span>` : it.trang_thai_giao_hang === 'partially_delivered' ? ` <span style="color:#8a5a12;font-weight:600">(Chỉ nhận ${it.so_luong_da_giao}/${it.so_luong})</span>` : ''}</span><span>${dinhDangTien(Number(it.don_gia * it.so_luong))}</span></div>`).join("")}
          ${items && items.length > 0 ? `
          <div style="border-top:1px solid var(--line-soft);margin-top:8px;padding-top:8px;font-size:12.5px">
            <div style="display:flex;justify-content:space-between"><span>Tạm tính</span><span>${dinhDangTien(Number(o.tien_hang||0))}</span></div>
            ${o.tien_giam_gia > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--ok)"><span>Giảm giá${o.promotion_code ? ' ('+o.promotion_code+')' : ''}</span><span>−${dinhDangTien(Number(o.tien_giam_gia))}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between"><span>VAT (${o.thue_suat||10}%)</span><span>${dinhDangTien(Number(o.tien_thue||0))}</span></div>
            <div style="display:flex;justify-content:space-between"><span>Phí vận chuyển${o.don_vi_van_chuyen ? ' · ' + (o.don_vi_van_chuyen === 'partner' ? 'Đối tác vận chuyển' : 'Nội bộ ABA') : ''}</span><span>${Number(o.phi_van_chuyen||0) === 0 ? 'Miễn phí' : Number(o.phi_van_chuyen).toLocaleString("vi-VN")+'₫'}</span></div>
            ${maHoaHtml(o.ghi_chu_van_chuyen) ? `<div style="display:flex;justify-content:space-between;color:var(--steel)"><span>Mã vận đơn / ghi chú giao hàng</span><span>${maHoaHtml(o.ghi_chu_van_chuyen)}</span></div>` : ''}
          </div>` : ''}
          ${maHoaHtml(o.ten_nguoi_nhan) ? `<p style="font-size:11.5px;color:var(--steel);margin:10px 0 0">Người nhận: ${maHoaHtml(o.ten_nguoi_nhan)}${maHoaHtml(o.sdt_nguoi_nhan) ? ' · ' + maHoaHtml(o.sdt_nguoi_nhan) : ''}</p>` : ''}
          ${!isCancelled && o.trang_thai !== "completed" ? khoiThanhToanLienHe() : ""}
          <div class="row" style="margin-top:10px;gap:8px">
            ${items && items.length > 0 ? `<button class="btn small ghost" data-reorder="${o.id}" type="button" ${duLieuTrang.reorderingId === o.id ? 'disabled' : ''}>${duLieuTrang.reorderingId === o.id ? 'Đang xử lý…' : '🔁 Đặt lại đơn này'}</button>` : ''}
            ${canCancel ? `<button class="btn small ghost" data-cancel-order="${o.id}" type="button" style="color:var(--danger);border-color:var(--danger)">✕ Hủy đơn</button>` : ''}
          </div>
        </div>` : ''}
    </div>`;
}

export async function moRongDon(orderId) {
  duLieuTrang.expandedOrderId = duLieuTrang.expandedOrderId === orderId ? null : orderId;
  if (duLieuTrang.expandedOrderId && !duLieuTrang.orderItemsCache[orderId]) {
    hienThiTrang(); // hiện "Đang tải chi tiết…" ngay trong lúc chờ
    const [{ data: items }, { data: history }] = await Promise.all([
      supabase.from("chi_tiet_don_hang").select("*, trang_thai_giao_hang, so_luong_da_giao, san_pham(ma_san_pham, hang_san_xuat)").eq("don_hang_id", orderId),
      supabase.from("lich_su_don_hang").select("trang_thai, ngay_thay_doi").eq("don_hang_id", orderId).order("ngay_thay_doi", { ascending: true }),
    ]);
    duLieuTrang.orderItemsCache[orderId] = items || [];
    duLieuTrang.orderHistoryCache[orderId] = history || [];
  }
  hienThiTrang();
}

// Icon minh họa cho từng mốc trong tiến trình giao hàng (đúng nghiệp vụ hiện có, không bịa thêm
// trạng thái mới) — theo yêu cầu bổ sung của GVHD: khách hàng cần theo dõi được tiến trình giao
// hàng, không chỉ thấy mỗi trạng thái hiện tại.
const BIEU_TUONG_LICH_SU = { pending:'📝', confirmed:'✅', shipped:'🚚', partially_delivered:'📦', delivery_failed:'⚠️', completed:'🎉', cancelled:'🚫' };

function hienThiTienTrinhDonHang(orderId) {
  const history = duLieuTrang.orderHistoryCache[orderId];
  if (!history) return `<p style="font-size:12.5px;color:var(--steel);margin:0 0 10px">Đang tải tiến trình…</p>`;
  if (history.length === 0) return '';
  return `
    <div class="acc-timeline">
      ${history.map((h, idx) => `
        <div class="acc-timeline-step ${idx === history.length - 1 ? 'current' : ''}">
          <span class="acc-timeline-dot">${BIEU_TUONG_LICH_SU[h.trang_thai] || '•'}</span>
          <div>
            <div class="acc-timeline-label">${nhanTrangThaiDon(h.trang_thai)}</div>
            <div class="acc-timeline-time">${new Date(h.ngay_thay_doi).toLocaleString("vi-VN")}</div>
          </div>
        </div>`).join("")}
    </div>`;
}

export async function muaLaiDon(orderId) {
  duLieuTrang.reorderingId = orderId; hienThiTrang();
  const items = duLieuTrang.orderItemsCache[orderId] || [];
  const ids = items.map(it => it.san_pham_id);
  const { data: fresh } = await supabase.from("san_pham").select("id, ma_san_pham, hang_san_xuat, gia_le_vnd, so_luong_ton, dang_hoat_dong").in("id", ids);
  const freshMap = Object.fromEntries((fresh || []).map(p => [p.id, p]));
  const cart = layGioHang(duLieuTrang.session);
  let added = 0, skipped = [];
  items.forEach(it => {
    const p = freshMap[it.san_pham_id];
    if (!p || p.dang_hoat_dong === false || p.so_luong_ton <= 0) { skipped.push(it.san_pham?.ma_san_pham || it.san_pham_id); return; }
    const qty = Math.min(p.so_luong_ton, (cart[p.id]?.qty || 0) + it.so_luong);
    cart[p.id] = taoDongGioHang(p, qty);
    added++;
  });
  luuGioHangTho(duLieuTrang.session, cart);
  duLieuTrang.reorderingId = null;
  if (added === 0) { duLieuTrang.actionMsg = { type: "error", text: "Không thể đặt lại — sản phẩm trong đơn này hiện đã hết hàng hoặc ngừng bán." }; hienThiTrang(); return; }
  window.location.href = "giohang.html";
}

export async function huyDon(orderId) {
  if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này? Không thể hoàn tác.")) return;
  const { error } = await supabase.from("don_hang").update({ trang_thai: "cancelled", nguoi_huy: "customer", ngay_huy: new Date().toISOString() }).eq("id", orderId);
  if (error) { duLieuTrang.actionMsg = { type: "error", text: "Lỗi: " + error.message }; hienThiTrang(); return; }
  const o = duLieuTrang.orders.find(x => x.id === orderId);
  if (o) { o.trang_thai = "cancelled"; o.nguoi_huy = "customer"; o.ngay_huy = new Date().toISOString(); }
  duLieuTrang.actionMsg = { type: "ok", text: "Đã hủy đơn hàng." };
  hienThiTrang();
  setTimeout(() => { duLieuTrang.actionMsg = null; hienThiTrang(); }, 3000);
}

export async function taiDonHang() {
  const { data } = await supabase.from("don_hang").select("*").order("ngay_tao", { ascending: false });
  duLieuTrang.orders = data || [];
  hienThiTrang();
}
