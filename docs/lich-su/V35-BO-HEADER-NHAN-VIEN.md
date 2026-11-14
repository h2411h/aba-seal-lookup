# V35 — Bỏ header ở khu nhân viên, tách hẳn nhân viên khỏi chức năng khách

## Giao diện
- Trang nhân viên không còn thanh header công khai (Trang chủ / Danh mục / Giỏ hàng / chuông / Tài khoản).
- Sidebar bên trái là điều hướng duy nhất: logo · thẻ người dùng · menu theo vai trò · đăng xuất (đáy).
  Màn hình hẹp: sidebar chuyển lên đầu trang, menu xếp thành hàng.
- Xóa: `#staffHeader` ở 10 trang HTML, `hienThiHeaderCongKhai` + `hienThiNutHeader` + chuông thông báo trong `nhan-vien-chung.js`,
  truy vấn `khach_hang` chỉ để vẽ avatar header, và khoảng 80 dòng CSS `!important` chừa chỗ cho header (`nhan-vien.css`, `chung.css`).
  Khung mới chỉ còn khoảng 40 dòng CSS dễ đọc (đầu `nhan-vien.css`).

## Chức năng
- Mới: `js/dung-chung/chan-nhan-vien.js`. Nhân viên đang làm mở trang khách (trừ trang Tài khoản) thì tự về `staff/dashboard.html`.
  Trang Tài khoản vẫn tự chuyển theo `customer/js/tai-khoan/phien.js` (không chặn để còn đăng nhập / đặt lại mật khẩu).
- Sửa lỗi cũ: `kiemTraNhanVien` coi nhân viên ĐÃ NGHỈ VIỆC là nhân viên, nên họ bị đẩy sang khu nhân viên rồi bị đẩy lại thành vòng lặp.
  Nay nhân viên đã nghỉ việc là khách thường (cùng quy tắc với guard mới).
- Chưa chặn ở DB: nếu cần cứng hơn có thể thêm trigger chặn nhân viên tạo `don_hang` kiểu khách.
