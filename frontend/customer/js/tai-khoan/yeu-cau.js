/* ==========================================================================
   MỤC LỤC HÀM — customer/js/tai-khoan/yeu-cau.js   (Ctrl+F tên hàm để nhảy tới nơi định nghĩa)
   ★ = hàm cốt lõi hay bị hỏi. Mô tả chỉ để tra nhanh; số dòng không ghi để khỏi bị lệch.
   --------------------------------------------------------------------------
   hienThiTrang(...a)                  — Hàm ủy quyền sang hanhDong.hienThiTrang (tránh import vòng)
   mauChamTrangThaiYeuCau(trang_thai)  — Màu chấm cho trạng thái yêu cầu (gom về 3 màu)
   hienThiYeuCauCuaToi()               [export]  — Vẽ danh sách yêu cầu hỗ trợ/báo giá của khách
   tinNhanYeuCau(q)                    — Lấy danh sách tin nhắn của 1 yêu cầu
   taiTinNhanYeuCau(id)                [export async]  — Tải tin nhắn của yêu cầu từ bảng tin_nhan_ho_tro
   veTinNhanYeuCau(m)                  — Vẽ 1 tin nhắn (kèm ảnh nếu có)
   guiTinNhanTiep(id)                  [export async]  — Khách gửi tin nhắn tiếp vào yêu cầu (có chặn bấm đúp bằng Set)
   guiTinNhanTiepMotLan(id)            [async]  — Phần gửi tin thật sự của guiTinNhanTiep
   hienThiHopChiTietYeuCau()           [export]  — Vẽ hộp thoại chi tiết 1 yêu cầu và khung chat
   taiYeuCauCuaToi()                   [export async]  — Tải các yêu cầu của khách từ bảng yeu_cau_bao_gia
   ========================================================================== */
// Yêu cầu của tôi (báo giá/bảo hành/tư vấn...): danh sách, chi tiết, tin nhắn và gửi phản hồi.
import { supabase, duLieuTrang, hanhDong } from "./du-lieu-trang.js";
import { maHoaHtml } from "../../../js/dung-chung/dinh-dang.js";
import { NHAN_LOAI_YEU_CAU } from "../../../js/dung-chung/loai-yeu-cau.js";
const hienThiTrang = (...a) => hanhDong.hienThiTrang(...a); // hienThiTrang nằm ở module khác; gọi qua actions để tránh import vòng

const NHAN_TRANG_THAI_YEU_CAU = { new:'Mới gửi', processing:'Đang xử lý', resolved:'Hoàn tất', cancelled:'Đã hủy', waiting_response:'Đang xử lý', responded:'Đang xử lý', unresolvable:'Đã hủy' };

// Trạng thái yêu cầu vẫn giữ đủ 7 nhãn gốc (không đổi nghiệp vụ) — chỉ rút gọn về 3 màu để dễ quét
// mắt hơn: xanh lá = đã xong, đỏ = đã hủy/không xử lý được, amber = mọi trạng thái đang diễn ra.
function mauChamTrangThaiYeuCau(trang_thai) {
  if (trang_thai === 'resolved') return 'var(--ok)';
  if (trang_thai === 'cancelled' || trang_thai === 'unresolvable') return 'var(--danger)';
  return 'var(--amber)';
}

export function hienThiYeuCauCuaToi() {
  if (duLieuTrang.myRequests.length === 0) return "";
  const showAll = duLieuTrang.myRequestsExpanded;
  const list = showAll ? duLieuTrang.myRequests : duLieuTrang.myRequests.slice(0, 3);
  return `
    <div class="acc-list-title"><p>📋 Yêu cầu hỗ trợ</p></div>
    <div style="max-height:${showAll ? '420px' : 'none'};overflow-y:${showAll ? 'auto' : 'visible'}">
      ${list.map(q => `
        <div data-request-detail="${q.id}" class="acc-req-item" title="Bấm để xem chi tiết">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <span>${NHAN_LOAI_YEU_CAU[q.loai_yeu_cau] || q.loai_yeu_cau}</span>
            <span style="font-size:11px;font-weight:700;color:var(--graphite)"><span class="acc-req-status-dot" style="background:${mauChamTrangThaiYeuCau(q.trang_thai)}"></span>${NHAN_TRANG_THAI_YEU_CAU[q.trang_thai] || q.trang_thai}</span>
          </div>
          <p class="acc-req-title">${maHoaHtml(q.ghi_chu) || ''}</p>
          <div class="acc-req-meta">
            <span class="acc-req-time">${new Date(q.ngay_tao).toLocaleDateString("vi-VN")}</span>
            <span style="font-size:11px;color:var(--blueprint);font-weight:700">Xem chi tiết →${q.ket_qua_xu_ly ? ' · Đã có phản hồi' : ''}</span>
          </div>
        </div>`).join("")}
    </div>
    ${duLieuTrang.myRequests.length > 3 ? `<p class="gh-clear-link" id="btnToggleRequests" style="margin:10px 0 0;text-align:center">${showAll ? 'Thu gọn ▲' : `Xem tất cả (${duLieuTrang.myRequests.length}) ▼`}</p>` : ''}
  `;
}

