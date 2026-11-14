/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/giao-hang.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)                       — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   luuKetQuaGiaoHang()                      [export async]  — ★ Ghi kết quả giao từng dòng (đủ/thiếu/từ chối), tạo hang_cho_ve_kho, tính lại tiền, chọn trạng thái đơn
   hoanTatGiaoHang(orderId)                 [export async]  — Hoàn tất giao hàng cho các dòng còn chờ giao
   ghiNhanTraHangSauGiao(orderId)           [export async]  — Ghi nhận trả hàng sau khi đã giao
   nhanYeuCauTraHang(requestId, orderId)    [export async]  — Nhận yêu cầu trả hàng (gọi hàm DB receive_return_request)
   tuChoiYeuCauTraHang(requestId, orderId)  [export async]  — Từ chối yêu cầu trả hàng của khách
   nhanHangVeKho(waitId, orderId)           [export async]  — ★ Xác nhận hàng khách không nhận đã về cửa hàng (hàm DB nhan_hang_ve_kho mới cộng kho)
   ========================================================================== */
// Xử lý giao hàng: giao hàng loạt, hoàn tất đơn, ghi nhận và xử lý trả hàng sau giao.
import { maDon as maDonChung } from "../../../js/dung-chung/ma-don.js";
import { hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { nguCanh, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { taiLichSuDon, taiDonHang } from "./tai-du-lieu.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

export async function luuKetQuaGiaoHang() {
  const orderId = duLieuTrang.batchDeliveryOrderId;
  const order = duLieuTrang.orders.find(o => o.id === orderId);
  if (!order) return;
  const pendingItems = (order.chi_tiet_don_hang || []).filter(it => it.trang_thai_giao_hang === 'pending');
  if (!pendingItems.length) { hienThongBaoNhanh("Đơn hàng không còn sản phẩm chờ giao."); duLieuTrang.batchDeliveryOrderId = null; hienThiTrang(); return; }

  const rows = pendingItems.map(it => {
    const qtyEl = document.querySelector(`[data-batch-qty="${it.id}"]`);
    const reasonEl = document.querySelector(`[data-batch-reason="${it.id}"]`);
    const ordered = Number(it.so_luong || 0);
    const received = Math.round(Number(qtyEl?.value));
    return { it, ordered, received, reason: (reasonEl?.value || '').trim() };
  });

  for (const row of rows) {
    if (!Number.isInteger(row.received) || row.received < 0 || row.received > row.ordered) {
      hienThongBaoNhanh(`Số lượng không hợp lệ ở ${row.it.san_pham?.ma_san_pham || 'sản phẩm'}.`);
      return;
    }
    if (row.received < row.ordered && !row.reason) row.reason = row.received === 0 ? 'Khách từ chối nhận' : 'Khách nhận thiếu';
  }

  const saveButton = document.getElementById('batchDeliverySave');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = '⏳ Đang lưu kết quả...';
  }
  // Đóng modal ngay khi bắt đầu lưu để người dùng thấy thao tác đã được nhận.
  duLieuTrang.batchDeliveryOrderId = null;
  hienThiTrang();

  // Cập nhật từng dòng sản phẩm trong một lần thao tác của nhân viên.
  for (const row of rows) {
    const deliveryStatus = row.received === row.ordered ? 'delivered' : row.received === 0 ? 'refused' : 'partially_delivered';
    const { error } = await nguCanh.supabase.from('chi_tiet_don_hang').update({
      trang_thai_giao_hang: deliveryStatus,
      so_luong_da_giao: row.received,
      ly_do_tu_choi: row.received < row.ordered ? row.reason : null,
      ngay_tu_choi: row.received < row.ordered ? new Date().toISOString() : null
    }).eq('id', row.it.id);
    if (error) { hienThongBaoNhanh('Lỗi cập nhật ' + (row.it.san_pham?.ma_san_pham || 'sản phẩm') + ': ' + error.message); hienThongBaoNhanh('Bạn có thể mở lại đơn để thử lại.'); return; }

    const returnedQty = row.ordered - row.received;
    if (returnedQty > 0) {
      // CHƯA cộng kho: hàng còn trên tay shipper. Chỉ ghi phiếu "chờ về kho"; kho chỉ tăng khi nhân viên
      // bấm "Đã nhận hàng về kho" (hàm nhanHangVeKho bên dưới).
      const { error: waitErr } = await nguCanh.supabase.from('hang_cho_ve_kho').insert({
        don_hang_id: orderId, chi_tiet_don_hang_id: row.it.id, san_pham_id: row.it.san_pham?.id,
        so_luong: returnedQty, ly_do: row.reason || null
      });
      if (waitErr) { hienThongBaoNhanh('⚠️ Đã cập nhật giao hàng nhưng lỗi ghi phiếu hàng chờ về kho ' + (row.it.san_pham?.ma_san_pham || '') + ': ' + waitErr.message); }
    }
  }

  const allItems = order.chi_tiet_don_hang || [];
  const finalRows = allItems.map(it => {
    const changedRow = rows.find(r => r.it.id === it.id);
    return changedRow ? { ...it, trang_thai_giao_hang: changedRow.received === changedRow.ordered ? 'delivered' : changedRow.received === 0 ? 'refused' : 'partially_delivered', so_luong_da_giao: changedRow.received } : it;
  });
  const newSubtotal = finalRows.reduce((sum, it) => {
    const qty = Number(it.so_luong_da_giao ?? (it.trang_thai_giao_hang === 'pending' ? 0 : it.so_luong) ?? 0);
    return sum + Number(it.don_gia || 0) * qty;
  }, 0);
  const oldDiscountTotal = Number(order.tien_giam_gia || 0) + Number(order.tien_chiet_khau_so_luong || 0);
  const newDiscountTotal = Math.min(oldDiscountTotal, newSubtotal);
  const newDiscount = Math.min(Number(order.tien_giam_gia || 0), newDiscountTotal);
  const newQtyDiscount = newDiscountTotal - newDiscount;
  const taxRate = Number(order.thue_suat || 10);
  const newTax = Math.round((newSubtotal - newDiscountTotal) * taxRate / 100);
  const newTotal = newSubtotal - newDiscountTotal + newTax + Number(order.phi_van_chuyen || 0);
  const hasIssue = finalRows.some(it => it.trang_thai_giao_hang === 'refused' || it.trang_thai_giao_hang === 'partially_delivered');
  const allRefused = finalRows.length > 0 && finalRows.every(it => it.trang_thai_giao_hang === 'refused');
  const newOrderStatus = allRefused ? 'delivery_failed' : hasIssue ? 'partially_delivered' : 'completed';

  const { error: orderErr } = await nguCanh.supabase.from('don_hang').update({
    tien_hang: newSubtotal,
    tien_giam_gia: newDiscount,
    tien_chiet_khau_so_luong: newQtyDiscount,
    tien_thue: newTax,
    tong_tien: newTotal,
    trang_thai: newOrderStatus
  }).eq('id', orderId);
  if (orderErr) { hienThongBaoNhanh('Lỗi cập nhật đơn hàng: ' + orderErr.message); hienThongBaoNhanh('Bạn có thể mở lại đơn để thử lại.'); return; }

  duLieuTrang.batchDeliveryOrderId = null;
  hienThongBaoNhanh(newOrderStatus === 'completed' ? '✓ Đã giao đủ và hoàn tất đơn hàng' : '✓ Đã ghi nhận giao hàng. Phần khách không nhận đang CHỜ VỀ KHO — khi hàng về tới cửa hàng, mở đơn bấm "Đã nhận hàng về kho".');
  await taiDonHang();
}

export async function hoanTatGiaoHang(orderId) {
  const order = duLieuTrang.orders.find(o => o.id === orderId);
  if (!order) return;
  const pendingItems = (order.chi_tiet_don_hang || []).filter(it => it.trang_thai_giao_hang === "pending");
  if (!pendingItems.length) {
    hienThongBaoNhanh("Đơn hàng không còn sản phẩm chờ giao.");
    return;
  }
  if (!confirm("Xác nhận khách nhận đủ các sản phẩm còn lại và hoàn tất đơn hàng?")) return;
  for (const it of pendingItems) {
    const { error } = await nguCanh.supabase.from("chi_tiet_don_hang").update({
      trang_thai_giao_hang: "delivered",
      so_luong_da_giao: it.so_luong,
      ly_do_tu_choi: null,
      ngay_tu_choi: null
    }).eq("id", it.id);
    if (error) { hienThongBaoNhanh("Lỗi cập nhật sản phẩm: " + error.message); return; }
  }
  const { error: orderErr } = await nguCanh.supabase.from("don_hang").update({ trang_thai: "completed" }).eq("id", orderId);
  if (orderErr) { hienThongBaoNhanh("Lỗi hoàn tất đơn: " + orderErr.message); return; }
  hienThongBaoNhanh("✓ Đã xác nhận giao đủ và hoàn tất đơn hàng");
  await taiDonHang();
  if (duLieuTrang.expanded === orderId) await taiLichSuDon(orderId);
}

export async function ghiNhanTraHangSauGiao(orderId) {
  const order = duLieuTrang.orders.find(o => o.id === orderId);
  if (!order) return;
  const returns = [];
  document.querySelectorAll("[data-return-qty]").forEach(input => {
    const qty = Math.round(Number(input.value || 0));
    if (qty <= 0) return;
    const item = (order.chi_tiet_don_hang || []).find(it => it.id === input.getAttribute("data-return-qty"));
    const reason = document.querySelector(`[data-return-reason="${input.getAttribute("data-return-qty")}"]`)?.value || "";
    if (item) returns.push({ item, qty, reason });
  });
  if (!returns.length) { hienThongBaoNhanh("Hãy nhập số lượng trả cho ít nhất một sản phẩm."); return; }
  for (const r of returns) {
    const max = Number(r.item.so_luong_da_giao || r.item.so_luong);
    if (!Number.isInteger(r.qty) || r.qty < 1 || r.qty > max) { hienThongBaoNhanh(`Số lượng trả của ${r.item.san_pham?.ma_san_pham || 'sản phẩm'} không hợp lệ.`); return; }
    if (!r.reason) { hienThongBaoNhanh(`Hãy chọn lý do trả hàng cho ${r.item.san_pham?.ma_san_pham || 'sản phẩm'}.`); return; }
  }
  const existing = order.yeu_cau_tra_hang || [];
  const pendingByItem = new Map();
  existing.filter(x => x.trang_thai === 'pending' || x.trang_thai === 'approved').forEach(x => {
    pendingByItem.set(x.chi_tiet_don_hang_id, (pendingByItem.get(x.chi_tiet_don_hang_id) || 0) + Number(x.so_luong || 0));
  });
  for (const r of returns) {
    const delivered = Number(r.item.so_luong_da_giao || r.item.so_luong);
    if ((pendingByItem.get(r.item.id) || 0) + r.qty > delivered) {
      hienThongBaoNhanh(`Sản phẩm ${r.item.san_pham?.ma_san_pham || ''} đã có yêu cầu trả đang xử lý vượt quá số lượng có thể trả.`);
      return;
    }
  }
  const payload = returns.map(r => ({
    don_hang_id: orderId,
    chi_tiet_don_hang_id: r.item.id,
    khach_hang_id: order.khach_hang_id,
    san_pham_id: r.item.san_pham?.id,
    so_luong: r.qty,
    ly_do: r.reason,
    trang_thai: 'pending',
    ghi_chu: `Yêu cầu trả sau giao — đơn #${maDonChung(orderId)} — SP ${r.item.san_pham?.ma_san_pham || ''}`
  }));
  const { error } = await nguCanh.supabase.from('yeu_cau_tra_hang').insert(payload).select('id');
  if (error) { hienThongBaoNhanh('Không tạo được yêu cầu trả hàng: ' + error.message); return; }
  duLieuTrang.returnModalOrderId = null;
  hienThongBaoNhanh(`✓ Đã tạo ${returns.length} yêu cầu trả hàng. Chưa cộng lại kho cho đến khi xác nhận đã nhận hàng.`);
  await taiDonHang();
}

export async function nhanYeuCauTraHang(requestId, orderId) {
  const order = duLieuTrang.orders.find(o => o.id === orderId);
  const request = order?.yeu_cau_tra_hang?.find(r => r.id === requestId);
  if (!order || !request) return;
  if (!['pending', 'approved'].includes(request.trang_thai)) {
    hienThongBaoNhanh('Yêu cầu này không còn ở trạng thái có thể tiếp nhận.');
    return;
  }
  if (!confirm(`Xác nhận đã nhận ${request.so_luong} sản phẩm ${request.san_pham?.ma_san_pham || ''} về kho?`)) return;

  const { error } = await nguCanh.supabase.rpc('receive_return_request', { p_request_id: requestId });
  if (error) {
    hienThongBaoNhanh('Không thể tiếp nhận hàng trả: ' + error.message);
    return;
  }

  hienThongBaoNhanh('✓ Đã xác nhận nhận hàng trả, cập nhật kho và điều chỉnh đơn hàng.');
  await taiDonHang();
}

export async function tuChoiYeuCauTraHang(requestId, orderId) {
  const order = duLieuTrang.orders.find(o => o.id === orderId);
  const request = order?.yeu_cau_tra_hang?.find(r => r.id === requestId);
  if (!request || request.trang_thai !== 'pending') return;
  const reason = prompt('Lý do từ chối yêu cầu trả hàng:', 'Không đủ điều kiện trả hàng');
  if (reason === null) return;
  const note = reason.trim();
  if (!note) { hienThongBaoNhanh('Cần nhập lý do từ chối.'); return; }
  const { error } = await nguCanh.supabase.from('yeu_cau_tra_hang').update({
    trang_thai: 'rejected', nguoi_xu_ly: nguCanh.staff.id, ngay_xu_ly: new Date().toISOString(), ghi_chu: note
  }).eq('id', requestId);
  if (error) { hienThongBaoNhanh('Không thể từ chối yêu cầu: ' + error.message); return; }
  hienThongBaoNhanh('Đã từ chối yêu cầu trả hàng.');
  await taiDonHang();
}

// Xác nhận hàng khách không nhận ĐÃ về tới cửa hàng -> mới cộng kho (hàm DB nhan_hang_ve_kho ghi giao dịch customer_return).
export async function nhanHangVeKho(waitId, orderId) {
  const order = duLieuTrang.orders.find(o => o.id === orderId);
  const w = order?.hang_cho_ve_kho?.find(x => x.id === waitId);
  if (!w || w.trang_thai !== 'pending') return;
  if (!confirm(`Xác nhận đã nhận ${w.so_luong} sản phẩm ${w.san_pham?.ma_san_pham || ''} về cửa hàng và cộng vào kho?`)) return;
  const { error } = await nguCanh.supabase.rpc('nhan_hang_ve_kho', { p_id: waitId });
  if (error) { hienThongBaoNhanh('Không thể nhận hàng về kho: ' + error.message); return; }
  hienThongBaoNhanh('✓ Đã nhận hàng về kho và cộng tồn kho.');
  await taiDonHang();
}
