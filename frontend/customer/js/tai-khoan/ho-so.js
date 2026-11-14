/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/ho-so.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTheHoSo()     [export]  — Vẽ thẻ hồ sơ khách (tên, SĐT, địa chỉ)
   hienThiHopSuaHoSo()  [export]  — Vẽ hộp thoại sửa hồ sơ
   taiHoSoKhach()       [export async]  — Tải hồ sơ khách vào duLieuTrang.customer
   ========================================================================== */
// Hồ sơ khách hàng: tải hồ sơ, thẻ hồ sơ, hộp sửa hồ sơ.
import { supabase, duLieuTrang } from "./du-lieu-trang.js";
import { taiHoSoKhach as docHoSoKhach } from "../../../js/dung-chung/dam-bao-khach-hang.js";
import { maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";

export function hienThiTheHoSo() {
  const c = duLieuTrang.customer;
  return `
    <div>
      <p class="acc-section-title">Thông tin tài khoản</p>
      <div class="acc-info-head">
        <div style="min-width:0">
          <p class="acc-profile-name">${maHoaHtml(c?.ho_ten) || 'Chưa cập nhật tên'}</p>
          <p class="acc-profile-email">${maHoaHtml(duLieuTrang.session.user.email)}</p>
        </div>
      </div>
      ${c?.ma_khach_hang ? `<div class="acc-profile-row"><span class="ic">🆔</span><div><div class="lbl">Mã khách hàng</div><div class="val">${c.ma_khach_hang}</div></div></div>` : ''}
      <div class="acc-profile-row"><span class="ic">📞</span><div><div class="lbl">Số điện thoại</div><div class="val">${maHoaHtml(c?.so_dien_thoai) || '— chưa cập nhật'}</div></div></div>
      ${maHoaHtml(c?.ten_cong_ty) ? `<div class="acc-profile-row"><span class="ic">🏢</span><div><div class="lbl">Công ty</div><div class="val">${maHoaHtml(c.ten_cong_ty)}</div></div></div>` : ''}
      <div class="acc-profile-row"><span class="ic">📍</span><div><div class="lbl">Địa chỉ mặc định</div><div class="val">${maHoaHtml(c?.dia_chi_mac_dinh) || '— chưa cập nhật'}</div></div></div>
      <div class="acc-info-actions">
        <span class="acc-edit-link" id="pfEdit">✏️ Sửa hồ sơ</span>
        <span class="acc-signout-link" id="btnSignOut">Đăng xuất →</span>
      </div>
    </div>`;
}

// vào NGAY trong cột hẹp bên phải (chung hàng với Thông báo) — vừa chật vừa lệch bố cục 2 cột.
// Nay tách hẳn thành modal riêng (giống modal xem chi tiết yêu cầu), rộng rãi, không phá layout
// nền phía sau, và các nút Hủy/Lưu luôn nằm trong tầm mắt dù trang có cuộn tới đâu.
export function hienThiHopSuaHoSo() {
  const c = duLieuTrang.customer;
  const restOfForm = `
      <div class="field" style="margin-top:14px"><label class="field-label">Họ tên</label><input id="pfName" value="${maHoaHtml(c?.ho_ten) || ''}" /></div>
      <div class="field"><label class="field-label">Số điện thoại</label><input id="pfPhone" value="${maHoaHtml(c?.so_dien_thoai) || ''}" /></div>
      <div class="field"><label class="field-label">Công ty (không bắt buộc)</label><input id="pfCompany" value="${maHoaHtml(c?.ten_cong_ty) || ''}" /></div>
      <div class="field"><label class="field-label">Địa chỉ giao hàng mặc định</label><textarea id="pfAddress" rows="2">${maHoaHtml(c?.dia_chi_mac_dinh) || ''}</textarea></div>
      <div class="row" style="justify-content:flex-end;gap:8px">
        <button class="btn ghost small" id="pfCancel" type="button">Hủy</button>
        <button class="btn small" id="pfSave" type="button" ${duLieuTrang.profileSaving ? 'disabled' : ''}>${duLieuTrang.profileSaving ? 'Đang lưu…' : 'Lưu'}</button>
      </div>
      <hr style="border:none;border-top:1px solid var(--line-soft);margin:16px 0" />
      <div class="acc-profile-row"><span class="ic">📧</span><div><div class="lbl">Email đăng nhập</div><div class="val">${maHoaHtml(duLieuTrang.session.user.email)}</div></div></div>`;
  return `<div class="modal-bg" id="editProfileBg">
    <div class="modal" style="max-width:480px">
      <h2 style="font-size:18px;margin:0 0 16px">Sửa hồ sơ</h2>
      ${restOfForm}
    </div>
  </div>`;
}

export async function taiHoSoKhach() {
  duLieuTrang.customer = await docHoSoKhach(supabase, duLieuTrang.session);
}
