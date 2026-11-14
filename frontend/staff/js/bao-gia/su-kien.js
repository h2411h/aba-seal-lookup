/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia/su-kien.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)      — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   hienThiKetQua(...a)     — Hàm ủy quyền sang hanhDong.hienThiKetQua
   ganSuKienThanhCongCu()  [export]  — Gắn sự kiện thanh công cụ (tìm kiếm, bộ lọc)
   gomDuLieuXuLy(id)       — Gom dữ liệu form động để lưu vào du_lieu_loai khi hoàn tất yêu cầu
   ganSuKienKetQua()       [export]  — Gắn sự kiện cho vùng kết quả (mở rộng, hoàn tất, hủy, gửi phản hồi)
   ========================================================================== */
// Gắn sự kiện cho thanh công cụ và danh sách kết quả (nhận xử lý, trả lời, đổi trạng thái, báo giá...).
import { hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { nguCanh, banDoNhanVien, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { thuThapDuLieuBaoHanh } from "./bao-hanh.js";
import { taiDongYeuCau, taiYeuCau, danhDauDaHuy, danhDauDaDocPhanHoiKhach } from "./tai-du-lieu.js";
import { layTinNhanYeuCau, guiPhanHoiNhanVien } from "./trao-doi.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng
const hienThiKetQua = (...a) => hanhDong.hienThiKetQua(...a); // hienThiKetQua nằm ở module khác; gọi qua actions để tránh import vòng

export function ganSuKienThanhCongCu() {
  document.getElementById("fSearch").oninput = (e) => {
    duLieuTrang.search = e.target.value;
    const cursorPos = e.target.selectionStart;
    hienThiKetQua();
    const el = document.getElementById("fSearch");
    el.focus();
    el.setSelectionRange(cursorPos, cursorPos);
  };
  document.getElementById("fType").onchange = (e) => { duLieuTrang.filterType = e.target.value; hienThiKetQua(); };
  document.getElementById("fStatus").onchange = (e) => { duLieuTrang.filterStatus = e.target.value; hienThiKetQua(); };
  document.getElementById("fAssignee").onchange = (e) => { duLieuTrang.filterAssignee = e.target.value; hienThiKetQua(); };
  document.getElementById("btnClearFilters").onclick = () => {
    duLieuTrang.search = ""; duLieuTrang.filterStatus = "all"; duLieuTrang.filterType = "all"; duLieuTrang.filterAssignee = "all";
    hienThiTrang();
  };
}

// Không còn nút "Lưu" riêng: dữ liệu form động (sản phẩm lỗi, số lượng, mô tả lỗi...) được gom và lưu vào
// du_lieu_loai CÙNG LÚC bấm "Hoàn tất yêu cầu". Trả về { typeData } | { loi } | { boQua } (không có gì để lưu).
function gomDuLieuXuLy(id) {
  const typeData = {};
  document.querySelectorAll("[data-td]").forEach(f => { typeData[f.getAttribute("data-td")] = f.value; });
  const q = duLieuTrang.quotes.find(x => x.id === id);
  if (q?.loai_yeu_cau === "warranty") {
    delete typeData.resolution_request;
    // Mã đơn: ưu tiên ô chọn đơn (nếu đang mở), không có (ô đã khóa) thì lấy đơn đã gắn sẵn trong yêu cầu.
    const maDonDangGan = document.querySelector(`[data-warranty-order="${id}"]`)?.value || q.du_lieu_loai?.order_id || typeData.order_id;
    const order = duLieuTrang.paidOrders.find(o => String(o.id) === String(maDonDangGan));
    const box = document.querySelector(`[data-request-detail="${id}"]`) || document;
    const products = thuThapDuLieuBaoHanh(box);
    if (!products.length) return { boQua: true };   // chưa tick sản phẩm nào → giữ nguyên dữ liệu đã có, vẫn cho hoàn tất
    typeData.order_id = order?.id || maDonDangGan || "";
    typeData.products = products;
    typeData.product_id = products[0]?.product_id || null;
    if (!typeData.order_id || !order) return { loi: "Bảo hành/Đổi trả phải chọn đơn đã giao" };
    const invalid = products.find(x => {
      const item = (order.chi_tiet_don_hang || []).find(i => String(i.id) === String(x.order_item_id));
      return !x.product_id || x.quantity_issue < 1 || x.quantity_issue > Number(item?.so_luong || 0) || !x.issue_description;
    });
    if (invalid) return { loi: "Mỗi sản phẩm phải có số lượng lỗi hợp lệ và mô tả lỗi" };
  }
  return { typeData };
}

export function ganSuKienKetQua() {
  document.querySelectorAll("[data-expand-quote]").forEach(el => {
    el.onclick = () => {
      const id = el.getAttribute("data-expand-quote");
      if (duLieuTrang.expandedQuote === id) { duLieuTrang.expandedQuote = null; hienThiKetQua(); return; }
      duLieuTrang.expandedQuote = id;
      duLieuTrang.showResolveForm = false;
      danhDauDaDocPhanHoiKhach(id);
      taiDongYeuCau(id);
    };
  });

  document.querySelectorAll("[data-type-select]").forEach(el => {
    el.onchange = async () => {
      const id = el.getAttribute("data-type-select");
      const newType = el.value;
      await nguCanh.supabase.from("yeu_cau_bao_gia").update({ loai_yeu_cau: newType }).eq("id", id);
      hienThongBaoNhanh("✓ Đã lưu");
      taiYeuCau();
    };
  });
  document.querySelectorAll("[data-status-select]").forEach(el => {
    el.onchange = async () => {
      const id = el.getAttribute("data-status-select");
      const newStatus = el.value;
      const payload = { trang_thai: newStatus };
      if (!duLieuTrang.quotes.find(q => q.id === id)?.nguoi_xu_ly) payload.nguoi_xu_ly = nguCanh.staff.id;
      await nguCanh.supabase.from("yeu_cau_bao_gia").update(payload).eq("id", id);
      hienThongBaoNhanh("✓ Đã lưu");
      taiYeuCau();
    };
  });
  document.querySelectorAll("[data-claim]").forEach(el => {
    el.onclick = async () => {
      const id = el.getAttribute("data-claim");
      const payload = { nguoi_xu_ly: nguCanh.staff.id };
      if (duLieuTrang.quotes.find(q => q.id === id)?.trang_thai === 'new') payload.trang_thai = 'processing';
      await nguCanh.supabase.from("yeu_cau_bao_gia").update(payload).eq("id", id);
      hienThongBaoNhanh("Bạn đã nhận xử lý yêu cầu này");
      taiYeuCau();
    };
  });
  document.querySelectorAll("[data-reassign]").forEach(el => {
    el.onchange = async () => {
      if (!el.value) return;
      const id = el.getAttribute("data-reassign");
      await nguCanh.supabase.from("yeu_cau_bao_gia").update({ nguoi_xu_ly: el.value }).eq("id", id);
      hienThongBaoNhanh(`Đã chuyển cho ${banDoNhanVien[el.value]}`);
      taiYeuCau();
    };
  });

  document.querySelectorAll("[data-send-request-reply]").forEach(el => { el.onclick = () => guiPhanHoiNhanVien(el.getAttribute("data-send-request-reply")); });

  document.querySelectorAll('[data-warranty-check]').forEach(cb => {
    cb.onchange = () => {
      const row = cb.closest('[data-warranty-row]');
      row?.querySelectorAll('[data-warranty-qty],[data-warranty-issue]').forEach(el => { el.disabled = !cb.checked; });
    };
  });
  document.querySelectorAll('[data-warranty-order]').forEach(el => {
    el.onchange = () => {
      const id = el.getAttribute('data-warranty-order');
      const q = duLieuTrang.quotes.find(x => x.id === id);
      if (!q) return;
      const next = { ...q, du_lieu_loai: { ...(q.du_lieu_loai || {}), order_id: el.value, products: [] } };
      const idx = duLieuTrang.quotes.findIndex(x => x.id === id);
      if (idx >= 0) duLieuTrang.quotes[idx] = next;
      hienThiKetQua();
    };
  });

  // Hoàn tất yêu cầu. Phản hồi cho khách được gửi ở khung trao đổi phía trên (không còn ô "phản hồi cuối cùng").
  document.querySelectorAll("[data-confirm-resolve]").forEach(el => {
    el.onclick = async () => {
      const id = el.getAttribute("data-confirm-resolve");
      const q = duLieuTrang.quotes.find(x => x.id === id);
      const daTraLoiKhach = q ? layTinNhanYeuCau(q).some(m => m.role === "staff") : false;
      if (!daTraLoiKhach && !confirm("Bạn chưa trả lời khách trong khung trao đổi. Vẫn hoàn tất yêu cầu?")) return;
      const kq = gomDuLieuXuLy(id);
      if (kq.loi) { hienThongBaoNhanh(kq.loi); return; }
      const capNhat = { trang_thai: "resolved", ngay_xu_ly_xong: new Date().toISOString() };
      if (kq.typeData) capNhat.du_lieu_loai = kq.typeData;
      if (q && !q.nguoi_xu_ly) capNhat.nguoi_xu_ly = nguCanh.staff.id;   // chưa ai nhận → người bấm hoàn tất là người xử lý
      const { error } = await nguCanh.supabase.from("yeu_cau_bao_gia").update(capNhat).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("✓ Đã hoàn tất yêu cầu");
      taiYeuCau();
    };
  });
  // Mở lại yêu cầu đã đóng (VD khách phát hiện thêm sản phẩm lỗi): về "Đang xử lý", form tick sản phẩm hiện lại,
  // các sản phẩm đã ghi nhận vẫn được tick sẵn → nhân viên chỉ tick thêm món mới rồi Hoàn tất lần nữa.
  document.querySelectorAll("[data-reopen]").forEach(el => {
    el.onclick = async () => {
      if (!confirm("Mở lại yêu cầu này để xử lý tiếp?")) return;
      const id = el.getAttribute("data-reopen");
      const q = duLieuTrang.quotes.find(x => x.id === id);
      const capNhat = { trang_thai: "processing", ngay_xu_ly_xong: null };
      if (q && !q.nguoi_xu_ly) capNhat.nguoi_xu_ly = nguCanh.staff.id;
      const { error } = await nguCanh.supabase.from("yeu_cau_bao_gia").update(capNhat).eq("id", id);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("✓ Đã mở lại yêu cầu");
      taiYeuCau();
    };
  });
  document.querySelectorAll("[data-mark-cancelled]").forEach(el => {
    el.onclick = () => danhDauDaHuy(el.getAttribute("data-mark-cancelled"));
  });

  // Báo giá: thao tác dòng sản phẩm (giữ nguyên logic cũ)
  document.querySelectorAll("[data-save-item]").forEach(el => {
    el.onclick = async () => {
      const itemId = el.getAttribute("data-save-item");
      const price = Number(document.querySelector(`[data-price="${itemId}"]`).value);
      const discount = Number(document.querySelector(`[data-discount="${itemId}"]`).value);
      const qty = Number(document.querySelector(`[data-qty="${itemId}"]`).value) || 1;
      const { error } = await nguCanh.supabase.from("chi_tiet_yeu_cau_bao_gia").update({ don_gia: price, phan_tram_chiet_khau: discount, so_luong: qty }).eq("id", itemId);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("✓ Đã lưu dòng sản phẩm");
      taiDongYeuCau(duLieuTrang.expandedQuote);
    };
  });
  document.querySelectorAll("[data-delete-item]").forEach(el => {
    el.onclick = async () => {
      const itemId = el.getAttribute("data-delete-item");
      if (!confirm("Xóa dòng sản phẩm này khỏi yêu cầu?")) return;
      const { error } = await nguCanh.supabase.from("chi_tiet_yeu_cau_bao_gia").delete().eq("id", itemId);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("Đã xóa dòng sản phẩm");
      taiDongYeuCau(duLieuTrang.expandedQuote);
    };
  });
  document.querySelectorAll("[data-add-item]").forEach(el => {
    el.onclick = async () => {
      const qid = el.getAttribute("data-add-item");
      const code = document.querySelector(`[data-new-code="${qid}"]`).value.trim();
      const qty = Number(document.querySelector(`[data-new-qty="${qid}"]`).value) || 1;
      let price = Number(document.querySelector(`[data-new-price="${qid}"]`).value) || 0;
      if (!code) { hienThongBaoNhanh("Vui lòng nhập mã hàng hoặc mô tả sản phẩm"); return; }
      const { data: existingProduct } = await nguCanh.supabase.from("san_pham").select("id, gia_le_vnd").eq("ma_san_pham", code).maybeSingle();
      if (existingProduct && !price) price = existingProduct.gia_le_vnd || 0;
      const payload = existingProduct
        ? { yeu_cau_bao_gia_id: qid, san_pham_id: existingProduct.id, so_luong: qty, don_gia: price, phan_tram_chiet_khau: 0 }
        : { yeu_cau_bao_gia_id: qid, ma_san_pham_van_ban: code, so_luong: qty, don_gia: price, phan_tram_chiet_khau: 0 };
      const { error } = await nguCanh.supabase.from("chi_tiet_yeu_cau_bao_gia").insert(payload);
      if (error) { hienThongBaoNhanh("Lỗi: " + error.message); return; }
      hienThongBaoNhanh("✓ Đã thêm dòng sản phẩm");
      taiDongYeuCau(qid);
    };
  });
}
