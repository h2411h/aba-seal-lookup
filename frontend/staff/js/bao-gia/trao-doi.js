/* ==========================================================================
   MỤC LỤC HÀM — staff/js/bao-gia/trao-doi.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   layTinNhanYeuCau(q)           [export]  — Lấy danh sách tin nhắn của yêu cầu (đã lưu và nội dung ban đầu)
   veTinNhanNhanVien(q)          — Vẽ các tin nhắn trong khung trao đổi phía nhân viên
   yeuCauDaDong(q)               [export]  — Yêu cầu đã đóng thì DB không cho nhân viên nhắn thêm
   hienThiTraoDoi(q)             [export]  — Vẽ khung trao đổi của 1 yêu cầu
   guiPhanHoiNhanVien(id)        [export async]  — Nhân viên gửi phản hồi (chặn bấm đúp bằng Set)
   guiPhanHoiNhanVienMotLan(id)  [async]  — Phần gửi phản hồi thật sự
   ========================================================================== */
// Trao đổi tin nhắn giữa nhân viên và khách trong từng yêu cầu (hiển thị, gửi trả lời, chống gửi trùng).
import { hienThongBaoNhanh } from "../../nhan-vien-chung.js";
import { nguCanh, duLieuTrang } from "./du-lieu-trang.js";
import { taiYeuCau } from "./tai-du-lieu.js";
import { maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";

export function layTinNhanYeuCau(q) {
  const td = q.du_lieu_loai || {};
  const saved = (q._dbMessages || []).map(m => ({ role:m.loai_nguoi_gui === 'staff' ? 'staff' : 'customer', text:m.noi_dung, images:Array.isArray(m.tep_dinh_kem) ? m.tep_dinh_kem : [], created_at:m.ngay_tao }));
  const legacy = Array.isArray(td.messages) ? [...td.messages] : [];
  if (!legacy.length) {
    // Tin đầu tiên của yêu cầu mới đã nằm trong tin_nhan_ho_tro -> không dựng thêm từ ghi_chu để tránh lặp.
    const ghiChu = (q.ghi_chu || '').trim();
    const daCoTinDau = saved.some(m => m.role === 'customer' && (m.text || '').trim() === ghiChu);
    if (!daCoTinDau) legacy.push({ role:'customer', text:q.ghi_chu || '', created_at:q.ngay_tao });
    if (q.ket_qua_xu_ly && !saved.some(m => m.role === 'staff' && (m.text || '').trim() === q.ket_qua_xu_ly.trim())) legacy.push({ role:'staff', text:q.ket_qua_xu_ly, created_at:q.ngay_xu_ly_xong });
  }
  return [...legacy, ...saved];
}

function veTinNhanNhanVien(q) {
  return layTinNhanYeuCau(q).map(m => {
    const customer = m.role === 'customer';
    const imgs = (m.images || []).map(x => `<a href="${x.url}" target="_blank" rel="noopener"><img src="${x.url}" alt="Ảnh khách gửi" style="max-width:180px;max-height:140px;object-fit:cover;border-radius:7px;margin:6px 6px 0 0;border:1px solid var(--line-soft)"></a>`).join('');
    return `<div style="padding:9px 11px;margin:7px 0;border-radius:8px;background:${customer?'#f7f8fa':'#f0f9f4'};border:1px solid var(--line-soft)"><b style="font-size:12px">${customer?'Khách hàng':'ABA'}</b><span style="float:right;font-size:10.5px;color:var(--steel)">${m.created_at?new Date(m.created_at).toLocaleString('vi-VN'):''}</span><div style="font-size:13px;line-height:1.5;margin-top:4px;white-space:pre-wrap">${maHoaHtml(m.text || '')}</div>${imgs?`<div>${imgs}</div>`:''}</div>`;
  }).join('');
}

// Yêu cầu đã đóng: DB (policy tn_insert_nv) không cho nhân viên nhắn thêm. Nếu KHÁCH nhắn lại vào yêu cầu
// "Hoàn tất", trigger fn_tin_nhan_sau_insert tự chuyển nó về "Đang xử lý" để nhân viên trả lời tiếp.
export const yeuCauDaDong = q => ['resolved', 'cancelled', 'unresolvable'].includes(q.trang_thai);

export function hienThiTraoDoi(q) {
  if (yeuCauDaDong(q)) return `<div style="margin-top:14px"><b style="font-size:13px">Trao đổi</b><div style="max-height:260px;overflow:auto">${veTinNhanNhanVien(q)}</div><p style="font-size:12px;color:var(--steel);margin:8px 0 0">🔒 Yêu cầu đã đóng nên không nhắn thêm được. Nếu khách nhắn lại, yêu cầu sẽ tự mở lại để bạn trả lời.</p></div>`;
  return `<div style="margin-top:14px;border-top:1px solid var(--line-soft);padding-top:12px"><b style="font-size:13px">Trao đổi với khách hàng</b><div style="max-height:260px;overflow:auto;margin-top:6px">${veTinNhanNhanVien(q)}</div><textarea data-request-reply="${q.id}" rows="3" placeholder="Trả lời câu hỏi hoặc yêu cầu bổ sung thông tin..." style="margin-top:8px"></textarea><div style="display:flex;gap:8px;align-items:center;margin-top:7px"><input type="file" data-request-images="${q.id}" accept="image/jpeg,image/png,image/webp" multiple><button class="btn small" data-send-request-reply="${q.id}">Gửi phản hồi</button></div><p style="font-size:11px;color:var(--steel);margin:4px 0">Tối đa 3 ảnh, mỗi ảnh 5MB.</p></div>`;
}

const dangGuiPhanHoi = new Set();

export async function guiPhanHoiNhanVien(id) {
  if (dangGuiPhanHoi.has(id)) return;
  dangGuiPhanHoi.add(id);
  const button = document.querySelector(`[data-send-request-reply="${id}"]`);
  if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = 'Đang gửi...'; }
  try { await guiPhanHoiNhanVienMotLan(id); }
  finally {
    dangGuiPhanHoi.delete(id);
    const currentButton = document.querySelector(`[data-send-request-reply="${id}"]`);
    if (currentButton) { currentButton.disabled = false; currentButton.textContent = currentButton.dataset.originalText || 'Gửi phản hồi'; }
  }
}

