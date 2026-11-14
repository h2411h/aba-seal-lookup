/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia/bao-hanh.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   cacDongSanPhamBaoHanh(orderInfo, td = {})  [export]  — Dựng danh sách sản phẩm trong đơn để chọn cho yêu cầu bảo hành/đổi trả
   thuThapDuLieuBaoHanh(container)            [export]  — Gom các sản phẩm đã tick trong form bảo hành
   ========================================================================== */
// Dữ liệu bảo hành: các dòng sản phẩm của đơn đã mua và thông tin nhân viên liên quan.


// Danh sách sản phẩm trong đơn cho yêu cầu bảo hành/đổi trả.
export function cacDongSanPhamBaoHanh(orderInfo, td = {}) {
  const saved = Array.isArray(td.products) && td.products.length
    ? td.products
    : (td.product_id ? [{ product_id: td.product_id, quantity_issue: 1, issue_description: td.issue_description || '' }] : []);
  const savedMap = new Map(saved.map(x => [String(x.order_item_id || x.product_id), x]));
  const items = orderInfo?.chi_tiet_don_hang || [];
  if (!orderInfo) return '<div class="request-help">Chọn đơn đã giao trước để hệ thống hiển thị đúng sản phẩm trong đơn.</div>';
  if (!items.length) return '<div class="request-help">Đơn này không có sản phẩm.</div>';
  return `<div class="warranty-staff-list">${items.map(item => {
    const p = item.san_pham || {};
    const key = String(item.id || p.id);
    const old = savedMap.get(key) || saved.find(x => String(x.product_id) === String(p.id));
    const checked = !!old;
    const max = Number(item.so_luong || 0);
    return `<div class="warranty-staff-row" data-warranty-row="${key}" data-order-item="${item.id || ''}" data-product-id="${p.id || ''}">
      <label><input type="checkbox" data-warranty-check="${key}" ${checked ? 'checked' : ''}> <b>${p.ma_san_pham || 'Sản phẩm'}</b></label>
      <span class="warranty-staff-bought">Đã mua ${max}</span>
      <label class="warranty-staff-qty">SL lỗi <input type="number" min="1" max="${max}" value="${Number(old?.quantity_issue || 1)}" data-warranty-qty="${key}" ${checked ? '' : 'disabled'}></label>
      <input class="warranty-staff-issue" type="text" placeholder="Mô tả lỗi" value="${old?.issue_description || ''}" data-warranty-issue="${key}" ${checked ? '' : 'disabled'}>
    </div>`;
  }).join('')}</div>`;
}

export function thuThapDuLieuBaoHanh(container) {
  const products = [];
  container?.querySelectorAll('[data-warranty-check]:checked').forEach(cb => {
    const key = cb.getAttribute('data-warranty-check');
    const qtyEl = container.querySelector(`[data-warranty-qty="${key}"]`);
    const issueEl = container.querySelector(`[data-warranty-issue="${key}"]`);
    const row = container.querySelector(`[data-warranty-row="${key}"]`);
    const orderItem = row?.dataset?.orderItem;
    const productId = row?.dataset?.productId;
    products.push({
      order_item_id: orderItem || key,
      product_id: productId || null,
      quantity_issue: Number(qtyEl?.value || 0),
      issue_description: issueEl?.value.trim() || ''
    });
  });
  return products;
}
