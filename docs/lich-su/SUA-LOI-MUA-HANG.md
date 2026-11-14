# Sửa lỗi mua hàng / giỏ hàng (nhân viên & tài khoản chưa có hồ sơ khách)

## Nguyên nhân
`don_hang.khach_hang_id` và `gio_hang.khach_hang_id` là khóa ngoại tới `khach_hang(id)`.
Hồ sơ `khach_hang` chỉ được tạo khi tự đăng ký (tai-khoan.js). Tài khoản nhân viên do admin duyệt
không có hồ sơ này -> "Thêm vào giỏ" không lưu lên server (lỗi bị bỏ qua) và "Mua ngay"/"Đặt hàng"
báo lỗi khóa ngoại. Ngoài ra giohang.js tạo hồ sơ khách SAU khi tạo đơn (sai thứ tự).

## Thay đổi
- frontend/js/dung-chung/dam-bao-khach-hang.js (MỚI): tạo hồ sơ khach_hang tối thiểu nếu chưa có.
- frontend/js/dung-chung/dong-bo-gio-hang.js: gọi damBaoCoKhachHang trước khi đồng bộ giỏ hàng lên server.
- frontend/js/pages/chi-tiet.js: gọi damBaoCoKhachHang trước khi tạo đơn; khi lỗi thêm dòng hàng thì
  HỦY đơn rỗng (update) thay vì delete() (khách không có quyền xóa đơn; delete luôn thất bại).
- frontend/js/pages/giohang.js: như trên; bỏ nhánh insert khach_hang đặt sau đơn.

Không thay đổi CSDL trong bản vá này.