// Modal chi tiết 1 yêu cầu — chữ to, rõ ràng, dễ đọc hơn khung nhỏ trong danh sách (đặc biệt hữu ích
// khi nội dung phản hồi dài hoặc người dùng khó đọc chữ nhỏ).
function tinNhanYeuCau(q) {
  const td = q.du_lieu_loai || {};
  const saved = (duLieuTrang.requestMessagesCache[q.id] || []).map(m => ({
    role:m.loai_nguoi_gui === 'staff' ? 'staff' : 'customer', text:m.noi_dung,
    images:Array.isArray(m.tep_dinh_kem) ? m.tep_dinh_kem : [], created_at:m.ngay_tao
  }));
  const legacy = Array.isArray(td.messages) ? [...td.messages] : [];
  if (!legacy.length) {
    // Yêu cầu mới: tin đầu tiên đã nằm trong tin_nhan_ho_tro (do RPC tạo) -> không dựng thêm từ ghi_chu để tránh lặp.
    const ghiChu = (q.ghi_chu || '').trim();
    const daCoTinDau = saved.some(m => m.role === 'customer' && (m.text || '').trim() === ghiChu);
    if (!daCoTinDau) legacy.push({ role:'customer', text:q.ghi_chu || '', created_at:q.ngay_tao });
    if (q.ket_qua_xu_ly && !saved.some(m => m.role === 'staff' && (m.text || '').trim() === q.ket_qua_xu_ly.trim())) legacy.push({ role:'staff', text:q.ket_qua_xu_ly, created_at:q.ngay_xu_ly_xong });
  }
  return [...legacy, ...saved];
}

export async function taiTinNhanYeuCau(id) {
  const { data, error } = await supabase.from('tin_nhan_ho_tro').select('*').eq('yeu_cau_id', id).order('ngay_tao', { ascending:true });
  if (error) { console.error('Không tải được tin nhắn hỗ trợ:', error.message); return; }
  duLieuTrang.requestMessagesCache[id] = data || [];
}

function veTinNhanYeuCau(m) {
  const customer = m.role === 'customer';
  const imgs = (m.images || []).map(x => `<a href="${x.url}" target="_blank" rel="noopener"><img src="${x.url}" alt="Ảnh minh họa" style="max-width:180px;max-height:140px;object-fit:cover;border-radius:7px;margin:6px 6px 0 0;border:1px solid var(--line-soft)"></a>`).join('');
  return `<div style="padding:10px 12px;margin:8px 0;border-radius:8px;background:${customer?'#f7f8fa':'#f0f9f4'};border:1px solid var(--line-soft)">
    <b style="font-size:12px">${customer?'Bạn':'ABA'}</b><span style="float:right;font-size:10.5px;color:var(--steel)">${m.created_at ? new Date(m.created_at).toLocaleString('vi-VN') : ''}</span>
    <div style="font-size:14px;line-height:1.55;margin-top:5px;white-space:pre-wrap">${maHoaHtml(m.text || '')}</div>${imgs ? `<div>${imgs}</div>` : ''}
  </div>`;
}

const dangGuiTinNhanTiepKhach = new Set();

export async function guiTinNhanTiep(id) {
  if (dangGuiTinNhanTiepKhach.has(id)) return;
  dangGuiTinNhanTiepKhach.add(id);
  const button = document.getElementById('btnRequestFollowup');
  if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = 'Đang gửi...'; }
  try { await guiTinNhanTiepMotLan(id); }
  finally {
    dangGuiTinNhanTiepKhach.delete(id);
    const currentButton = document.getElementById('btnRequestFollowup');
    if (currentButton) { currentButton.disabled = false; currentButton.textContent = currentButton.dataset.originalText || 'Gửi phản hồi'; }
  }
}

