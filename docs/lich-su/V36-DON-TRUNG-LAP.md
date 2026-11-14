# V36 — Rà soát trùng lặp và đường chuyển hướng

Kết quả rà soát: không có trang HTML mồ côi hay liên kết hỏng; cả 23 bảng DB đều được dùng; 4 hàm DB code web không gọi
(`is_staff`, `staff_role`, `la_quan_tri_hien_tai`, `compute_best_discount`) vẫn đang được policy/trigger dùng nên giữ.

Đã sửa:
- Xóa `cacTrangNhanVien` ở phía khách: là bản sao LỆCH của menu nhân viên, chỉ để lấy trang đầu tiên (luôn là dashboard). Nay `phien.js` trỏ thẳng `../staff/dashboard.html`.
- `giohang.js`: bỏ 4 hàm bọc trùng tên với `luu-gio-hang.js` (và 3 tên bí danh `...Cua`); gọi thẳng hàm dùng chung, truyền session.
- Toast: `giohang.js` bỏ bản `hienThongBaoNhanh` riêng, dùng bản ở `trang-chung.js`; `chi-tiet.js` bỏ state `toast` không bao giờ được gán.
  Thông báo trong trang Tài khoản đổi tên `hienThongBaoTrongTrang` để không trùng tên (nó là khung ok/lỗi lưu ở `actionMsg`).
- `chuyenDenDangNhap(trang)` thay cho 4 chỗ tự ghép `tai-khoan.html?next=...`.
- Bỏ `export` ở 7 hằng/hàm chỉ dùng nội bộ.

Chưa làm (xem docs/ban-do-du-an.md mục 5): gom quy trình đặt hàng 2 nơi, gộp CSS lặp.
