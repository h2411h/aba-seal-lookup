/* ==========================================================================
   MỤC LỤC HÀM — staff/js/kho/nhap-nhanh.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang()         — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   motDong(giaTri = [])   — HTML 1 dòng nhập (các ô theo thứ tự cột khi dán từ Excel)
   hienThiHopNhapNhanh()  [export]  — Vẽ hộp thoại nhập kho nhanh nhiều dòng
   hienLoi(danhSach)      — Hiện danh sách lỗi kiểm tra của phiếu
   luuPhieu()             [async]  — ★ Kiểm tra từng dòng, tạo sản phẩm mới nếu cần, ghi cả phiếu nhập vào giao_dich_kho (1 lệnh insert)
   ganSuKienNhapNhanh()   [export]  — Gắn sự kiện cho hộp nhập nhanh (mở, dán từ Excel, lưu)
   ========================================================================== */
// Nhập kho nhanh: gõ trực tiếp nhiều mã của CÙNG 1 phiếu nhập (cùng kho, cùng hóa đơn).
// Mã đã có -> chỉ ghi nhập kho (bỏ qua các cột thông số). Mã chưa có -> tự tạo sản phẩm mới từ các cột
// thông số (hãng, ĐK trong, ĐK ngoài, độ dày, vật liệu) rồi nhập kho luôn.
// Có thể dán nhiều dòng copy từ Excel vào ô "Mã" (8 cột: mã, số lượng, giá nhập, hãng, ĐK trong, ĐK ngoài, độ dày, vật liệu).
// Ghi giao dịch bằng MỘT lệnh insert; nếu lỗi thì xóa các sản phẩm mới vừa tạo để không để lại mã "trống".
import { hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";
import { nguCanh, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { taiDuLieu } from "./tai-du-lieu.js";
import { taoSoPhieuNhap, CHUA_CO_HOA_DON } from "./tien-ich.js";

const hienThiTrang = () => hanhDong.render();
const TOI_DA_DONG = 200;

// Thứ tự ô trên một dòng (cũng là thứ tự cột khi dán từ Excel)
const CAC_O = ["nk-ma", "nk-sl", "nk-gia", "nk-hang", "nk-trong", "nk-ngoai", "nk-day", "nk-vl"];

function motDong(giaTri = []) {
  const o = (i, extra = "") => `<td><input class="${CAC_O[i]}" ${extra} value="${maHoaHtml(giaTri[i] ?? "")}" /></td>`;
  return `<tr>${o(0, 'placeholder="VD: FU0382-K"')}${o(1, 'inputmode="numeric"')}${o(2, 'inputmode="numeric"')}${o(3)}${o(4, 'inputmode="decimal"')}${o(5, 'inputmode="decimal"')}${o(6, 'inputmode="decimal"')}${o(7)}
    <td><button type="button" class="btn ghost small nk-xoa" title="Xóa dòng">✕</button></td>
  </tr>`;
}

export function hienThiHopNhapNhanh() {
  return `<div style="position:fixed;inset:0;background:rgba(10,16,24,.55);display:flex;z-index:var(--z-modal);padding:20px;box-sizing:border-box;overflow-y:auto">
    <div style="margin:auto;background:#fff;border-radius:6px;padding:26px;width:100%;max-width:1020px">
      <h3 style="margin-top:0">Nhập kho nhiều mã</h3>
      <p style="font-size:12px;color:var(--steel);margin:-6px 0 14px;line-height:1.55">Dùng cho 1 phiếu nhập (cùng kho, cùng hóa đơn). <b>Số phiếu nhập tự động tạo khi lưu.</b> Chọn <b>Điều chỉnh tăng</b> khi kho đang thiếu so với thực tế (kiểm kê thừa, hoặc lần trước ghi thiếu): chỉ cần mã và số lượng, hệ thống tự lấy giá vốn hiện tại. <b>Mã đã có</b>: chỉ cần mã, số lượng, giá nhập. <b>Mã mới</b>: điền thêm hãng, kích thước (bắt buộc) và vật liệu — hệ thống tự tạo sản phẩm. Có thể <b>dán nhiều dòng từ Excel</b> vào ô mã (8 cột theo đúng thứ tự bảng).</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="field" style="flex:1"><label class="field-label">Loại nhập</label><select id="nkLoai" style="width:100%"><option value="mua">Nhập hàng mua</option><option value="dieuchinh">Điều chỉnh tăng (kiểm kê thừa / ghi thiếu)</option></select></div>
        <div class="field" style="flex:1"><label class="field-label">Kho nhập</label><select id="nkKho" style="width:100%">${duLieuTrang.warehouses.map(w => `<option value="${w.id}">${maHoaHtml(w.ten)}</option>`).join("")}</select></div>
        <div class="field" style="flex:2"><label class="field-label" id="nkNhanGhiChu">Số hóa đơn của nhà cung cấp (không bắt buộc)</label><input id="nkGhiChu" placeholder="VD: HĐ 00123 — để trống nếu chưa có hóa đơn" style="width:100%" /></div>
      </div>
      <table class="nk-table"><thead><tr><th>Mã sản phẩm</th><th>Số lượng</th><th>Giá nhập / cái (VNĐ)</th><th>Hãng <small>(mã mới)</small></th><th>ĐK trong</th><th>ĐK ngoài</th><th>Độ dày</th><th>Vật liệu</th><th></th></tr></thead>
        <tbody id="nkBang">${motDong() + motDong() + motDong() + motDong() + motDong()}</tbody></table>
      <button type="button" class="btn ghost small" id="nkThem">+ Thêm dòng</button>
      <div id="nkLoi" style="display:none;margin-top:12px;padding:9px 11px;border-radius:6px;background:#fff7f7;border:1px solid #f1c7c7;color:#a12626;font-size:12px;line-height:1.6"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
        <button class="btn ghost" id="nkHuy">Hủy</button>
        <button class="btn" id="nkLuu">Lưu phiếu nhập</button>
      </div>
    </div>
  </div>`;
}

function hienLoi(danhSach) {
  const o = document.getElementById("nkLoi");
  o.style.display = danhSach.length ? "block" : "none";
  o.innerHTML = danhSach.length ? `<b>Chưa lưu được — cần sửa:</b><br>` + danhSach.slice(0, 10).map(maHoaHtml).join("<br>") + (danhSach.length > 10 ? `<br>… và ${danhSach.length - 10} lỗi nữa` : "") : "";
}

async function luuPhieu() {
  const { supabase, staff } = nguCanh;
  const nut = document.getElementById("nkLuu");
  const khoId = document.getElementById("nkKho").value;
  const ghiChu = document.getElementById("nkGhiChu").value.trim();
  const dieuChinh = document.getElementById("nkLoai").value === "dieuchinh"; // điều chỉnh tăng: không cần giá, lấy giá vốn hiện tại

  // Đọc các dòng đang gõ (bỏ dòng để trống hoàn toàn)
  const dong = [...document.querySelectorAll("#nkBang tr")].map((tr, i) => ({
    so: i + 1,
    ma: tr.querySelector(".nk-ma").value.trim(),
    slText: tr.querySelector(".nk-sl").value.trim(),
    giaText: tr.querySelector(".nk-gia").value.trim(),
    hang: tr.querySelector(".nk-hang").value.trim(),
    trongText: tr.querySelector(".nk-trong").value.trim(),
    ngoaiText: tr.querySelector(".nk-ngoai").value.trim(),
    dayText: tr.querySelector(".nk-day").value.trim(),
    vatLieu: tr.querySelector(".nk-vl").value.trim()
  })).filter(d => d.ma || d.slText || d.giaText);

  const loi = [];
  if (!khoId) loi.push("Chưa chọn kho");
  if (dong.length === 0) loi.push("Chưa nhập dòng nào");
  if (dong.length > TOI_DA_DONG) loi.push(`Tối đa ${TOI_DA_DONG} dòng mỗi phiếu`);
  dong.forEach(d => {
    d.sl = /^\d+$/.test(d.slText) ? Number(d.slText) : 0;
    d.gia = Number(d.giaText.replace(/\D/g, "")); // "90.000", "90,000" hay "90.000 đ" đều -> 90000
    if (!d.ma) loi.push(`Dòng ${d.so}: thiếu mã sản phẩm`);
    if (d.sl <= 0) loi.push(`Dòng ${d.so}: số lượng phải là số nguyên lớn hơn 0`);
    if (!d.gia && !dieuChinh) loi.push(`Dòng ${d.so}: thiếu giá nhập`);
  });
  if (loi.length) return hienLoi(loi);

  nut.disabled = true;
  // Đối chiếu mã sản phẩm (chỉ hỏi đúng các mã đã gõ)
  const { data: sanPham, error } = await supabase.from("san_pham").select("id, ma_san_pham").in("ma_san_pham", [...new Set(dong.map(d => d.ma))]);
  if (error) { nut.disabled = false; return hienLoi(["Không kiểm tra được mã sản phẩm: " + error.message]); }
  const timSanPham = new Map(sanPham.map(p => [p.ma_san_pham, p.id]));

  if (dieuChinh) { // Điều chỉnh tăng chỉ dùng cho mã đã có và đã có giá vốn (giá vốn bình quân sẽ không đổi)
    dong.forEach(d => {
      const id = timSanPham.get(d.ma);
      if (!id) return loi.push(`Dòng ${d.so}: mã "${d.ma}" chưa có trong hệ thống — hãy dùng "Nhập hàng mua" để tạo mã mới`);
      d.gia = Number(duLieuTrang.costs[id]);
      if (!d.gia) loi.push(`Dòng ${d.so}: mã "${d.ma}" chưa có giá vốn — hãy dùng "Nhập hàng mua" và điền giá nhập`);
    });
    if (loi.length) { nut.disabled = false; return hienLoi(loi); }
  }

  // Mã chưa có -> sẽ tạo mới; dòng đầu tiên của mã đó cung cấp thông số. Bắt buộc có đủ 3 kích thước.
  const so = (t) => (t === "" || isNaN(Number(t)) ? null : Number(t));
  const maMoi = new Map();
  dong.forEach(d => {
    if (timSanPham.has(d.ma) || maMoi.has(d.ma)) return;
    const sp = { ma_san_pham: d.ma, hang_san_xuat: d.hang || null, duong_kinh_trong: so(d.trongText), duong_kinh_ngoai: so(d.ngoaiText),
      do_day: so(d.dayText), vat_lieu: d.vatLieu || null, don_vi_tinh: "Cái", so_luong_ton: 0, gia_le_vnd: 0 };
    if (sp.duong_kinh_trong == null || sp.duong_kinh_ngoai == null || sp.do_day == null)
      loi.push(`Dòng ${d.so}: mã "${d.ma}" chưa có trong hệ thống — cần điền đủ ĐK trong, ĐK ngoài, độ dày để tạo sản phẩm mới`);
    maMoi.set(d.ma, sp);
  });
  if (loi.length) { nut.disabled = false; return hienLoi(loi); }

  let idMoi = [];
  if (maMoi.size) {
    const { data: tao, error: loiTao } = await supabase.from("san_pham").insert([...maMoi.values()]).select("id, ma_san_pham");
    if (loiTao) { nut.disabled = false; return hienLoi(["Không tạo được sản phẩm mới, chưa ghi gì: " + loiTao.message]); }
    tao.forEach(p => { timSanPham.set(p.ma_san_pham, p.id); idMoi.push(p.id); });
  }

  // Ghi cả phiếu 1 lần: hoặc vào hết, hoặc không vào dòng nào. Mọi dòng của phiếu dùng chung 1 số phiếu.
  const soPhieu = await taoSoPhieuNhap(supabase);
  const { error: loiGhi } = await supabase.from("giao_dich_kho").insert(dong.map(d => ({
    san_pham_id: timSanPham.get(d.ma), kho_id: khoId, loai_giao_dich: "import",
    so_luong: d.sl, don_gia_von: d.gia, so_phieu: soPhieu, ghi_chu_tham_chieu: dieuChinh ? "Điều chỉnh tăng kho — " + (ghiChu || "kiểm kê thừa") : (ghiChu || CHUA_CO_HOA_DON), nguoi_tao: staff.id
  })));
  if (loiGhi) {
    if (idMoi.length) await supabase.from("san_pham").delete().in("id", idMoi); // gỡ sản phẩm vừa tạo, không để mã trống
    nut.disabled = false; return hienLoi(["Không ghi được, chưa nhập dòng nào: " + loiGhi.message]);
  }

  duLieuTrang.showNhapNhanh = false;
  hienThongBaoNhanh(`Đã lưu phiếu ${soPhieu} — nhập kho ${dong.length} dòng` + (maMoi.size ? ` (tạo mới ${maMoi.size} sản phẩm — nhớ đặt giá bán ở bảng tồn kho)` : ""));
  taiDuLieu();
}

export function ganSuKienNhapNhanh() {
  const nutMo = document.getElementById("btnNhapNhanh");
  if (nutMo) nutMo.onclick = () => { duLieuTrang.showNhapNhanh = true; hienThiTrang(); };

  const bang = document.getElementById("nkBang");
  if (!bang) return; // hộp đang đóng
  const themDong = () => { bang.insertAdjacentHTML("beforeend", motDong()); return bang.lastElementChild; };

  document.getElementById("nkHuy").onclick = () => { duLieuTrang.showNhapNhanh = false; hienThiTrang(); };
  document.getElementById("nkThem").onclick = () => themDong().querySelector(".nk-ma").focus();
  document.getElementById("nkLuu").onclick = luuPhieu;
  document.getElementById("nkLoai").onchange = (e) => { // đổi nhãn ô ghi chú cho đúng loại nhập
    const dc = e.target.value === "dieuchinh";
    document.getElementById("nkNhanGhiChu").textContent = dc ? "Lý do điều chỉnh (không bắt buộc)" : "Số hóa đơn của nhà cung cấp (không bắt buộc)";
    document.getElementById("nkGhiChu").placeholder = dc ? "VD: kiểm kê thừa 10 cái; hoặc phiếu PN-20261101-001 ghi thiếu" : "VD: HĐ 00123 — để trống nếu chưa có hóa đơn";
  };

  // Xóa dòng (còn 1 dòng thì chỉ làm trống)
  bang.addEventListener("click", (e) => {
    if (!e.target.classList.contains("nk-xoa")) return;
    const tr = e.target.closest("tr");
    if (bang.children.length === 1) tr.querySelectorAll("input").forEach(i => { i.value = ""; });
    else tr.remove();
  });

  // Enter ở ô giá = xuống dòng tiếp theo (dòng cuối thì tự thêm dòng mới)
  bang.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.classList.contains("nk-gia")) return;
    e.preventDefault();
    const tr = e.target.closest("tr");
    (tr.nextElementSibling || themDong()).querySelector(".nk-ma").focus();
  });

  // Dán nhiều dòng từ Excel vào ô mã: mỗi dòng gồm tối đa 8 cột cách nhau bằng Tab (xem CAC_O)
  bang.addEventListener("paste", (e) => {
    if (!e.target.classList.contains("nk-ma")) return;
    const text = e.clipboardData.getData("text").trim();
    if (!/[\t\n]/.test(text)) return; // dán 1 mã bình thường thì để trình duyệt tự xử lý
    e.preventDefault();
    let tr = e.target.closest("tr");
    for (const dongDan of text.split(/\r?\n/)) {
      const cot = dongDan.split("\t");
      if (!tr) tr = themDong();
      CAC_O.forEach((lop, i) => { tr.querySelector("." + lop).value = (cot[i] ?? "").trim(); });
      tr = tr.nextElementSibling;
    }
  });
}
