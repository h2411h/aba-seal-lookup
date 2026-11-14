# V34 — Đơn giản hóa để dễ học và dễ giải thích

## 1. Dọn phần thừa trong DB (đã chạy trên Supabase project "Aba s2")
```sql
drop function if exists public.danh_dau_da_doc_ho_tro(uuid);
drop function if exists public.doi_trang_thai_ho_tro(uuid, text, text);
drop table if exists public.nhat_ky_thao_tac;
```
Còn 3 bucket không dùng (`avatars`, `imports`, `site-images`): xóa tay trong Dashboard → Storage.

## 2. Phân quyền: từ "4 chức vụ" về 3 vai trò
Trước: Admin gốc > Quản trị viên > Thủ kho / Kinh doanh (phân biệt bằng cờ `la_admin_goc`).
Sau: chỉ `admin` / `warehouse` / `sales`. Luật duy nhất: chỉ admin quản lý nhân sự; không ai tự đổi vai trò,
tự cho nghỉ hay tự xóa chính mình (nên luôn còn ít nhất 1 admin).
```sql
create or replace function public.bao_ve_phan_quyen() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if not public.la_quan_tri_hien_tai() then raise exception 'Không đủ quyền'; end if;
  if tg_op = 'DELETE' then
    if old.id = auth.uid() then raise exception 'Không thể tự xoá chính mình'; end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if (new.vai_tro is distinct from old.vai_tro or new.dang_lam_viec is distinct from old.dang_lam_viec)
       and old.id = auth.uid() then
      raise exception 'Không thể tự đổi vai trò / trạng thái của chính mình';
    end if;
    return new;
  end if;
  return new;
end $function$;
drop function if exists public.la_admin_goc_hien_tai();
alter table public.ho_so_nhan_vien drop column if exists la_admin_goc;
```
Code: bỏ `laAdminGoc`, `nhanChucVu`, tùy chọn `requireOwner`, lọc "Admin" và lớp màu `.pq-admin`.

## 3. Giỏ hàng: một nơi duy nhất
Trước: `danh-muc.js`, `chi-tiet.js`, `giohang.js`, `tai-khoan/don-hang.js` mỗi nơi tự viết lại hàm giỏ hàng.
Sau: mọi logic ở `js/dung-chung/luu-gio-hang.js` (`themVaoGioHang`, `luuGioHang`, `taoDongGioHang`,
`capNhatSoGioHangTrenMenu`); các trang chỉ gọi lại. `danh-muc.js` dùng luôn `hienThongBaoNhanh` thay vì tự viết `pageToast`.