async function guiPhanHoiNhanVienMotLan(id) {
  const q = duLieuTrang.quotes.find(x => x.id === id); if (!q) return;
  const text = document.querySelector(`[data-request-reply="${id}"]`)?.value.trim() || '';
  const files = document.querySelector(`[data-request-images="${id}"]`)?.files || [];
  if (!text && !files.length) { hienThongBaoNhanh('Hãy nhập phản hồi hoặc chọn ảnh.'); return; }
  let images=[];
  try {
    for (const file of Array.from(files).slice(0,3)) {
      if (!file.type.startsWith('image/')) throw new Error('Chỉ được tải ảnh.');
      if (file.size > 5*1024*1024) throw new Error('Mỗi ảnh tối đa 5MB.');
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
      const path=`${id}/staff-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const {error}=await nguCanh.supabase.storage.from('request-images').upload(path,file,{upsert:false,contentType:file.type});
      if(error) throw error;
      const {data}=nguCanh.supabase.storage.from('request-images').getPublicUrl(path);
      images.push({path,url:data.publicUrl,name:file.name});
    }
  } catch(e) { hienThongBaoNhanh('Không tải được ảnh: '+(e.message||e)); return; }
  const { error } = await nguCanh.supabase.from('tin_nhan_ho_tro').insert({
    yeu_cau_id:id, loai_nguoi_gui:'staff', nguoi_gui_id:nguCanh.staff.id,
    noi_dung:text || (images.length ? 'Đã gửi ảnh đính kèm.' : ''), tep_dinh_kem:images
  });
  if(error){
    const bi_chan = /row-level security/i.test(error.message);
    hienThongBaoNhanh(bi_chan ? 'Không gửi được: yêu cầu này đã đóng hoặc đang do nhân viên khác phụ trách.' : 'Không gửi được phản hồi: '+error.message);
    await taiYeuCau(); return;
  }
  hienThongBaoNhanh('✓ Đã gửi phản hồi cho khách'); await taiYeuCau();
}
