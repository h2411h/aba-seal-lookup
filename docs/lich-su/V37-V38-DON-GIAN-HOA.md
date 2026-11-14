# V37–V38 — dọn lần cuối trước khi học

Frontend
- Giờ làm việc ở giỏ hàng / Mua ngay: bỏ hàm tính giờ (`trangThaiGioLamViec`, `dinhDangLanMoCuaTiep`) và việc tự ghi chú "đặt ngoài giờ" vào đơn; chỉ còn một dòng thông báo cố định (`hienThiThongBaoGioLamViec`).
- Bỏ chuông thông báo ở header (`huy-hieu-thong-bao.js`, 2 hàm trong `dau-trang.js`, ~100 dòng CSS). Thông báo xem ở trang Tài khoản.
- Gộp luồng đặt hàng: `taoDonHang()` (file mới `js/dung-chung/tao-don-hang.js`) + `tinhTongDonHang()` / `THUE_SUAT_MAC_DINH` trong `tinh-chiet-khau.js`. Hết viết cứng thuế `10` ở trang Chi tiết.
- Sửa lỗi có sẵn: `customer/js/tai-khoan/phien.js` gọi `hienThongBaoNhanh` chưa import (thông báo realtime khi đơn đổi trạng thái sẽ lỗi) -> dùng `hienThongBaoTrongTrang`.
- Xóa CSS không dùng: `.badge.paid`, `.trans-page-size`.

Database (project "Aba s2", migration `xoa_cot_khong_dung`)
- Xóa 11 cột không code nào dùng và không chứa thông tin: `khach_hang` (`dia_chi_cong_ty`, `dieu_khoan_thanh_toan`, `dieu_khoan_van_chuyen`, `ma_so_thue`, `nguoi_lien_he`, `nhom_khach_hang`, `so_tien_cong_no`, `loai_khach_hang`), `san_pham` (`noi_bat`, `vi_tri_ke`), `giao_dich_kho` (`nhom_dieu_chuyen_id`).
- Cố ý GIỮ các cột không code nào đọc nhưng đang có dữ liệu thật: `san_pham.gia_si_usd/gia_si_vnd`, `loai_san_pham.mo_ta`, `quy_doi_tuong_duong.nguon`, `yeu_cau_bao_gia.ghi_chu_xu_ly`, `chi_tiet_yeu_cau_bao_gia.gia_sau_chiet_khau`, `gio_hang.ngay_them`, `khach_hang.url_anh_dai_dien`.
