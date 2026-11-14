/* ==========================================================================
   MỤC LỤC HÀM — customer/js/lien-he.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   uploadRequestImages(requestId, files)                        [async]  — Tải tối đa 3 ảnh (chỉ file ảnh) đính kèm yêu cầu
   fmtOrder(o)                                                  — Chuỗi mô tả 1 đơn trong ô chọn: mã · ngày · tổng tiền
   getSelectedOrder()                                           — Đơn đang được chọn trong ô chọn đơn
   getOrderItems(order)                                         — Các dòng chi tiết hợp lệ của 1 đơn
   getOrderProducts(order)                                      — Danh sách sản phẩm không trùng của 1 đơn (dùng Set)
   renderWarrantyProducts(order)                                — Vẽ danh sách sản phẩm của đơn để tick cho yêu cầu bảo hành/đổi trả
   collectWarrantyProducts(order)                               — Gom các sản phẩm đã tick cho yêu cầu bảo hành
   drawProductOptions(list)                                     — Vẽ lại các <option> sản phẩm, giữ lựa chọn cũ
   fillProductOptions(list, placeholder = "— Chọn sản phẩm —")  — Đặt danh sách sản phẩm cho ô chọn (có placeholder)
   renderRequestContext()                                       — Hiện/ẩn các ô theo loại yêu cầu (cần chọn sản phẩm? cần chọn đơn?)
   renderOrderOptions(query)                                    — Lọc ô chọn đơn theo từ khóa gõ (bỏ ký tự thừa như #, "Đơn")
   loadRequestOptions()                                         [async]  — Tải sản phẩm và đơn của khách để đổ vào các ô chọn
   * Ngoài hàm còn có: cProductSearch/cOrderSearch (oninput lọc), cOrder (onchange), cSubmitBtn.onclick = gửi yêu cầu (dòng ~268).
   ========================================================================== */
// Logic trang lien-he.html — luồng yêu cầu tinh gọn.
import { supabase, daCauHinh } from "../../js/dung-chung/ket-noi-supabase.js";
import { maDon } from "../../js/dung-chung/ma-don.js";
import { hienThongBaoNhanh } from "../../js/dung-chung/trang-chung.js";
import { dinhDangTien } from "../../js/dung-chung/dinh-dang.js";