async function guiTinNhanTiepMotLan(id) {
  const q = duLieuTrang.myRequests.find(x => x.id === id); if (!q || !duLieuTrang.session) return;
  const input = document.getElementById('requestFollowupText');
  const files = document.getElementById('requestFollowupImages')?.files || [];
  const text = input?.value.trim() || '';
  if (!text && !files.length) { alert('Hãy nhập nội dung hoặc chọn ảnh.'); return; }
  const td = q.du_lieu_loai || {};
  const messages = Array.isArray(td.messages) ? [...td.messages] : [];
  if (!messages.length && q.ghi_chu) messages.push({ role:'customer', text:q.ghi_chu, created_at:q.ngay_tao });
  let images = [];
  try {
    for (const file of Array.from(files).slice(0,3)) {
      if (!file.type.startsWith('image/')) throw new Error('Chỉ được tải ảnh.');
      if (file.size > 5*1024*1024) throw new Error('Mỗi ảnh tối đa 5MB.');
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
      const path=`${id}/customer-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const {error}=await supabase.storage.from('request-images').upload(path,file,{upsert:false,contentType:file.type});
      if(error) throw error;
      const {data}=supabase.storage.from('request-images').getPublicUrl(path);
      images.push({path,url:data.publicUrl,name:file.name});
    }
  } catch(e) { alert('Không tải được ảnh: '+(e.message||e)); return; }
  const { data: inserted, error } = await supabase.from('tin_nhan_ho_tro').insert({
    yeu_cau_id:id, loai_nguoi_gui:'customer', nguoi_gui_id:duLieuTrang.session.user.id,
    noi_dung:text || (images.length ? 'Đã gửi ảnh đính kèm.' : ''), tep_dinh_kem:images
  }).select('*').single();
  if(error){alert('Không gửi được tin nhắn: '+error.message);return;}
  duLieuTrang.requestMessagesCache[id] = [...(duLieuTrang.requestMessagesCache[id] || []), inserted];
  duLieuTrang.myRequestDetailId=id;
  await taiYeuCauCuaToi();
}

export function hienThiHopChiTietYeuCau() {
  const q = duLieuTrang.myRequests.find(x => x.id === duLieuTrang.myRequestDetailId); if (!q) return '';
  const messages = tinNhanYeuCau(q);
  return `<div class="modal-bg" id="requestDetailBg"><div class="modal" style="max-width:600px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h2 style="font-size:18px;margin:0">${NHAN_LOAI_YEU_CAU[q.loai_yeu_cau]||q.loai_yeu_cau}</h2><span>${NHAN_TRANG_THAI_YEU_CAU[q.trang_thai]||q.trang_thai}</span></div>
    <p style="font-size:11.5px;color:var(--steel);margin:0 0 10px">Yêu cầu tạo ${new Date(q.ngay_tao).toLocaleString('vi-VN')}</p>
    <div style="max-height:330px;overflow:auto">${messages.map(veTinNhanYeuCau).join('')}</div>
    ${q.trang_thai !== 'cancelled' ? `<div style="margin-top:12px;border-top:1px solid var(--line-soft);padding-top:12px"><label class="field-label">Trao đổi thêm</label><textarea id="requestFollowupText" rows="3" placeholder="Nếu vấn đề chưa được giải quyết, hãy hỏi thêm tại đây..."></textarea><div style="margin-top:8px"><input id="requestFollowupImages" type="file" accept="image/jpeg,image/png,image/webp" multiple><p style="font-size:11px;color:var(--steel);margin:4px 0">Có thể gửi tối đa 3 ảnh, mỗi ảnh tối đa 5MB.</p></div><button class="btn" id="btnRequestFollowup">Gửi trao đổi</button></div>`:''}
    <div style="text-align:right;margin-top:10px"><button class="btn ghost" id="closeRequestDetail">Đóng</button></div>
  </div></div>`;
}

export async function taiYeuCauCuaToi() {
  if (!duLieuTrang.session) return;
  const { data, error } = await supabase.from("yeu_cau_bao_gia").select("*").eq("khach_hang_id", duLieuTrang.session.user.id).order("ngay_tao", { ascending: false }).limit(20);
  if (error) console.error('Không tải được yêu cầu hỗ trợ:', error.message);
  duLieuTrang.myRequests = data || [];
  if (duLieuTrang.myRequestDetailId && duLieuTrang.myRequests.some(q => q.id === duLieuTrang.myRequestDetailId)) await taiTinNhanYeuCau(duLieuTrang.myRequestDetailId);
  hienThiTrang();
}
