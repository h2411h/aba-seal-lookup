/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/hop-thoai.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)            — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   hienThiHopXacNhan()           [export]  — Vẽ hộp xác nhận đơn
   hienThiHopHuy()               [export]  — Vẽ hộp hủy đơn
   dongHopDonViVanChuyen()       [export]  — Đóng hộp chọn đơn vị vận chuyển và xóa lựa chọn
   hienThiHopDonViVanChuyen()    [export]  — Vẽ hộp chọn đơn vị vận chuyển
   hienThiHopGiaoHangHangLoat()  [export]  — Vẽ hộp ghi nhận giao hàng cho nhiều dòng
   hienThiHopTraHang()           [export]  — Vẽ hộp ghi nhận trả hàng cho các dòng đã giao
   ========================================================================== */
// Các hộp thoại: xác nhận đơn, hủy đơn, chọn đơn vị vận chuyển, giao hàng hàng loạt, trả hàng.
import { duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { LY_DO_HUY, CAC_DON_VI_VAN_CHUYEN } from "./hang-so.js";
import { maHoaHtml, dinhDangTien } from "../../../js/dung-chung/dinh-dang.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

export function hienThiHopXacNhan() {
  const o = duLieuTrang.orders.find(x => x.id === duLieuTrang.confirmModalOrderId);
  if (!o) return "";
  return `<div class="modal-bg" id="confirmModalBg">
    <div class="modal" style="max-width:420px">
      <h2 style="font-size:17px;margin:0 0 14px">Xác nhận đơn hàng</h2>
      <p style="margin:4px 0"><b>Khách hàng:</b> ${maHoaHtml(o.khach_hang?.ho_ten) || maHoaHtml(o.ten_nguoi_nhan) || '—'}</p>
      <p style="margin:4px 0"><b>SĐT:</b> ${maHoaHtml(o.khach_hang?.so_dien_thoai) || maHoaHtml(o.sdt_nguoi_nhan) || '—'}</p>
      <p style="margin:4px 0 18px"><b>Tổng tiền:</b> ${dinhDangTien(Number(o.tong_tien))}</p>
      <p style="font-size:13px;color:var(--steel);margin:0 0 16px">Bạn có chắc chắn muốn xác nhận đơn hàng này?</p>
      <div class="row" style="justify-content:flex-end;gap:8px">
        <button class="btn ghost" id="confirmModalCancel">Hủy</button>
        <button class="btn" id="confirmModalOk">Xác nhận đơn</button>
      </div>
    </div>
  </div>`;
}

export function hienThiHopHuy() {
  const o = duLieuTrang.orders.find(x => x.id === duLieuTrang.cancelModalOrderId);
  if (!o) return "";
  return `<div class="modal-bg" id="cancelModalBg">
    <div class="modal" style="max-width:440px">
      <h2 style="font-size:17px;margin:0 0 6px">Hủy đơn hàng</h2>
      <p style="font-size:12.5px;color:var(--steel);margin:0 0 16px">${maHoaHtml(o.khach_hang?.ho_ten) || maHoaHtml(o.ten_nguoi_nhan) || '—'} · ${dinhDangTien(Number(o.tong_tien))}</p>
      <p style="font-weight:700;font-size:13px;margin:0 0 8px">Lý do hủy *</p>
      ${LY_DO_HUY.map((r, i) => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13.5px;cursor:pointer">
          <input type="radio" name="cancelReason" value="${r}" ${duLieuTrang.cancelReasonChoice===r?'checked':''} data-cancel-reason-radio/>
          ${r}
        </label>`).join("")}
      <div class="field" style="margin-top:10px"><label class="field-label">Ghi chú (tùy chọn)</label><textarea id="cancelReasonNote" rows="2">${duLieuTrang.cancelReasonNote}</textarea></div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px">
        <button class="btn ghost" id="cancelModalBack">Quay lại</button>
        <button class="btn" id="cancelModalOk" style="background:var(--danger)">Xác nhận hủy</button>
      </div>
    </div>
  </div>`;
}

export function dongHopDonViVanChuyen() {
  duLieuTrang.carrierModalOrderId = null;
  duLieuTrang.carrierModalMode = null;
  duLieuTrang.carrierChoice = "";
  duLieuTrang.carrierCustom = "";
  duLieuTrang.carrierTrackingNote = "";
  hienThiTrang();
}

export function hienThiHopDonViVanChuyen() {
  const o = duLieuTrang.orders.find(x => x.id === duLieuTrang.carrierModalOrderId);
  if (!o) return "";
  const isShip = duLieuTrang.carrierModalMode === 'ship';
  const isOther = duLieuTrang.carrierChoice === "Khác...";
  return `<div class="modal-bg" id="carrierModalBg">
    <div class="modal" style="max-width:440px">
      <h2 style="font-size:17px;margin:0 0 6px">${isShip ? '🚚 Bắt đầu giao hàng' : 'Sửa đơn vị giao hàng'}</h2>
      <p style="font-size:12.5px;color:var(--steel);margin:0 0 16px">${maHoaHtml(o.khach_hang?.ho_ten) || maHoaHtml(o.ten_nguoi_nhan) || '—'} · ${dinhDangTien(Number(o.tong_tien))}</p>
      <p style="font-weight:700;font-size:13px;margin:0 0 8px">Đơn vị giao hàng phụ trách *</p>
      ${CAC_DON_VI_VAN_CHUYEN.map(c => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13.5px;cursor:pointer">
          <input type="radio" name="carrierChoice" value="${c}" ${duLieuTrang.carrierChoice===c?'checked':''} data-carrier-radio/>
          ${c}
        </label>`).join("")}
      <div class="field" id="carrierCustomWrap" style="margin-top:6px;display:${isOther?'block':'none'}">
        <input type="text" id="carrierCustom" placeholder="Nhập tên đơn vị giao hàng..." value="${duLieuTrang.carrierCustom}" />
      </div>
      <div class="field" style="margin-top:10px">
        <label class="field-label">Mã vận đơn / ghi chú giao hàng (không bắt buộc)</label>
        <input type="text" id="carrierTrackingNote" value="${duLieuTrang.carrierTrackingNote}" placeholder="VD: VTP123456789" />
      </div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px">
        <button class="btn ghost" id="carrierModalBack">Hủy</button>
        <button class="btn" id="carrierModalOk">${isShip ? 'Bắt đầu giao' : 'Lưu'}</button>
      </div>
    </div>
  </div>`;
}

export function hienThiHopGiaoHangHangLoat() {
  const o = duLieuTrang.orders.find(x => x.id === duLieuTrang.batchDeliveryOrderId);
  if (!o) return "";
  const pendingItems = (o.chi_tiet_don_hang || []).filter(it => it.trang_thai_giao_hang === 'pending');
  if (!pendingItems.length) return "";
  return `<div class="modal-bg" id="batchDeliveryModalBg">
    <div class="modal" style="max-width:760px;width:calc(100vw - 32px)">
      <h2 style="font-size:18px;margin:0 0 6px">🚚 Ghi nhận kết quả giao hàng</h2>
      <p style="font-size:12.5px;color:var(--steel);margin:0 0 14px">
        Nhập <b>số lượng khách thực nhận</b> cho từng sản phẩm. Mặc định là giao đủ.
        Nếu khách hủy/trả một vài sản phẩm, chỉ cần sửa đúng dòng đó — không phải bấm 14 lần.
      </p>
      <div style="overflow:auto;border:1px solid var(--line-soft);border-radius:7px">
        <table style="margin:0;min-width:650px">
          <thead><tr>
            <th>Mã sản phẩm</th><th>SL đặt</th><th>Khách nhận</th><th>Trả/từ chối</th><th>Lý do</th>
          </tr></thead>
          <tbody>
            ${pendingItems.map(it => `
              <tr>
                <td><b>${it.san_pham?.ma_san_pham || '—'}</b><div style="font-size:11px;color:var(--steel)">${it.san_pham?.hang_san_xuat || ''}</div></td>
                <td>${Number(it.so_luong || 0)}</td>
                <td>
                  <input type="number" min="0" max="${Number(it.so_luong || 0)}" step="1"
                    value="${Number(it.so_luong || 0)}" data-batch-qty="${it.id}"
                    style="width:90px;padding:7px 8px;border:1px solid var(--line-soft);border-radius:5px">
                </td>
                <td><span data-batch-return="${it.id}" style="font-weight:700;color:var(--steel)">0</span></td>
                <td>
                  <input type="text" data-batch-reason="${it.id}" placeholder="Chỉ cần nhập nếu nhận thiếu/từ chối"
                    style="width:210px;padding:7px 8px;border:1px solid var(--line-soft);border-radius:5px">
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="background:#f7f9fb;border-radius:6px;padding:9px 11px;margin-top:10px;font-size:12px;color:var(--steel)">
        💡 Ví dụ: đặt 14, khách nhận 13 → nhập <b>13</b> ở dòng đó. Đơn chuyển thành <b>Giao một phần</b>; 1 sản phẩm còn lại ghi là <b>chờ về kho</b> — kho chỉ tăng khi hàng về tới cửa hàng và bạn bấm xác nhận.
      </div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px">
        <button class="btn ghost" id="batchDeliveryCancel">Hủy</button>
        <button class="btn" id="batchDeliverySave">✓ Xác nhận kết quả giao</button>
      </div>
    </div>
  </div>`;
}

export function hienThiHopTraHang() {
  const o = duLieuTrang.orders.find(x => x.id === duLieuTrang.returnModalOrderId);
  if (!o) return "";
  const deliveredItems = (o.chi_tiet_don_hang || []).filter(it =>
    it.trang_thai_giao_hang === "delivered" && Number(it.so_luong_da_giao || it.so_luong) > 0
  );
  if (!deliveredItems.length) return "";
  return `<div class="modal-bg" id="returnModalBg"><div class="modal" style="max-width:760px;width:calc(100vw - 32px)">
    <h2 style="font-size:18px;margin:0 0 6px">⚠️ Tạo yêu cầu trả hàng do lỗi</h2>
    <p style="font-size:12.5px;color:var(--steel);margin:0 0 14px">Chỉ tiếp nhận khi có <b>lỗi sản phẩm, giao sai sản phẩm hoặc hư hỏng do vận chuyển</b>. Không áp dụng cho hàng khách đã bóc ra sử dụng hoặc chỉ đổi ý.</p>
    <div style="overflow:auto;border:1px solid var(--line-soft);border-radius:7px"><table style="margin:0;min-width:680px"><thead><tr><th>Mã sản phẩm</th><th>Đã giao</th><th>Số lượng trả</th><th>Lý do</th></tr></thead><tbody>
    ${deliveredItems.map(it => `<tr><td><b>${it.san_pham?.ma_san_pham || '—'}</b><div style="font-size:11px;color:var(--steel)">${it.san_pham?.hang_san_xuat || ''}</div></td><td>${Number(it.so_luong_da_giao || it.so_luong)}</td><td><input type="number" min="0" max="${Number(it.so_luong_da_giao || it.so_luong)}" value="0" step="1" data-return-qty="${it.id}" style="width:90px;padding:7px 8px;border:1px solid var(--line-soft);border-radius:5px"></td><td><select data-return-reason="${it.id}" style="width:260px;padding:7px 8px;border:1px solid var(--line-soft);border-radius:5px"><option value="">— Chọn lý do —</option><option value="Lỗi sản phẩm">Lỗi sản phẩm</option><option value="Giao sai sản phẩm">Giao sai sản phẩm</option><option value="Hư hỏng do vận chuyển">Hư hỏng do vận chuyển</option></select></td></tr>`).join('')}
    </tbody></table></div>
    <div style="background:#f7f9fb;border-radius:6px;padding:9px 11px;margin-top:10px;font-size:12px;color:var(--steel)">💡 Đây mới là bước tạo yêu cầu. Hệ thống <b>chưa cộng lại kho</b>; chỉ khi xác nhận đã nhận hàng thực tế mới phát sinh giao dịch “Khách trả hàng”.</div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn ghost" id="returnModalCancel">Hủy</button><button class="btn" id="returnModalSave">✓ Tạo yêu cầu trả hàng</button></div>
  </div></div>`;
}