if (daCauHinh) {
  async function uploadRequestImages(requestId, files) {
    const list = Array.from(files || []).slice(0, 3);
    const out = [];
    for (const file of list) {
      if (!file.type.startsWith("image/")) throw new Error("Chỉ được tải ảnh.");
      if (file.size > 5 * 1024 * 1024) throw new Error("Mỗi ảnh tối đa 5MB.");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${requestId}/customer-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("request-images").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("request-images").getPublicUrl(path);
      out.push({ path, url: data.publicUrl, name: file.name });
    }
    return out;
  }

  let currentSession = null;
  let paidOrders = [];
  let products = [];

  const REQUEST_TYPES = ["product_inquiry", "technical_advice", "warranty", "complaint"];
  const PRODUCT_TYPES = ["product_inquiry", "technical_advice", "warranty"];
  const ORDER_TYPES = ["technical_advice", "warranty"];

  const cType = document.getElementById("cType");
  const cProduct = document.getElementById("cProduct");
  const cProductWrap = document.getElementById("cProductWrap");
  const cProductHint = document.getElementById("cProductHint");
  const cWarrantyProductsWrap = document.getElementById("cWarrantyProductsWrap");
  const cWarrantyProducts = document.getElementById("cWarrantyProducts");
  const cOrder = document.getElementById("cOrder");
  const cOrderWrap = document.getElementById("cOrderWrap");
  const cOrderHint = document.getElementById("cOrderHint");
  const cSubmitBtn = document.getElementById("cSubmit");
  const cOriginalLabel = cSubmitBtn?.textContent || "Gửi yêu cầu";

  function fmtOrder(o) {
    const d = o.ngay_tao ? new Date(o.ngay_tao).toLocaleDateString("vi-VN") : "—";
    return `Đơn ${maDon(o)} · ${d} · ${dinhDangTien(Number(o.tong_tien || 0))}`;
  }

  function getSelectedOrder() {
    return paidOrders.find(o => String(o.id) === String(cOrder?.value || "")) || null;
  }

  function getOrderItems(order) {
    return (order?.chi_tiet_don_hang || []).filter(item => item?.id && item?.san_pham?.id);
  }

  function getOrderProducts(order) {
    const seen = new Set();
    return getOrderItems(order)
      .map(item => item.san_pham)
      .filter(p => p?.id && !seen.has(String(p.id)) && seen.add(String(p.id)));
  }

  function renderWarrantyProducts(order) {
    if (!cWarrantyProducts) return;
    const items = getOrderItems(order);
    if (!order) {
      cWarrantyProducts.innerHTML = '<div class="request-help">Chọn đơn đã giao trước. Sau đó hệ thống sẽ chỉ hiện sản phẩm thuộc đơn.</div>';
      return;
    }
    if (!items.length) {
      cWarrantyProducts.innerHTML = '<div class="request-help">Đơn này chưa có sản phẩm để chọn.</div>';
      return;
    }
    cWarrantyProducts.innerHTML = items.map(item => {
      const p = item.san_pham;
      const qty = Number(item.so_luong || 0);
      return `<label class="warranty-product-option">
        <input type="checkbox" data-warranty-item="${item.id}" data-product-id="${p.id}">
        <span class="warranty-product-main"><b>${p.ma_san_pham || 'Sản phẩm'}</b><small>${p.hang_san_xuat || ''} · Đã mua ${qty}</small></span>
        <span class="warranty-product-fields" data-warranty-fields="${item.id}" style="display:none">
          <span><small>Số lượng lỗi</small><input type="number" min="1" max="${qty}" value="1" data-warranty-qty="${item.id}"></span>
          <span class="warranty-issue"><small>Mô tả lỗi</small><input type="text" placeholder="VD: Gioăng bị đứt khi chạy máy" data-warranty-issue="${item.id}"></span>
        </span>
      </label>`;
    }).join('');

    cWarrantyProducts.querySelectorAll('[data-warranty-item]').forEach(cb => {
      cb.addEventListener('change', () => {
        const fields = cWarrantyProducts.querySelector(`[data-warranty-fields="${cb.dataset.warrantyItem}"]`);
        if (fields) fields.style.display = cb.checked ? 'flex' : 'none';
      });
    });
  }

  function collectWarrantyProducts(order) {
    const items = getOrderItems(order);
    const selected = [];
    cWarrantyProducts?.querySelectorAll('[data-warranty-item]:checked').forEach(cb => {
      const item = items.find(x => String(x.id) === String(cb.dataset.warrantyItem));
      if (!item) return;
      const qtyMax = Number(item.so_luong || 0);
      const qtyInput = cWarrantyProducts.querySelector(`[data-warranty-qty="${item.id}"]`);
      const issueInput = cWarrantyProducts.querySelector(`[data-warranty-issue="${item.id}"]`);
      const quantity = Number(qtyInput?.value || 0);
      const issue = issueInput?.value.trim() || '';
      selected.push({
        order_item_id: item.id,
        product_id: item.san_pham.id,
        product_code: item.san_pham.ma_san_pham || null,
        quantity_ordered: qtyMax,
        quantity_issue: quantity,
        issue_description: issue
      });
    });
    return selected;
  }

  // ---- "Sản phẩm liên quan": ô tìm theo mã + dropdown (không biết mã vẫn tự chọn được) ----
  const cProductSearch = document.getElementById("cProductSearch");
  let productListNow = [];
  let productPlaceholder = "— Chọn sản phẩm —";

  function drawProductOptions(list) {
    const giuLai = cProduct.value;
    cProduct.innerHTML = `<option value="">${productPlaceholder}</option>` + list.map(p => {
      const brand = p.hang_san_xuat ? ` · ${p.hang_san_xuat}` : "";
      return `<option value="${p.id}">${p.ma_san_pham || "Sản phẩm"}${brand}</option>`;
    }).join("");
    cProduct.value = giuLai;
  }

  function fillProductOptions(list, placeholder = "— Chọn sản phẩm —") {
    if (!cProduct) return;
    productListNow = list;
    productPlaceholder = placeholder;
    if (cProductSearch) cProductSearch.value = "";
    cProduct.size = 0;
    cProduct.value = "";
    drawProductOptions(list);
  }

  // Gõ tới đâu danh sách lọc tới đó; khi đang gõ thì mở danh sách ra luôn (size=6) để thấy kết quả
  cProductSearch?.addEventListener("input", () => {
    const q = cProductSearch.value.trim().toLowerCase();
    const kq = productListNow.filter(p => (p.ma_san_pham || "").toLowerCase().includes(q));
    drawProductOptions(kq);
    cProduct.size = q ? Math.min(kq.length + 1, 6) : 0;
  });
  // chọn xong thì thu danh sách lại như dropdown thường
  cProduct?.addEventListener("change", () => { cProduct.size = 0; });

  function renderRequestContext() {
    const type = cType?.value || "product_inquiry";
    const needsProduct = PRODUCT_TYPES.includes(type);
    const needsOrder = ORDER_TYPES.includes(type);
    const selectedOrder = getSelectedOrder();

    if (cOrderWrap) cOrderWrap.style.display = needsOrder ? "block" : "none";
    if (cProductWrap) cProductWrap.style.display = (needsProduct && type !== "warranty") ? "block" : "none";
    if (cWarrantyProductsWrap) cWarrantyProductsWrap.style.display = type === "warranty" ? "block" : "none";

    if (!needsOrder && cOrder) { cOrder.value = ""; if (cOrderSearch) cOrderSearch.value = ""; }

    if (type === "warranty") {
      if (!currentSession) {
        if (cOrderHint) cOrderHint.textContent = "Đăng nhập để hệ thống hiển thị đơn đã giao.";
        renderWarrantyProducts(null);
      } else if (!selectedOrder) {
        if (cOrderHint) cOrderHint.textContent = "Bắt buộc chọn đơn đã giao.";
        renderWarrantyProducts(null);
      } else {
        if (cOrderHint) cOrderHint.textContent = `Đã chọn ${fmtOrder(selectedOrder)}.`;
        renderWarrantyProducts(selectedOrder);
      }
      return;
    }

    if (type === "technical_advice") {
      if (selectedOrder) {
        const orderProducts = getOrderProducts(selectedOrder);
        fillProductOptions(orderProducts, orderProducts.length ? "— Chọn sản phẩm trong đơn —" : "— Đơn không có sản phẩm —");
        if (cProductHint) cProductHint.textContent = "Đã chọn đơn: chọn sản phẩm trực tiếp trong đơn để kỹ thuật không phải tra cứu lại.";
        if (cOrderHint) cOrderHint.textContent = `Đã chọn ${fmtOrder(selectedOrder)}.`;
      } else {
        fillProductOptions(products);
        if (cProductHint) cProductHint.textContent = "Có thể chọn sản phẩm trực tiếp; hoặc chọn đơn đã giao để lọc theo sản phẩm đã mua.";
        if (cOrderHint) cOrderHint.textContent = "Không bắt buộc. Chọn đơn nếu vấn đề liên quan đến sản phẩm đã mua.";
      }
      return;
    }
    if (type === "product_inquiry") {
      fillProductOptions(products);
      if (cProductHint) cProductHint.textContent = "Chọn sản phẩm để nhân viên xem đúng mã hàng và thông tin kỹ thuật.";
    }
  }

  // ---- Ô tìm đơn: chỉ tìm theo mã đơn ----
  const cOrderSearch = document.getElementById("cOrderSearch");
  function renderOrderOptions(query) {
    if (!cOrder) return;
    // bỏ ký tự thừa khi dán: "#12877D69", "Đơn 12877D69"...
    const q = query.trim().replace(/^(đơn\s+)?#?/i, "").toUpperCase();
    const giuLai = cOrder.value;
    const kq = q ? paidOrders.filter(o => maDon(o).includes(q)) : paidOrders;
    // luôn giữ đơn đang chọn trong danh sách để không bị mất lựa chọn khi gõ tìm tiếp
    const daChon = paidOrders.find(o => String(o.id) === String(giuLai));
    const hienThi = daChon && !kq.includes(daChon) ? [daChon, ...kq] : kq;
    cOrder.innerHTML = '<option value="">— Chọn đơn đã giao —</option>' +
      hienThi.map(o => `<option value="${o.id}">${fmtOrder(o)}</option>`).join("");
    cOrder.value = giuLai || "";
    if (q && cOrderHint && !giuLai) {
      cOrderHint.textContent = kq.length ? `Tìm thấy ${kq.length} đơn.` : "Không tìm thấy đơn nào khớp — kiểm tra lại mã đơn.";
    }
    return kq;
  }
  cOrderSearch?.addEventListener("input", () => {
    const kq = renderOrderOptions(cOrderSearch.value);
    // dán đúng mã -> chỉ còn 1 đơn khớp -> tự chọn luôn
    if (kq && cOrderSearch.value.trim() && kq.length === 1 && cOrder.value !== String(kq[0].id)) {
      cOrder.value = kq[0].id;
      cOrder.dispatchEvent(new Event("change"));
    }
  });

  async function loadRequestOptions() {
    const [{ data: productsData }, sessionResult] = await Promise.all([
      supabase.from("san_pham").select("id, ma_san_pham, hang_san_xuat").eq("dang_hoat_dong", true).order("ma_san_pham").limit(1000),
      supabase.auth.getSession()
    ]);

    products = productsData || [];
    currentSession = sessionResult?.data?.session || null;

    if (currentSession) {
      const [{ data: customer }, { data: orders }] = await Promise.all([
        supabase.from("khach_hang").select("ho_ten, so_dien_thoai, ten_cong_ty").eq("id", currentSession.user.id).maybeSingle(),
        supabase.from("don_hang")
          .select("id, ngay_tao, tong_tien, trang_thai, chi_tiet_don_hang(id, san_pham(id, ma_san_pham, hang_san_xuat), so_luong)")
          .eq("khach_hang_id", currentSession.user.id)
          .in("trang_thai", ["completed", "partially_delivered"])
          .order("ngay_tao", { ascending: false })
          .limit(200)
      ]);

      paidOrders = orders || [];
      if (customer) {
        const nameEl = document.getElementById("cName");
        const phoneEl = document.getElementById("cPhone");
        const companyEl = document.getElementById("cCompany");
        if (customer.ho_ten && nameEl && !nameEl.value) nameEl.value = customer.ho_ten;
        if (customer.so_dien_thoai && phoneEl && !phoneEl.value) phoneEl.value = customer.so_dien_thoai;
        if (customer.ten_cong_ty && companyEl && !companyEl.value) companyEl.value = customer.ten_cong_ty;
      }
    }

    renderOrderOptions("");
    renderRequestContext();
  }

  cType?.addEventListener("change", renderRequestContext);
  cOrder?.addEventListener("change", () => {
    if (cType?.value === "technical_advice" || cType?.value === "warranty") renderRequestContext();
  });

  loadRequestOptions();

  cSubmitBtn.onclick = async () => {
    if (cSubmitBtn.disabled) return;

    const name = document.getElementById("cName")?.value.trim();
    const so_dien_thoai = document.getElementById("cPhone")?.value.trim();
    const company = document.getElementById("cCompany")?.value.trim();
    const loai_yeu_cau = cType?.value;
    const product_id = cProduct?.value || "";
    const order_id = cOrder?.value || "";
    const ghi_chu = document.getElementById("cNote")?.value.trim();
    const selectedOrder = getSelectedOrder();

    if (!REQUEST_TYPES.includes(loai_yeu_cau)) {
      hienThongBaoNhanh("Loại yêu cầu không hợp lệ.");
      return;
    }
    if (!name || !so_dien_thoai) {
      hienThongBaoNhanh("Vui lòng nhập họ tên và số điện thoại.");
      return;
    }

    const lastSubmit = Number(localStorage.getItem("aba_last_quote_submit") || 0);
    if (Date.now() - lastSubmit < 60000) {
      hienThongBaoNhanh("Bạn vừa gửi yêu cầu này rồi, vui lòng đợi ít phút rồi thử lại.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    let warranty_products = [];
    if (loai_yeu_cau === "warranty") {
      if (!session || !order_id || !selectedOrder) {
        hienThongBaoNhanh("Bảo hành/Đổi trả cần đăng nhập và chọn đơn đã giao.");
        return;
      }
      warranty_products = collectWarrantyProducts(selectedOrder);
      if (!warranty_products.length) {
        hienThongBaoNhanh("Hãy chọn ít nhất một sản phẩm cần bảo hành/đổi trả.");
        return;
      }
      const invalid = warranty_products.find(x => x.quantity_issue < 1 || x.quantity_issue > x.quantity_ordered || !x.issue_description);
      if (invalid) {
        hienThongBaoNhanh("Mỗi sản phẩm đã chọn phải có số lượng lỗi hợp lệ và mô tả lỗi.");
        return;
      }
    }

    if (loai_yeu_cau === "technical_advice" && !product_id && !order_id) {
      hienThongBaoNhanh("Tư vấn kỹ thuật: hãy chọn sản phẩm hoặc đơn đã giao.");
      return;
    }

    if (loai_yeu_cau === "technical_advice" && order_id && product_id) {
      const selectedOrder = paidOrders.find(o => String(o.id) === String(order_id));
      const belongs = getOrderProducts(selectedOrder).some(p => String(p.id) === String(product_id));
      if (!belongs) {
        hienThongBaoNhanh("Sản phẩm đã chọn không nằm trong đơn đã chọn.");
        return;
      }
    }

    if (!ghi_chu) {
      hienThongBaoNhanh("Vui lòng nhập nội dung yêu cầu.");
      return;
    }
    if (!session && loai_yeu_cau !== "product_inquiry") {
      hienThongBaoNhanh("Vui lòng đăng nhập để gửi loại yêu cầu này (khách vãng lai chỉ gửi được \"Hỏi sản phẩm\").");
      return;
    }

    cSubmitBtn.disabled = true;
    cSubmitBtn.textContent = "Đang gửi...";

    const du_lieu_loai = {
      product_id: product_id || null,
      order_id: order_id || null,
      products: warranty_products,
    };

    const files = document.getElementById("cImages")?.files || [];
    let error = null;

    if (session) {
      // Khách đã đăng nhập: tạo yêu cầu + tin nhắn đầu tiên qua RPC (RLS không cho insert trực tiếp)
      const { data: requestId, error: rpcError } = await supabase.rpc("tao_yeu_cau_ho_tro", {
        p_loai: loai_yeu_cau,
        p_noi_dung: ghi_chu,
        p_du_lieu: du_lieu_loai,
        p_ten: name,
        p_sdt: so_dien_thoai,
        p_cong_ty: company || null
      });
      error = rpcError;

      if (!error && files.length) {
        try {
          const images = await uploadRequestImages(requestId, files);
          const { error: msgError } = await supabase.from("tin_nhan_ho_tro").insert({
            yeu_cau_id: requestId, loai_nguoi_gui: "customer", nguoi_gui_id: session.user.id,
            noi_dung: "Đã gửi ảnh đính kèm.", tep_dinh_kem: images
          });
          if (msgError) throw msgError;
        } catch (uploadErr) {
          hienThongBaoNhanh("Đã gửi yêu cầu, nhưng ảnh chưa tải lên: " + (uploadErr.message || uploadErr));
        }
      }
    } else {
      // Khách vãng lai: chỉ được gửi "Hỏi sản phẩm"; không .select() vì khách chưa đăng nhập không có quyền đọc lại dòng vừa tạo
      const { error: guestError } = await supabase.from("yeu_cau_bao_gia").insert({
        ten_khach_hang: name,
        sdt_khach_hang: so_dien_thoai,
        ten_cong_ty: company || null,
        ghi_chu,
        khach_hang_id: null,
        loai_yeu_cau,
        du_lieu_loai
      });
      error = guestError;
      if (!error && files.length) hienThongBaoNhanh("Ảnh đính kèm chỉ gửi được khi đăng nhập. Yêu cầu của bạn vẫn đã được gửi.");
    }

    if (error) {
      hienThongBaoNhanh("Lỗi: " + error.message);
      cSubmitBtn.disabled = false;
      cSubmitBtn.textContent = cOriginalLabel;
      return;
    }

    localStorage.setItem("aba_last_quote_submit", String(Date.now()));
    document.getElementById("cName").value = "";
    document.getElementById("cPhone").value = "";
    document.getElementById("cCompany").value = "";
    document.getElementById("cNote").value = "";
    if (document.getElementById("cImages")) document.getElementById("cImages").value = "";
    if (cProduct) cProduct.value = "";
    if (cOrder) cOrder.value = "";
    if (cOrderSearch) { cOrderSearch.value = ""; renderOrderOptions(""); }
    if (cWarrantyProducts) cWarrantyProducts.innerHTML = "";
    if (cType) cType.value = "product_inquiry";
    renderRequestContext();

    cSubmitBtn.textContent = "✓ Đã gửi";
    hienThongBaoNhanh("Đã gửi yêu cầu! Chúng tôi sẽ liên hệ sớm.");
    setTimeout(() => {
      cSubmitBtn.disabled = false;
      cSubmitBtn.textContent = cOriginalLabel;
    }, 5000);
  };
}
