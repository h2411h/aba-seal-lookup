/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia/giao-dien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   cacNutThaoTac(q)         — HTML các nút thao tác của 1 yêu cầu
   hienThiFormTheoLoai(q)   — Vẽ form động theo loại yêu cầu
   tomTatDaXuLy(q)          — Hiển thị chỉ đọc nội dung đã xử lý của yêu cầu đã đóng
   hienThiChiTietBaoGia(q)  — Vẽ chi tiết 1 yêu cầu (người phụ trách, form, trao đổi)
   hienThiTrang()           — Vẽ khung trang yêu cầu/báo giá
   hienThiKetQua()          — Vẽ lại vùng danh sách yêu cầu theo bộ lọc
   ========================================================================== */
// Vẽ giao diện trang Yêu cầu khách hàng: nút hành động, form theo loại yêu cầu, chi tiết, danh sách kết quả.
import { hienThiThanhBenNhanVien, ganDangXuat } from "../../nhan-vien-chung.js";
import { dinhDangTien, dinhDangNgayVN, maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";
import { nguCanh, huyHieu, banDoNhanVien, dsNhanVien, tatCaSanPham, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { cacDongSanPhamBaoHanh } from "./bao-hanh.js";
import { yeuCauDaLoc } from "./tai-du-lieu.js";
import { TRANG_THAI_DANG_MO, LOAI_YEU_CAU, CAC_TRANG_THAI, layNhanTrangThai, luaChonDonDaThanhToan, maDonNgan, luaChonSanPham, tomTatLienQuan, nhanLoaiYeuCau, lopNhanTrangThai } from "./nhan.js";
import { ganSuKienKetQua, ganSuKienThanhCongCu } from "./su-kien.js";
import { hienThiTraoDoi, yeuCauDaDong } from "./trao-doi.js";

function cacNutThaoTac(q) {
  // Không còn nút "Lưu" riêng: dữ liệu xử lý được lưu khi bấm "Hoàn tất yêu cầu" (xem gomDuLieuXuLy trong su-kien.js).
  return '';
}

// ---- Form động theo loại yêu cầu (mục 4) ----
function hienThiFormTheoLoai(q) {
  const td = q.du_lieu_loai || {};
  const productInfo = td.product_id ? tatCaSanPham.find(p => String(p.id) === String(td.product_id)) : null;
  const orderInfo = td.order_id ? duLieuTrang.paidOrders.find(o => String(o.id) === String(td.order_id)) : null;

  if (q.loai_yeu_cau === "product_inquiry") {
    return `<div class="request-mini-grid">
      <div class="field"><label class="field-label">Sản phẩm khách hỏi</label><select data-td="product_id">${luaChonSanPham(td.product_id)}</select></div>
      <div class="request-related-card">${productInfo ? `<b>${productInfo.ma_san_pham}</b><br><span>${productInfo.hang_san_xuat || '—'} · ${dinhDangTien(productInfo.gia_le_vnd)} · Tồn ${productInfo.so_luong_ton ?? 0}</span>` : 'Chưa chọn sản phẩm'}</div>
    </div>
    <div class="field"><label class="field-label">Nội dung trả lời</label><textarea data-td="reply_content" rows="3" placeholder="Tóm tắt thông tin sản phẩm đã tư vấn cho khách...">${maHoaHtml(td.reply_content) || ''}</textarea></div>
    ${cacNutThaoTac(q)}`;
  }

  if (q.loai_yeu_cau === "technical_advice") {
    return `<div class="request-mini-grid">
      <div class="field"><label class="field-label">Sản phẩm liên quan</label><select data-td="product_id">${luaChonSanPham(td.product_id)}</select></div>
      <div class="field"><label class="field-label">Đơn đã giao (nếu liên quan)</label><select data-td="order_id">${luaChonDonDaThanhToan(td.order_id)}</select></div>
    </div>
    <p class="request-help">💡 Có thể chọn <b>sản phẩm</b> cho câu hỏi kỹ thuật chung hoặc chọn <b>đơn đã giao</b> để tra nhanh lịch sử mua. Có thể chọn cả hai.</p>
    ${orderInfo ? `<div class="request-related-card"><b>Đơn ${maDonNgan(orderInfo)}</b> · ${maHoaHtml(orderInfo.khach_hang?.ho_ten) || 'Khách'} · ${dinhDangTien(orderInfo.tong_tien)}<br><span>${(orderInfo.chi_tiet_don_hang||[]).map(i => `${i.san_pham?.ma_san_pham || '—'} × ${i.so_luong}`).join(' · ') || 'Không có sản phẩm'}</span></div>` : ''}
    <div class="field"><label class="field-label">Nội dung tư vấn kỹ thuật</label><textarea data-td="reply_content" rows="3" placeholder="Cách lắp, cách dùng, khả năng tương thích, thông số...">${maHoaHtml(td.reply_content) || ''}</textarea></div>
    ${cacNutThaoTac(q)}`;
  }

  if (q.loai_yeu_cau === "complaint") {
    return `<div class="field"><label class="field-label">Nội dung xử lý</label><textarea data-td="reply_content" rows="3" placeholder="Nhập nội dung phản hồi / kết quả xử lý khiếu nại...">${maHoaHtml(td.reply_content || "")}</textarea></div>
    ${cacNutThaoTac(q)}`;
  }

  if (q.loai_yeu_cau === "warranty") {
    return `<div class="request-mini-grid">
      <div class="field"><label class="field-label">Đơn đã giao <span style="color:var(--danger)">*</span></label>
        ${orderInfo
          // Yêu cầu đã gắn đơn (khách chọn lúc gửi) → chỉ hiển thị, KHÔNG cho đổi. Chưa có đơn mới hiện ô chọn.
          ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--line,#d0d7de);border-radius:8px;background:#f6f8fa"><b>🔒 ${maDonNgan(orderInfo)}</b><span>${maHoaHtml(orderInfo.khach_hang?.ho_ten) || 'Khách'} · ${dinhDangNgayVN(orderInfo.ngay_tao)}</span></div>`
          : `<select data-warranty-order="${q.id}">${luaChonDonDaThanhToan(td.order_id, false)}</select>`}
      </div>
      <div class="request-related-card">${orderInfo ? `<b>Đơn ${maDonNgan(orderInfo)}</b> · ${maHoaHtml(orderInfo.khach_hang?.ho_ten) || 'Khách'} · ${dinhDangNgayVN(orderInfo.ngay_tao)} · ${dinhDangTien(orderInfo.tong_tien)}<br><span>Chỉ lấy sản phẩm thuộc đơn này.</span> <a class="btn small ghost" href="don-hang.html?order=${orderInfo.id}">Mở đơn →</a>` : 'Chọn đơn để xem sản phẩm'}</div>
    </div>
    <div class="field"><label class="field-label">Sản phẩm cần bảo hành / đổi trả <span style="color:var(--danger)">*</span></label>${cacDongSanPhamBaoHanh(orderInfo, td)}</div>
    ${cacNutThaoTac(q)}`;
  }

  return `<div class="field"><label class="field-label">Nội dung xử lý</label><textarea data-td="reply_content" rows="3">${maHoaHtml(td.reply_content) || ''}</textarea></div>${cacNutThaoTac(q)}`;
}

// Yêu cầu đã đóng: hiển thị CHỈ ĐỌC "đã xử lý đơn nào, sản phẩm nào, lỗi gì" — lấy từ du_lieu_loai
// (được lưu lúc bấm "Hoàn tất yêu cầu"). Phản hồi cho khách xem ở khung "Trao đổi" ngay phía trên.
function tomTatDaXuLy(q) {
  const td = q.du_lieu_loai || {};
  const order = td.order_id ? duLieuTrang.paidOrders.find(o => String(o.id) === String(td.order_id)) : null;

  // Dòng "Đơn ..." (nếu không tìm thấy đơn trong danh sách thì vẫn hiện mã đơn lấy từ id)
  const dongDon = td.order_id
    ? `<p style="margin:8px 0 0">📦 Đơn <b>${maDonNgan({ id: td.order_id })}</b>${order ? ` · ${maHoaHtml(order.khach_hang?.ho_ten) || 'Khách'} · ${dinhDangNgayVN(order.ngay_tao)} · ${dinhDangTien(order.tong_tien)}` : ''}
         <a class="btn small ghost" href="don-hang.html?order=${td.order_id}">Mở đơn →</a></p>`
    : '';

  // Danh sách sản phẩm đã ghi nhận lỗi: mã SP × số lượng lỗi — mô tả lỗi
  const dsSanPham = (Array.isArray(td.products) ? td.products : []).map(x => {
    const item = (order?.chi_tiet_don_hang || []).find(i => String(i.id) === String(x.order_item_id));
    const ma = item?.san_pham?.ma_san_pham || tatCaSanPham.find(p => String(p.id) === String(x.product_id))?.ma_san_pham || 'Sản phẩm';
    return `<li><b>${ma}</b> × ${x.quantity_issue} — ${maHoaHtml(x.issue_description || '')}</li>`;
  }).join('');

  const noiDung = td.reply_content ? `<p style="margin:8px 0 0">Nội dung xử lý: ${maHoaHtml(td.reply_content)}</p>` : '';
  const trong = !dongDon && !dsSanPham && !noiDung;

  return `<div style="margin-top:14px;padding:12px 14px;border:1.5px solid var(--line);border-radius:8px;font-size:13px">
    <b>Nội dung đã xử lý</b>
    ${trong ? '<p style="margin:8px 0 0;color:var(--steel)">Chưa ghi nhận chi tiết (đơn / sản phẩm lỗi) cho yêu cầu này.</p>' : ''}
    ${dongDon}
    ${dsSanPham ? `<ul style="margin:8px 0 0;padding-left:20px">${dsSanPham}</ul>` : ''}
    ${noiDung}
  </div>`;
}

function hienThiChiTietBaoGia(q) {
  const assigneeOptions = dsNhanVien.filter(s => ['sales','admin'].includes(s.vai_tro));
  return `
    <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin-bottom:14px;padding-bottom:14px;border-bottom:1.5px dashed var(--line)">
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--steel);display:block;margin-bottom:4px">Loại yêu cầu</label>
        <select data-type-select="${q.id}">
          ${LOAI_YEU_CAU.map(t => `<option value="${t}" ${q.loai_yeu_cau===t?'selected':''}>${nhanLoaiYeuCau(t)}</option>`).join("")}
          ${!LOAI_YEU_CAU.includes(q.loai_yeu_cau) ? `<option value="${q.loai_yeu_cau}" selected>${nhanLoaiYeuCau(q.loai_yeu_cau)}</option>` : ''}
        </select>
      </div>
      <div>
        <label style="font-size:12px;font-weight:700;color:var(--steel);display:block;margin-bottom:4px">Người xử lý</label>
        ${q.nguoi_xu_ly
          ? `<div style="display:flex;gap:6px;align-items:center">
               <span class="role-badge">👤 ${banDoNhanVien[q.nguoi_xu_ly] || '(đã rời)'}</span>
               <select data-reassign="${q.id}" style="width:150px">
                 <option value="">— Đổi người xử lý —</option>
                 ${assigneeOptions.map(s => `<option value="${s.id}">${maHoaHtml(s.ho_ten)}</option>`).join("")}
               </select>
             </div>`
          : `<button class="btn small blue" data-claim="${q.id}">👤 Nhận xử lý</button>`}
      </div>
      ${maHoaHtml(q.email_khach_hang) ? `<a href="mailto:${maHoaHtml(q.email_khach_hang)}" style="font-size:12.5px;color:var(--blueprint)">✉ ${maHoaHtml(q.email_khach_hang)}</a>` : ''}
      <span style="font-size:12.5px;color:var(--steel)">📞 ${maHoaHtml(q.sdt_khach_hang)} <a href="tel:${maHoaHtml(q.sdt_khach_hang)}" style="color:var(--blueprint)">(gọi ngoài hệ thống)</a></span>
    </div>

    <div data-request-detail="${q.id}">
      ${hienThiTraoDoi(q)}
      ${yeuCauDaDong(q) ? tomTatDaXuLy(q) : hienThiFormTheoLoai(q)}
    </div>

    ${!yeuCauDaDong(q) ? `
      <div style="margin-top:16px">
        <div style="display:flex;gap:8px;justify-content:flex-start;align-items:center">
          <button class="btn" data-confirm-resolve="${q.id}">✅ Hoàn tất yêu cầu</button>
          <button class="btn ghost" data-mark-cancelled="${q.id}" style="color:var(--danger);border-color:var(--danger)">🚫 Đánh dấu đã hủy</button>
        </div>
      </div>` : `
      <div style="margin-top:16px;padding:12px 14px;background:${q.trang_thai==='resolved' ? '#f0f9f4' : '#fdf0f0'};border-radius:8px;font-size:13px">
        <b>${q.trang_thai==='resolved' ? '✅ Hoàn tất' : q.trang_thai==='cancelled' ? '🚫 Đã hủy' : '⛔ Không xử lý được'}</b>
        ${q.ket_qua_xu_ly ? `<p style="margin:6px 0 0">Phản hồi khách hàng: ${maHoaHtml(q.ket_qua_xu_ly)}</p>` : ''}
        ${q.ngay_xu_ly_xong ? `<p style="margin:4px 0 0;color:var(--steel);font-size:11.5px">Lúc: ${new Date(q.ngay_xu_ly_xong).toLocaleString("vi-VN")}</p>` : ''}
        <button class="btn small ghost" data-reopen="${q.id}" style="margin-top:10px" title="Dùng khi khách phát hiện thêm sản phẩm lỗi hoặc cần xử lý lại">↩ Mở lại yêu cầu</button>
      </div>`}

  `;
}

function hienThiTrang() {
  const total = duLieuTrang.quotes.length;
  const open = duLieuTrang.quotes.filter(q => TRANG_THAI_DANG_MO.includes(q.trang_thai)).length;
  const resolved = duLieuTrang.quotes.filter(q => q.trang_thai === 'resolved').length;
  const cancelled = duLieuTrang.quotes.filter(q => q.trang_thai === 'cancelled').length;

  document.getElementById("staffSidebar").innerHTML = hienThiThanhBenNhanVien(nguCanh.staff, nguCanh.session, 'bao-gia.html', huyHieu);
  document.getElementById("noiDungTrang").innerHTML = `
  <div class="page-head">
    <div>
      <div class="page-kicker">YÊU CẦU KHÁCH HÀNG</div>
      <h1 class="page-title">Quản lý yêu cầu khách hàng</h1>
      <p class="page-desc">Tiếp nhận, xử lý và phản hồi yêu cầu khách hàng.</p>
    </div>
  </div>

  <div class="staff-kpi-grid">
    <div class="staff-kpi"><span class="staff-kpi-label">Tổng yêu cầu</span><strong>${total}</strong><small>Tất cả yêu cầu đã ghi nhận</small></div>
    <div class="staff-kpi"><span class="staff-kpi-label">Đang xử lý</span><strong>${open}</strong><small>Chưa kết thúc</small></div>
    <div class="staff-kpi"><span class="staff-kpi-label">Đã giải quyết</span><strong>${resolved}</strong><small>Đã hoàn tất</small></div>
    <div class="staff-kpi"><span class="staff-kpi-label">Đã hủy</span><strong>${cancelled}</strong><small>Không tiếp tục xử lý</small></div>
  </div>

  <section class="staff-section">
    <div class="section-head">
      <div>
        <h2>1. Tìm kiếm &amp; bộ lọc</h2>
        <p>Tìm kiếm và lọc theo loại, trạng thái hoặc người xử lý.</p>
      </div>
      <button class="btn ghost small" id="btnClearFilters" type="button">× Xóa bộ lọc</button>
    </div>

    <div class="request-filter-grid">
      <div class="filter-field filter-wide">
        <label for="fSearch">Tìm kiếm</label>
        <input type="text" id="fSearch" placeholder="Mã khách (VD: KH0001), tên khách, công ty, SĐT, mã yêu cầu..." value="${duLieuTrang.search}" />
      </div>
      <div class="filter-field">
        <label for="fType">Loại yêu cầu</label>
        <select id="fType">
          <option value="all" ${duLieuTrang.filterType==='all'?'selected':''}>Tất cả loại</option>
          ${LOAI_YEU_CAU.map(t => `<option value="${t}" ${duLieuTrang.filterType===t?'selected':''}>${nhanLoaiYeuCau(t)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="fStatus">Trạng thái</label>
        <select id="fStatus">
          <option value="all" ${duLieuTrang.filterStatus==='all'?'selected':''}>Tất cả trạng thái</option>
          ${CAC_TRANG_THAI.map(s => `<option value="${s}" ${duLieuTrang.filterStatus===s?'selected':''}>${layNhanTrangThai(s)}</option>`).join("")}
        </select>
      </div>
<div class="filter-field">
        <label for="fAssignee">Người xử lý</label>
        <select id="fAssignee">
          <option value="all" ${duLieuTrang.filterAssignee==='all'?'selected':''}>Tất cả</option>
          <option value="unassigned" ${duLieuTrang.filterAssignee==='unassigned'?'selected':''}>Chưa có người nhận</option>
          ${dsNhanVien.filter(s => ['sales','admin'].includes(s.vai_tro)).map(s => `<option value="${s.id}" ${duLieuTrang.filterAssignee===s.id?'selected':''}>${maHoaHtml(s.ho_ten)}</option>`).join("")}
        </select>
      </div>
    </div>
  </section>

  <section class="staff-section">
    <div class="section-head">
      <div>
        <h2>2. Danh sách yêu cầu</h2>
        <p id="requestCountHint">Đang hiển thị theo bộ lọc hiện tại.</p>
      </div>
    </div>
    <div id="resultsZone" class="staff-table-wrap request-table-wrap"></div>
  </section>
  `;
  document.getElementById("khuVucModal").innerHTML = "";
  ganDangXuat(nguCanh.supabase);
  ganSuKienThanhCongCu();
  hienThiKetQua();
}

function hienThiKetQua() {
  const list = yeuCauDaLoc();
  const emptyMsg = duLieuTrang.quotes.length === 0 ? "Chưa có yêu cầu nào từ khách hàng" : "Không tìm thấy yêu cầu phù hợp với bộ lọc";
  const countHint = document.getElementById("requestCountHint");
  if (countHint) countHint.textContent = `${list.length} yêu cầu đang hiển thị / ${duLieuTrang.quotes.length} yêu cầu.`;

  document.getElementById("resultsZone").innerHTML = `
    <table><thead><tr>
<th>Khách hàng</th><th>Yêu cầu</th><th>Liên quan</th><th>Trạng thái</th><th>Người xử lý</th><th>Ngày / xử lý</th>
    </tr></thead>
    <tbody>${list.map(q => {
      return `
      <tr>
        <td>${q.ma_khach_hang ? `<span style="font-family:monospace;font-size:12px;color:var(--steel)">${q.ma_khach_hang}</span><br>` : ''}<b>${maHoaHtml(q.ten_khach_hang) || '—'}</b>${maHoaHtml(q.ten_cong_ty) ? `<br><span class="role-badge">${maHoaHtml(q.ten_cong_ty)}</span>` : ''}<br><span style="font-size:11px;color:var(--steel)">${maHoaHtml(q.sdt_khach_hang) || '—'}</span></td>
        <td><b>${nhanLoaiYeuCau(q.loai_yeu_cau)}</b><br><span style="font-size:11px;color:var(--steel)" title="${maHoaHtml(q.ghi_chu || '')}">${maHoaHtml((q.ghi_chu || 'Không có ghi chú').slice(0,70))}${(q.ghi_chu||'').length>70?'…':''}</span></td>
        <td>${tomTatLienQuan(q)}</td>
        <td><span class="badge ${lopNhanTrangThai(q.trang_thai)}">${layNhanTrangThai(q.trang_thai)}</span></td>
        <td>${q.nguoi_xu_ly && banDoNhanVien[q.nguoi_xu_ly] ? `<span class="role-badge">👤 ${banDoNhanVien[q.nguoi_xu_ly]}</span>` : '<span style="color:var(--steel);font-size:12px">Chưa nhận</span>'}</td>
        <td><span style="display:block;font-size:11px;color:var(--steel);margin-bottom:4px">${dinhDangNgayVN(q.ngay_tao)}</span><button class="btn small blue" data-expand-quote="${q.id}">${duLieuTrang.expandedQuote===q.id?'Thu gọn':'Xử lý'}</button></td>
      </tr>
      ${duLieuTrang.expandedQuote === q.id ? `<tr class="expand-row"><td colspan="6">${hienThiChiTietBaoGia(q)}</td></tr>` : ''}
    `;
    }).join("") || `<tr><td colspan="6" class="empty">${emptyMsg}</td></tr>`}</tbody></table>
  `;
  ganSuKienKetQua();
}

hanhDong.hienThiTrang = hienThiTrang;
hanhDong.hienThiKetQua = hienThiKetQua;
