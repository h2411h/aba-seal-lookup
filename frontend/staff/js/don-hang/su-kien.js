/* ==========================================================================
   MỤC LỤC HÀM — staff/js/don-hang/su-kien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)      — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   hienThiKetQua(...a)     — Hàm ủy quyền sang hanhDong.hienThiKetQua
   ganSuKienHopThoai()     [export]  — Gắn sự kiện cho các hộp thoại của đơn hàng
   ganSuKienThanhCongCu()  [export]  — Gắn sự kiện cho thanh công cụ (tìm kiếm, lọc, ngày)
   ganSuKienKetQua()       [export]  — Gắn sự kiện cho vùng kết quả (mở rộng đơn, nút trạng thái, Excel từng nhóm)
   ========================================================================== */
// Gắn sự kiện cho thanh công cụ, danh sách kết quả và các hộp thoại.
import { hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { nguCanh, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { CAC_DON_VI_VAN_CHUYEN, TRANG_THAI_TINH_DOANH_THU } from "./hang-so.js";
import { donHangDaLoc, taiLichSuDon, taiDonHang } from "./tai-du-lieu.js";
import { hoanTatGiaoHang, nhanHangVeKho, nhanYeuCauTraHang, ghiNhanTraHangSauGiao, tuChoiYeuCauTraHang, luuKetQuaGiaoHang } from "./giao-hang.js";
import { dongHopDonViVanChuyen } from "./hop-thoai.js";
import { xuatDonHangRaExcel, inHoaDon } from "./in-xuat.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng
const hienThiKetQua = (...a) => hanhDong.hienThiKetQua(...a); // hienThiKetQua nằm ở module khác; gọi qua actions để tránh import vòng

export function ganSuKienHopThoai() {
  const confirmBg = document.getElementById("confirmModalBg");
  if (confirmBg) confirmBg.onclick = (e) => { if (e.target.id === "confirmModalBg") { duLieuTrang.confirmModalOrderId = null; hienThiTrang(); } };
  const confirmCancel = document.getElementById("confirmModalCancel");
  if (confirmCancel) confirmCancel.onclick = () => { duLieuTrang.confirmModalOrderId = null; hienThiTrang(); };
  const confirmOk = document.getElementById("confirmModalOk");
  if (confirmOk) confirmOk.onclick = async () => {
    const id = duLieuTrang.confirmModalOrderId;
    const { error } = await nguCanh.supabase.from("don_hang").update({ trang_thai: "confirmed" }).eq("id", id);
    if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
    hienThongBaoNhanh("✓ Đã xác nhận đơn hàng");
    duLieuTrang.confirmModalOrderId = null;
    hienThiTrang(); // Cập nhật DOM để đóng modal xác nhận ngay sau khi lưu thành công.
    taiDonHang();
  };

  const cancelBg = document.getElementById("cancelModalBg");
  if (cancelBg) cancelBg.onclick = (e) => { if (e.target.id === "cancelModalBg") { duLieuTrang.cancelModalOrderId = null; hienThiTrang(); } };
  const cancelBack = document.getElementById("cancelModalBack");
  if (cancelBack) cancelBack.onclick = () => { duLieuTrang.cancelModalOrderId = null; duLieuTrang.cancelReasonChoice = ""; duLieuTrang.cancelReasonNote = ""; hienThiTrang(); };
  document.querySelectorAll("[data-cancel-reason-radio]").forEach(el => {
    el.onchange = () => { duLieuTrang.cancelReasonChoice = el.value; };
  });
  const cancelNoteEl = document.getElementById("cancelReasonNote");
  if (cancelNoteEl) cancelNoteEl.oninput = (e) => { duLieuTrang.cancelReasonNote = e.target.value; };
  const cancelOk = document.getElementById("cancelModalOk");
  if (cancelOk) cancelOk.onclick = async () => {
    if (!duLieuTrang.cancelReasonChoice) { hienThongBaoNhanh("Vui lòng chọn lý do hủy"); return; }
    const id = duLieuTrang.cancelModalOrderId;
    const fullReason = duLieuTrang.cancelReasonNote.trim() ? `${duLieuTrang.cancelReasonChoice} — ${duLieuTrang.cancelReasonNote.trim()}` : duLieuTrang.cancelReasonChoice;
    const { error } = await nguCanh.supabase.from("don_hang").update({
      trang_thai: "cancelled", ly_do_huy: fullReason, nguoi_huy: "staff", ngay_huy: new Date().toISOString()
    }).eq("id", id);
    if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
    hienThongBaoNhanh("🚫 Đã hủy đơn hàng");
    duLieuTrang.cancelModalOrderId = null;
    duLieuTrang.cancelReasonChoice = ""; duLieuTrang.cancelReasonNote = "";
    hienThiTrang(); // Cập nhật DOM để đóng modal hủy đơn ngay sau khi lưu thành công.
    taiDonHang();
  };

  const carrierBg = document.getElementById("carrierModalBg");
  if (carrierBg) carrierBg.onclick = (e) => { if (e.target.id === "carrierModalBg") dongHopDonViVanChuyen(); };
  const carrierBack = document.getElementById("carrierModalBack");
  if (carrierBack) carrierBack.onclick = () => dongHopDonViVanChuyen();
  document.querySelectorAll("[data-carrier-radio]").forEach(el => {
    el.onchange = () => {
      duLieuTrang.carrierChoice = el.value;
      const wrap = document.getElementById("carrierCustomWrap");
      if (wrap) wrap.style.display = el.value === "Khác..." ? "block" : "none";
      const customInput = document.getElementById("carrierCustom");
      if (customInput && el.value === "Khác...") customInput.focus();
    };
  });
  const carrierCustomEl = document.getElementById("carrierCustom");
  if (carrierCustomEl) carrierCustomEl.oninput = (e) => { duLieuTrang.carrierCustom = e.target.value; };
  const carrierNoteEl = document.getElementById("carrierTrackingNote");
  if (carrierNoteEl) carrierNoteEl.oninput = (e) => { duLieuTrang.carrierTrackingNote = e.target.value; };
  const carrierOk = document.getElementById("carrierModalOk");
  if (carrierOk) carrierOk.onclick = async () => {
    if (!duLieuTrang.carrierChoice) { hienThongBaoNhanh("Vui lòng chọn đơn vị giao hàng"); return; }
    const finalCarrier = duLieuTrang.carrierChoice === "Khác..."
      ? (document.getElementById("carrierCustom")?.value || "").trim()
      : duLieuTrang.carrierChoice;
    if (!finalCarrier) { hienThongBaoNhanh("Vui lòng nhập tên đơn vị giao hàng"); return; }
    const trackingNote = (document.getElementById("carrierTrackingNote")?.value || "").trim();
    const id = duLieuTrang.carrierModalOrderId;
    const isShip = duLieuTrang.carrierModalMode === 'ship';
    const payload = { don_vi_van_chuyen: finalCarrier, ghi_chu_van_chuyen: trackingNote || null };
    if (isShip) payload.trang_thai = "shipped";
    const { error } = await nguCanh.supabase.from("don_hang").update(payload).eq("id", id);
    if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
    if (isShip) {
      hienThongBaoNhanh("🚚 Đơn hàng đã chuyển sang Đang giao");
    } else {
      hienThongBaoNhanh("Đã cập nhật đơn vị giao hàng");
    }
    dongHopDonViVanChuyen();
    taiDonHang();
  };
}

export function ganSuKienThanhCongCu() {
  document.getElementById("fSearch").oninput = (e) => { duLieuTrang.search = e.target.value; hienThiKetQua(); };
  const fDateFrom = document.getElementById("fDateFrom");
  const fDateTo = document.getElementById("fDateTo");
  // Ô ngày là <input type="date"> mặc định: .value luôn là "yyyy-mm-dd" (hoặc "" khi chưa chọn).
  fDateFrom.oninput = (e) => {
    duLieuTrang.dateFrom = e.target.value;
    hienThiKetQua();
  };
  fDateTo.oninput = (e) => {
    duLieuTrang.dateTo = e.target.value;
    hienThiKetQua();
  };
  document.getElementById("fGroup").onchange = (e) => { duLieuTrang.groupBy = e.target.value; hienThiKetQua(); };

  // Chip trạng thái — bấm để bật/tắt từng trạng thái (chọn nhiều để gộp, VD: Hoàn tất + Giao một
  // phần để xem tổng tiền thực thu). Gọi hienThiTrang() đầy đủ để cập nhật lại chip nào đang "active".
  document.querySelectorAll("#fStatusGroup [data-status]").forEach(btn => {
    btn.onclick = () => {
      const s = btn.getAttribute("data-status");
      if (duLieuTrang.filterStatuses.has(s)) duLieuTrang.filterStatuses.delete(s); else duLieuTrang.filterStatuses.add(s);
      hienThiTrang();
    };
  });
  const allBtn = document.getElementById("btnStatusAll");
  if (allBtn) allBtn.onclick = () => { duLieuTrang.filterStatuses = new Set(); duLieuTrang.choXuLy = false; hienThiTrang(); };
  const btnChoXuLy = document.getElementById("btnChoXuLy");
  if (btnChoXuLy) btnChoXuLy.onclick = () => { duLieuTrang.choXuLy = !duLieuTrang.choXuLy; hienThiTrang(); };
  const presetBtn = document.getElementById("btnPresetRevenue");
  if (presetBtn) presetBtn.onclick = () => { duLieuTrang.filterStatuses = new Set(TRANG_THAI_TINH_DOANH_THU); hienThiTrang(); };

  document.getElementById("btnClearFilters").onclick = () => {
    duLieuTrang.search = ""; duLieuTrang.dateFrom = ""; duLieuTrang.dateTo = ""; duLieuTrang.filterStatuses = new Set(); duLieuTrang.choXuLy = false; duLieuTrang.groupBy = "none";
    hienThiTrang();
  };

  // Xuất đúng những đơn đang hiển thị (đang lọc trạng thái/ngày/tìm kiếm thế nào thì file ra thế đó).
  document.getElementById("btnExport").onclick = () => xuatDonHangRaExcel(donHangDaLoc());
}

export function ganSuKienKetQua() {
  // Nút "⬇ Excel" nhỏ ở đầu mỗi nhóm ngày/tuần/tháng — xuất riêng đúng các đơn trong nhóm đó,
  // không cần đổi bộ lọc "Từ ngày/Đến ngày" ở trên rồi xuất lại.
  document.querySelectorAll("[data-export-group]").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const g = duLieuTrang.groupsCache?.get(btn.getAttribute("data-export-group"));
      if (g) xuatDonHangRaExcel(g.orders, g.label);
    };
  });

  document.querySelectorAll("[data-expand]").forEach(el => {
    el.onclick = () => {
      const id = el.getAttribute("data-expand");
      if (duLieuTrang.expanded === id) { duLieuTrang.expanded = null; hienThiKetQua(); return; }
      duLieuTrang.expanded = id;
      duLieuTrang.orderHistory = [];
      hienThiKetQua();
      taiLichSuDon(id);
    };
  });

  document.querySelectorAll("[data-print-invoice]").forEach(el => {
    el.onclick = () => {
      const order = duLieuTrang.orders.find(o => o.id === el.getAttribute("data-print-invoice"));
      if (order) inHoaDon(order);
    };
  });

  document.querySelectorAll("[data-confirm-order]").forEach(el => {
    el.onclick = () => { duLieuTrang.confirmModalOrderId = el.getAttribute("data-confirm-order"); hienThiTrang(); };
  });
  document.querySelectorAll("[data-cancel-order]").forEach(el => {
    el.onclick = () => { duLieuTrang.cancelModalOrderId = el.getAttribute("data-cancel-order"); duLieuTrang.cancelReasonChoice = ""; duLieuTrang.cancelReasonNote = ""; hienThiTrang(); };
  });
  // Ghi rõ đơn vị chịu trách nhiệm giao hàng ngay lúc bắt đầu giao — để quy trách nhiệm khi có
  // sự cố giao hàng (đúng yêu cầu bổ sung của GVHD: "bên vận chuyển giải quyết như nào").
  // thống kê theo đơn vị giao hàng bị tách lẻ). Nay đổi thành chọn nhanh qua modal, chỉ khi chọn
  // "Khác..." mới cần gõ tay.
  document.querySelectorAll("[data-ship-order]").forEach(el => {
    el.onclick = () => {
      const id = el.getAttribute("data-ship-order");
      duLieuTrang.carrierModalOrderId = id;
      duLieuTrang.carrierModalMode = 'ship';
      duLieuTrang.carrierChoice = "Nội bộ ABA";
      duLieuTrang.carrierCustom = "";
      duLieuTrang.carrierTrackingNote = "";
      hienThiTrang();
    };
  });
  document.querySelectorAll("[data-edit-shipping]").forEach(el => {
    el.onclick = async () => {
      const id = el.getAttribute("data-edit-shipping");
      const order = duLieuTrang.orders.find(o => o.id === id);
      const raw = prompt("Nhập phí vận chuyển mới (VNĐ, 0 = miễn phí):", String(order.phi_van_chuyen || 0));
      if (raw === null) return;
      const newFee = Number(raw);
      if (isNaN(newFee) || newFee < 0) { hienThongBaoNhanh("Giá trị không hợp lệ"); return; }
      const newTotal = Number(order.tien_hang || 0) - Number(order.tien_giam_gia || 0) - Number(order.tien_chiet_khau_so_luong || 0) + Number(order.tien_thue || 0) + newFee;
      const { error } = await nguCanh.supabase.from("don_hang").update({ phi_van_chuyen: newFee, tong_tien: newTotal }).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("Đã cập nhật phí vận chuyển");
      taiDonHang();
    };
  });
  document.querySelectorAll("[data-set-carrier]").forEach(el => {
    el.onclick = () => {
      const id = el.getAttribute("data-set-carrier");
      const order = duLieuTrang.orders.find(o => o.id === id);
      const existing = (order?.don_vi_van_chuyen || "").trim();
      const matchesPreset = CAC_DON_VI_VAN_CHUYEN.includes(existing);
      duLieuTrang.carrierModalOrderId = id;
      duLieuTrang.carrierModalMode = 'edit';
      duLieuTrang.carrierChoice = matchesPreset ? existing : (existing ? "Khác..." : "Nội bộ ABA");
      duLieuTrang.carrierCustom = matchesPreset ? "" : existing;
      duLieuTrang.carrierTrackingNote = order?.ghi_chu_van_chuyen || "";
      hienThiTrang();
    };
  });

  document.querySelectorAll("[data-complete-delivery]").forEach(el => {
    el.onclick = () => hoanTatGiaoHang(el.getAttribute("data-complete-delivery"));
  });

  document.querySelectorAll("[data-batch-delivery]").forEach(el => {
    el.onclick = () => {
      duLieuTrang.batchDeliveryOrderId = el.getAttribute("data-batch-delivery");
      hienThiTrang();
    };
  });

  const batchBg = document.getElementById("batchDeliveryModalBg");
  if (batchBg) batchBg.onclick = (e) => {
    if (e.target.id === "batchDeliveryModalBg") { duLieuTrang.batchDeliveryOrderId = null; hienThiTrang(); }
  };
  const batchCancel = document.getElementById("batchDeliveryCancel");
  if (batchCancel) batchCancel.onclick = () => { duLieuTrang.batchDeliveryOrderId = null; hienThiTrang(); };
  document.querySelectorAll("[data-batch-qty]").forEach(input => {
    input.oninput = () => {
      const max = Number(input.max || 0);
      let value = Math.round(Number(input.value));
      if (!Number.isFinite(value)) value = 0;
      value = Math.max(0, Math.min(max, value));
      input.value = value;
      const returned = document.querySelector(`[data-batch-return="${input.getAttribute('data-batch-qty')}"]`);
      if (returned) returned.textContent = String(max - value);
    };
  });
  const batchSave = document.getElementById("batchDeliverySave");
  if (batchSave) batchSave.onclick = () => luuKetQuaGiaoHang();

  document.querySelectorAll("[data-post-return]").forEach(el => {
    el.onclick = () => { duLieuTrang.returnModalOrderId = el.getAttribute("data-post-return"); hienThiTrang(); };
  });
  document.querySelectorAll("[data-receive-return]").forEach(el => {
    el.onclick = () => nhanYeuCauTraHang(el.getAttribute("data-receive-return"), el.getAttribute("data-return-order"));
  });
  document.querySelectorAll("[data-receive-stock]").forEach(el => {
    el.onclick = () => nhanHangVeKho(el.getAttribute("data-receive-stock"), el.getAttribute("data-stock-order"));
  });
  document.querySelectorAll("[data-reject-return]").forEach(el => {
    el.onclick = () => tuChoiYeuCauTraHang(el.getAttribute("data-reject-return"), el.getAttribute("data-return-order"));
  });
  const returnBg = document.getElementById("returnModalBg");
  if (returnBg) returnBg.onclick = (e) => { if (e.target.id === "returnModalBg") { duLieuTrang.returnModalOrderId = null; hienThiTrang(); } };
  const returnCancel = document.getElementById("returnModalCancel");
  if (returnCancel) returnCancel.onclick = () => { duLieuTrang.returnModalOrderId = null; hienThiTrang(); };
  const returnSave = document.getElementById("returnModalSave");
  if (returnSave) returnSave.onclick = () => ghiNhanTraHangSauGiao(duLieuTrang.returnModalOrderId);

}
