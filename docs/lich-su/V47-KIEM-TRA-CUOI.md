# V47 — Kiểm tra cuối (code + database)

## Code
- Escape HTML (`maHoaHtml`) cho ~70 chỗ chèn dữ liệu khách nhập vào `innerHTML` (chống XSS lưu trữ). Xóa hàm `esc` cục bộ trong `customer/js/chi-tiet.js`, dùng chung `maHoaHtml`.
- Tách `js/dung-chung/nhom-thoi-gian.js` (gom nhóm ngày/tuần/tháng) — trước đây chép nguyên ở `don-hang/tai-du-lieu.js` và `kho/tai-du-lieu.js`.
- CSS: xóa khối bảng yêu cầu 8 cột bị đè, gộp selector lặp (`#root`, `.header-actions`, `th/td:nth-child(6)`), xóa `.file-button`; sửa biến `--rust` chưa định nghĩa.
- Dashboard: khung biểu đồ cao cố định (`.chart-box`), lưới KPI tối đa 4 cột.
- Nhãn "Người xử lý" trong bảng yêu cầu cho xuống dòng, không đè nút "Xử lý".

## Database
- Đồng bộ `san_pham.so_luong_ton` theo `ton_kho` (6 sản phẩm lệch).
- Thu hồi `EXECUTE` của hàm trigger `dien_email_ho_so_nhan_vien`; thêm 5 index khóa ngoại.
- Siết chính sách ghi của khách (xem mục 8 trong `tu-dien-du-lieu.md`); trigger `guard_chi_tiet_khach` chặn thêm 4 cột.
- Giới hạn dung lượng/loại file 2 bucket ảnh; thu hẹp quyền 2 view thống kê.

## Còn mở (cần chủ dự án quyết định)
- Bật *Leaked password protection* trong Supabase Auth (không bật được bằng SQL).
- 6 đơn có `tong_tien` thấp hơn công thức đúng bằng `phi_van_chuyen` (30.000đ): xác nhận quy tắc hoàn phí ship khi trả hàng.
