/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/giao-dien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTheThongKe(a)        — Vẽ các thẻ thống kê (KPI) của đơn hàng
   hienThiMatHangDonHang(o)    — Vẽ các mặt hàng của 1 đơn, kèm nút ghi nhận giao hàng
   hienThiNutTrangThai(o)      — Chỉ hiện đúng nút chuyển trạng thái hợp lệ tiếp theo của đơn
   nhanTraHangCho(o)           — Nhãn cam khi đơn còn yêu cầu trả hàng chưa xử lý
   htmlDongDonHang(o)          — HTML 1 dòng đơn trong bảng
   hienThiNhomDonHang(groups)  — Vẽ các nhóm đơn (tháng/tuần) hoặc báo trống
   hienThiTrang()              — Vẽ khung trang đơn hàng (chỉ gọi 1 lần)
   hienThiKetQua()             — Chỉ cập nhật vùng thống kê và danh sách, giữ nguyên ô lọc đang gõ
   ========================================================================== */
// Vẽ giao diện trang Đơn hàng: thẻ thống kê, danh sách theo nhóm, mặt hàng của từng đơn.
import { hienThiThanhBenNhanVien, ganDangXuat } from "../../nhan-vien-chung.js";
import { dinhDangTien, maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";
import { nguCanh, huyHieu, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { TRANG_THAI_TINH_DOANH_THU, CAC_TRANG_THAI, NGUONG_TU_CHOI_TUAN, NGUONG_TU_CHOI_THANG } from "./hang-so.js";
import { dungNhom, tinhThongKe, donHangDaLoc, donDangChoXuLy, canhBaoKhach, nhanCanhBao } from "./tai-du-lieu.js";
import { moTaLichSuDon, nhanGiaoHangDong, layNhanTrangThai, lopNhanTrangThai, maDon, sdtHienThi } from "./tien-ich.js";
import { hienThiHopDonViVanChuyen, hienThiHopGiaoHangHangLoat, hienThiHopHuy, hienThiHopTraHang, hienThiHopXacNhan } from "./hop-thoai.js";
import { ganSuKienHopThoai, ganSuKienKetQua, ganSuKienThanhCongCu } from "./su-kien.js";

function hienThiTheThongKe(a) {
  return `<div class="kpi-grid">
    <div class="kpi-card">
      <span class="kpi-icon">🧾</span>
      <div class="kpi-value">${a.totalOrders}</div>
      <div class="kpi-label">Tổng số đơn (theo bộ lọc)</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-icon">💰</span>
      <div class="kpi-value">${dinhDangTien(a.totalRevenue)}</div>
      <div class="kpi-label">Tổng doanh thu (theo bộ lọc)</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-icon">🏆</span>
      <div class="kpi-value" title="${a.topProduct ? a.topProduct.code : ''}">${a.topProduct ? a.topProduct.code : '—'}</div>
      <div class="kpi-label">${a.topProduct ? `Mã bán chạy nhất · SL ${a.topProduct.qty}${a.topProduct.hang_san_xuat ? ' · ' + a.topProduct.hang_san_xuat : ''}` : 'Mã hàng bán chạy nhất'}</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-icon">👤</span>
      <div class="kpi-value" title="${a.topCustomer ? a.topCustomer.name : ''}">${a.topCustomer ? a.topCustomer.name : '—'}</div>
      <div class="kpi-label">${a.topCustomer ? `Mua nhiều nhất · ${dinhDangTien(a.topCustomer.revenue)} (${a.topCustomer.orderCount} đơn)` : 'Khách hàng mua nhiều nhất'}</div>
    </div>
  </div>`;
}

function hienThiMatHangDonHang(o) {
  const canMarkDelivery = o.trang_thai === 'shipped' || o.trang_thai === 'partially_delivered';
  return `<div style="background:#fff;padding:12px 14px;border-radius:6px;margin-bottom:10px;font-size:13px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div>
          <p style="margin:0 0 4px"><b>🚚 Giao đến:</b> ${maHoaHtml(o.ten_nguoi_nhan) || maHoaHtml(o.khach_hang?.ho_ten) || '—'} · ${maHoaHtml(o.sdt_nguoi_nhan) || maHoaHtml(o.khach_hang?.so_dien_thoai) || '—'}</p>
          <p style="margin:0">${maHoaHtml(o.dia_chi_giao_hang) || '<span style="color:#c0392b">Chưa có địa chỉ giao hàng (đơn đặt trước khi bổ sung tính năng này)</span>'}</p>
        </div>
        <button class="btn small ghost" data-print-invoice="${o.id}" style="white-space:nowrap;flex-shrink:0">🖨️ In hoá đơn</button>
      </div>
    </div>
    <table style="background:#fff;margin:0"><thead><tr><th>Mã sản phẩm</th><th>Hãng</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Tình trạng giao</th>${canMarkDelivery ? '<th>Xử lý</th>' : ''}</tr></thead>
    <tbody>${(o.chi_tiet_don_hang||[]).map(it => `<tr${it.trang_thai_giao_hang==='refused' ? ' style="opacity:.55"' : ''}>
      <td>${it.san_pham?.ma_san_pham || '—'}</td>
      <td>${it.san_pham?.hang_san_xuat || '—'}</td>
      <td>${it.so_luong}</td>
      <td>${dinhDangTien(Number(it.don_gia||0))}</td>
      <td><b>${dinhDangTien((Number(it.don_gia||0)*it.so_luong))}</b></td>
      <td>
        <span class="badge item-${it.trang_thai_giao_hang}">${nhanGiaoHangDong(it.trang_thai_giao_hang)}</span>
        ${it.trang_thai_giao_hang === 'partially_delivered' ? `<div style="font-size:11.5px;color:var(--steel);margin-top:3px">Nhận ${it.so_luong_da_giao}/${it.so_luong}</div>` : ''}
        ${(it.trang_thai_giao_hang==='refused' || it.trang_thai_giao_hang==='partially_delivered') && maHoaHtml(it.ly_do_tu_choi) ? `<div style="font-size:11.5px;color:var(--steel);margin-top:3px">Lý do: ${maHoaHtml(it.ly_do_tu_choi)}</div>` : ''}
      </td>
      ${canMarkDelivery ? `<td>
        <span style="font-size:12px;color:var(--steel)">${it.trang_thai_giao_hang==='pending' ? 'Chờ ghi nhận ở nút bên dưới' : '—'}</span>
      </td>` : ''}
    </tr>`).join("") || `<tr><td colspan="${canMarkDelivery ? 7 : 6}" class="empty">Không có dòng sản phẩm</td></tr>`}</tbody></table>
    ${maHoaHtml(o.ghi_chu) ? `<p style="font-size:12.5px;color:var(--steel);margin:10px 0 0">Ghi chú khách: ${maHoaHtml(o.ghi_chu)}</p>` : ''}
    <div style="background:#fff;padding:12px 14px;border-radius:6px;margin-top:10px;font-size:13px;max-width:320px;margin-left:auto">
      <div style="display:flex;justify-content:space-between"><span>Tạm tính</span><span>${dinhDangTien(Number(o.tien_hang||0))}</span></div>
      ${o.tien_giam_gia > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--ok)"><span>Giảm giá</span><span>−${dinhDangTien(Number(o.tien_giam_gia))}</span></div>` : ''}
      ${o.tien_chiet_khau_so_luong > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--ok)"><span>Chiết khấu mua số lượng</span><span>−${dinhDangTien(Number(o.tien_chiet_khau_so_luong))}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between"><span>VAT (${o.thue_suat||10}%)</span><span>${dinhDangTien(Number(o.tien_thue||0))}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>Phí vận chuyển</span>
        <span>${Number(o.phi_van_chuyen||0) === 0 ? 'Miễn phí' : Number(o.phi_van_chuyen).toLocaleString("vi-VN")+'₫'} <button class="btn small ghost" data-edit-shipping="${o.id}" style="padding:1px 6px;font-size:11px;margin-left:4px">Sửa</button></span>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:700;border-top:1px solid var(--line-soft);margin-top:6px;padding-top:6px"><span>Tổng cộng</span><span>${dinhDangTien(Number(o.tong_tien||0))}</span></div>
    </div>
    <div style="background:#fff;padding:12px 14px;border-radius:6px;margin-top:10px;font-size:13px">
      <p style="margin:0 0 6px"><b>🚚 Đơn vị giao hàng:</b> ${o.don_vi_van_chuyen || '<span style="color:var(--steel)">Chưa gán</span>'}${maHoaHtml(o.ghi_chu_van_chuyen) ? ` · Mã vận đơn/ghi chú: ${maHoaHtml(o.ghi_chu_van_chuyen)}` : ''}</p>
      ${['shipped','partially_delivered','delivery_failed','completed'].includes(o.trang_thai) ? `<button class="btn small ghost" data-set-carrier="${o.id}" type="button">${o.don_vi_van_chuyen ? 'Sửa' : 'Gán'} đơn vị giao hàng</button>` : `<span style="font-size:11.5px;color:var(--steel)">Gán đơn vị giao hàng khi bắt đầu giao</span>`}
    </div>
    ${canhBaoKhach(o.khach_hang_id) ? `<p class="refusal-note">⚠️ Khách này hay hủy/từ chối nhận hàng: <b>${canhBaoKhach(o.khach_hang_id)}</b> (ngưỡng cảnh báo: quá ${NGUONG_TU_CHOI_TUAN} đơn/7 ngày hoặc quá ${NGUONG_TU_CHOI_THANG} đơn/tháng). Nên gọi xác nhận với khách trước khi giao đơn này.</p>` : ''}
    ${(o.chi_tiet_don_hang||[]).some(it => it.trang_thai_giao_hang === 'refused' || it.trang_thai_giao_hang === 'partially_delivered') ? ((o.hang_cho_ve_kho || []).length
      // Đơn theo quy trình mới: kho chỉ cộng khi bấm "Đã nhận hàng về kho"
      ? ((o.hang_cho_ve_kho || []).some(w => w.trang_thai === 'pending')
          ? `<p style="font-size:12.5px;color:#8a5a12;margin:10px 0 0">📦 Hàng khách không nhận <b>chưa được cộng vào kho</b> — đang chờ về cửa hàng. Khi hàng về tới nơi, bấm <b>"Đã nhận hàng về kho"</b> ở khối bên dưới.</p>`
          : `<p style="font-size:12.5px;color:var(--ok);margin:10px 0 0">✅ Hàng khách không nhận đã về cửa hàng và được cộng vào kho (xem <b>Kho hàng → Lịch sử giao dịch</b>, loại "Khách trả hàng").</p>`)
      // Đơn cũ (trước khi có quy trình chờ về kho): kho đã được cộng tự động lúc ghi kết quả giao
      : `<p style="font-size:12.5px;color:var(--ok);margin:10px 0 0">✅ Hàng khách không nhận của đơn này đã được cộng lại kho tự động lúc ghi nhận kết quả giao (đơn tạo trước khi có bước "chờ về kho").</p>`) : ''}
    ${maHoaHtml(o.ly_do_huy) ? `<p style="font-size:12.5px;color:#c0392b;margin:10px 0 0">🚫 <b>Lý do hủy:</b> ${maHoaHtml(o.ly_do_huy)}</p>` : ''}
    ${o.trang_thai === 'shipped' ? `
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn small ghost" data-complete-delivery="${o.id}">✓ Giao đủ & hoàn tất</button>
        <button class="btn small" data-batch-delivery="${o.id}">🚚 Ghi nhận kết quả giao hàng</button>
      </div>` : ''}
    ${o.trang_thai === 'completed' ? `
      <div style="background:#fff8ec;border:1px solid #f2d49c;padding:11px 13px;border-radius:7px;margin-top:12px">
        <div style="font-weight:700;font-size:13px">⚠️ Trả hàng do lỗi sản phẩm</div>
        <div style="font-size:12px;color:var(--steel);margin:4px 0 8px">Chỉ dùng khi hàng đã giao có lỗi, giao sai sản phẩm hoặc hư hỏng do vận chuyển. Không áp dụng cho hàng khách đã bóc ra sử dụng hoặc chỉ đổi ý. Yêu cầu sẽ chờ nhân viên kiểm tra và xác nhận nhận hàng.</div>
        <button class="btn small ghost" data-post-return="${o.id}">Tiếp nhận trả hàng do lỗi</button>
      </div>` : ''}
    ${(o.hang_cho_ve_kho || []).length ? `<div style="background:#fff;padding:12px 14px;border-radius:6px;margin-top:10px">
      <p style="font-weight:700;font-size:13px;margin:0 0 4px">📦 Hàng khách không nhận — chờ về kho</p>
      <p style="font-size:11.5px;color:var(--steel);margin:0 0 6px">Kho chỉ được cộng khi hàng đã về tới cửa hàng và bạn bấm xác nhận.</p>
      ${(o.hang_cho_ve_kho || []).map(w => `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid var(--line-soft);border-radius:6px;padding:9px 10px;margin-top:7px;flex-wrap:wrap">
        <div style="font-size:12px"><b>${w.san_pham?.ma_san_pham || '—'}</b> · SL ${w.so_luong}${maHoaHtml(w.ly_do) ? ' · ' + maHoaHtml(w.ly_do) : ''}<br><span style="color:var(--steel)">${w.trang_thai === 'pending' ? 'Đang chờ hàng về cửa hàng' : 'Đã nhận về kho lúc ' + new Date(w.ngay_nhan).toLocaleString('vi-VN')}</span></div>
        ${w.trang_thai === 'pending' ? `<button class="btn small" data-receive-stock="${w.id}" data-stock-order="${o.id}">✓ Đã nhận hàng về kho</button>` : ''}
      </div>`).join('')}
    </div>` : ''}
    ${(o.yeu_cau_tra_hang || []).length ? `<div style="background:#fff;padding:12px 14px;border-radius:6px;margin-top:10px">
      <p style="font-weight:700;font-size:13px;margin:0 0 8px">↩ Yêu cầu trả hàng</p>
      ${(o.yeu_cau_tra_hang || []).map(r => `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid var(--line-soft);border-radius:6px;padding:9px 10px;margin-top:7px;flex-wrap:wrap">
        <div style="font-size:12px"><b>${r.san_pham?.ma_san_pham || '—'}</b> · SL ${r.so_luong} · ${maHoaHtml(r.ly_do)}<br><span style="color:var(--steel)">${new Date(r.ngay_tao).toLocaleString('vi-VN')} · ${r.trang_thai === 'pending' ? 'Đang chờ xử lý' : r.trang_thai === 'approved' ? 'Đã duyệt, chờ nhận hàng' : r.trang_thai === 'received' ? 'Đã nhận hàng' : 'Đã từ chối'}</span></div>
        ${r.trang_thai === 'pending' ? `<div style="display:flex;gap:6px"><button class="btn small" data-receive-return="${r.id}" data-return-order="${o.id}">✓ Nhận hàng & cộng kho</button><button class="btn small ghost" data-reject-return="${r.id}" data-return-order="${o.id}">Từ chối</button></div>` : r.trang_thai === 'approved' ? `<button class="btn small" data-receive-return="${r.id}" data-return-order="${o.id}">✓ Xác nhận đã nhận hàng</button>` : ''}
      </div>`).join('')}
    </div>` : ''}
    <div style="margin-top:16px">
      <p style="font-weight:700;font-size:13px;margin:0 0 8px">🕐 Lịch sử trạng thái (${duLieuTrang.orderHistory.length})</p>
      <div style="max-height:220px;overflow-y:auto;border:1px solid var(--line-soft);border-radius:6px">
        ${duLieuTrang.orderHistory.length === 0 ? `<p style="font-size:12.5px;color:var(--steel);padding:10px 12px;margin:0">Chưa có lịch sử trạng thái.</p>` :
          duLieuTrang.orderHistory.map((l, i) => `
            <div style="padding:8px 12px;border-bottom:1px solid var(--line-soft);font-size:12.5px">
              <span style="color:var(--steel)">${new Date(l.ngay_thay_doi).toLocaleString("vi-VN")}</span> — ${moTaLichSuDon(l, i)}
            </div>`).join("")}
      </div>
    </div>`;
}

// Chỉ hiện đúng hành động hợp lệ tiếp theo của từng trạng thái — không cho nhảy trạng thái tùy ý.
function hienThiNutTrangThai(o) {
  if (o.trang_thai === 'pending') {
    return `<button class="btn small" data-confirm-order="${o.id}">✓ Xác nhận đơn</button> <button class="btn small ghost" data-cancel-order="${o.id}" style="color:var(--danger)">✕ Hủy đơn</button>`;
  }
  if (o.trang_thai === 'confirmed') {
    return `<button class="btn small" data-ship-order="${o.id}">🚚 Bắt đầu giao hàng</button> <button class="btn small ghost" data-cancel-order="${o.id}" style="color:var(--danger)">✕ Hủy đơn</button>`;
  }
  return `<span style="font-size:11.5px;color:var(--steel)">—</span>`;
}

// Đơn đã "Hoàn tất" nhưng còn yêu cầu trả hàng chưa xử lý -> hiện nhãn cam để nhân viên không bỏ sót.
function nhanTraHangCho(o) {
  const n = (o.yeu_cau_tra_hang || []).filter(r => r.trang_thai === 'pending' || r.trang_thai === 'approved').length;
  const w = (o.hang_cho_ve_kho || []).filter(r => r.trang_thai === 'pending').length;
  return (n ? ` <span class="badge pending" title="Có ${n} yêu cầu trả hàng chưa xử lý — mở Chi tiết để nhận hàng/từ chối">↩ Chờ xử lý trả hàng${n > 1 ? ' (' + n + ')' : ''}</span>` : '')
    + (w ? ` <span class="badge pending" title="Hàng khách không nhận còn trên đường về — mở Chi tiết, khi hàng về tới cửa hàng bấm Đã nhận hàng về kho">📦 Chờ hàng về kho${w > 1 ? ' (' + w + ')' : ''}</span>` : '');
}

function htmlDongDonHang(o) {
  return `
    <tr>
      <td><b style="font-family:'JetBrains Mono',monospace;font-size:12.5px">${maDon(o)}</b></td>
      <td>${new Date(o.ngay_tao).toLocaleString("vi-VN")}</td>
      <td>${o.khach_hang?.ma_khach_hang ? `<span style="font-family:monospace;font-size:12px;color:var(--steel)">${o.khach_hang.ma_khach_hang}</span> · ` : ''}${maHoaHtml(o.khach_hang?.ho_ten) || '(chưa cập nhật tên)'}${maHoaHtml(o.khach_hang?.ten_cong_ty) ? ` <span class="role-badge">${maHoaHtml(o.khach_hang.ten_cong_ty)}</span>` : ''}${nhanCanhBao(o.khach_hang_id)}</td>
      <td>${sdtHienThi(o) || '—'}</td>
      <td style="max-width:220px;font-size:12px;color:var(--steel)">${o.dia_chi_giao_hang ? maHoaHtml(o.dia_chi_giao_hang.length > 40 ? o.dia_chi_giao_hang.slice(0,40)+'…' : o.dia_chi_giao_hang) : '<span style="color:#c0392b">Chưa có</span>'}</td>
      <td><b>${dinhDangTien(Number(o.tong_tien))}</b></td>
      <td><span class="badge ${lopNhanTrangThai(o.trang_thai)}">${layNhanTrangThai(o.trang_thai)}</span>${nhanTraHangCho(o)}</td>
      <td style="white-space:nowrap">${hienThiNutTrangThai(o)}</td>
      <td><button class="btn small blue" data-expand="${o.id}">${duLieuTrang.expanded===o.id?'Thu gọn':'Chi tiết'}</button></td>
    </tr>
    ${duLieuTrang.expanded === o.id ? `<tr class="expand-row"><td colspan="9">${hienThiMatHangDonHang(o)}</td></tr>` : ''}
  `;
}

function hienThiNhomDonHang(groups) {
  if (duLieuTrang.orders.length === 0) {
    return `<table><tbody><tr><td colspan="9" class="empty"><span class="big">🛒</span>Chưa có đơn hàng nào</td></tr></tbody></table>`;
  }
  const nonEmpty = groups.filter(g => g.orders.length > 0);
  if (nonEmpty.length === 0) {
    return `<table><tbody><tr><td colspan="9" class="empty"><span class="big">🔍</span>Không tìm thấy đơn hàng phù hợp với bộ lọc</td></tr></tbody></table>`;
  }
  // state.groupsCache lưu tạm để nút "Excel" của từng nhóm lấy đúng danh sách đơn của nhóm đó khi
  // được bấm, không cần lọc lại (nhóm đã tính sẵn ở dungNhom()).
  duLieuTrang.groupsCache = new Map(nonEmpty.map(g => [g.key, g]));
  return nonEmpty.map(g => `
    <div class="order-group">
      ${g.label ? `<div class="group-header"><span>${g.label}</span><span class="group-meta">${g.orders.length} đơn · ${dinhDangTien(g.orders.reduce((s,o)=>s+Number(o.tong_tien||0),0))} <button type="button" class="group-export-btn" data-export-group="${g.key}" title="Xuất Excel riêng nhóm này">⬇ Excel</button></span></div>` : ''}
      <table>
        <thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Khách hàng</th><th>SĐT</th><th>Địa chỉ giao</th><th>Tổng tiền</th><th>Trạng thái</th><th>Hành động</th><th></th></tr></thead>
        <tbody>${g.orders.map(o => htmlDongDonHang(o)).join("")}</tbody>
      </table>
    </div>
  `).join("");
}

// Vẽ toàn bộ khung trang (chỉ gọi 1 lần) — vùng thống kê + kết quả được cập nhật riêng qua
// hienThiKetQua() để ô tìm kiếm không bị mất focus mỗi lần gõ phím.
function hienThiTrang() {
  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'don-hang.html', huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <div class="toolbar">
    <h1 class="page-title" style="margin:0">Đơn hàng khách đặt</h1>
    <button class="btn ghost" id="btnExport">⬇ Xuất Excel</button>
  </div>

  <div class="filter-bar">
    <div class="search-row">
      <input type="text" id="fSearch" placeholder="🔍 Tìm theo mã khách (VD: KH0001), tên khách, tên công ty, số điện thoại hoặc mã đơn (VD: 78605C21)..." value="${duLieuTrang.search}" />
    </div>
    <div class="filter-row">
      <div class="fgroup">
        <label>Từ ngày</label>
        <input type="date" id="fDateFrom" value="${duLieuTrang.dateFrom}" />
      </div>
      <div class="fgroup">
        <label>Đến ngày</label>
        <input type="date" id="fDateTo" value="${duLieuTrang.dateTo}" />
      </div>
      <div class="fgroup">
        <label>Phân nhóm</label>
        <select id="fGroup">
          <option value="none" ${duLieuTrang.groupBy==='none'?'selected':''}>Không phân nhóm</option>
          <option value="day" ${duLieuTrang.groupBy==='day'?'selected':''}>Theo ngày</option>
          <option value="month" ${duLieuTrang.groupBy==='month'?'selected':''}>Theo tháng</option>
          <option value="week" ${duLieuTrang.groupBy==='week'?'selected':''}>Theo tuần trong tháng</option>
        </select>
      </div>
      <div class="fgroup">
        <label>&nbsp;</label>
        <button class="btn ghost small" id="btnClearFilters" type="button">✕ Xóa bộ lọc</button>
      </div>
    </div>

    <div class="status-filter-row">
      <div class="status-filter-head">
        <span class="status-filter-title">Trạng thái đơn hàng</span>
        <button type="button" class="cat-chip ${duLieuTrang.filterStatuses.size === 0 && !duLieuTrang.choXuLy ? 'active' : ''}" id="btnStatusAll">Tất cả</button>
      </div>
      <div id="fStatusGroup">
        ${CAC_TRANG_THAI.map(s => `<button type="button" class="cat-chip ${duLieuTrang.filterStatuses.has(s) ? 'active' : ''}" data-status="${s}">${layNhanTrangThai(s)}</button>`).join("")}
        <button type="button" class="cat-chip ${duLieuTrang.choXuLy ? 'active' : ''}" id="btnChoXuLy" title="Đơn còn yêu cầu trả hàng hoặc hàng về kho chưa xử lý">↩ Chờ xử lý trả hàng (${duLieuTrang.orders.filter(donDangChoXuLy).length})</button>
      </div>
      <button type="button" class="revenue-preset-btn ${duLieuTrang.filterStatuses.size === TRANG_THAI_TINH_DOANH_THU.length && TRANG_THAI_TINH_DOANH_THU.every(s => duLieuTrang.filterStatuses.has(s)) ? 'active' : ''}" id="btnPresetRevenue">
        💰 Doanh thu thực <span>Hoàn tất + Giao một phần</span>
      </button>
    </div>
  </div>

  <div id="analyticsZone"></div>
  <div id="resultsZone"></div>
  `;
  document.getElementById("khuVucModal").innerHTML = `
    ${duLieuTrang.confirmModalOrderId ? hienThiHopXacNhan() : ''}
    ${duLieuTrang.cancelModalOrderId ? hienThiHopHuy() : ''}
    ${duLieuTrang.carrierModalOrderId ? hienThiHopDonViVanChuyen() : ''}
    ${duLieuTrang.batchDeliveryOrderId ? hienThiHopGiaoHangHangLoat() : ''}
    ${duLieuTrang.returnModalOrderId ? hienThiHopTraHang() : ''}
  
  `;
  ganDangXuat(nguCanh.supabase);
  ganSuKienThanhCongCu();
  ganSuKienHopThoai();
  hienThiKetQua();
}

// Chỉ cập nhật vùng thống kê + danh sách kết quả, giữ nguyên các ô lọc đang được focus/gõ dở.
function hienThiKetQua() {
  const list = donHangDaLoc();
  const analytics = tinhThongKe(list);
  const groups = dungNhom(list);
  document.getElementById("analyticsZone").innerHTML = hienThiTheThongKe(analytics);
  document.getElementById("resultsZone").innerHTML = hienThiNhomDonHang(groups);
  ganSuKienKetQua();
}

hanhDong.hienThiTrang = hienThiTrang;
hanhDong.hienThiKetQua = hienThiKetQua;
