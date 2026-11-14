# Từ điển dữ liệu — Hệ thống tra cứu & quy đổi mã sản phẩm tương đương (Công ty TNHH Kỹ thuật ABA)

> Khớp với cơ sở dữ liệu Supabase thật (project **Aba s2**), cập nhật 31/10/2026. Tên bảng/cột đều là tiếng Việt không dấu.
> Cột kiểu `id`, `ngay_tao` có ở hầu hết các bảng nên không nhắc lại. Các giá trị trạng thái lưu bằng tiếng Anh
> (`pending`, `completed`...) và được đổi sang tiếng Việt khi hiển thị trên giao diện.

## 1. Sản phẩm & quy đổi tương đương (tính năng cốt lõi)

| Bảng | Dùng để làm gì | Cột chính |
|---|---|---|
| `loai_san_pham` | Loại hình dáng của từng hãng theo catalogue (VD: NOK – ISI) | `hang_san_xuat`, `ma_loai`, `nhom_san_pham` (`oil_seal` phớt dầu / `packing` gioăng-phớt ben), `mo_ta` |
| `quy_doi_tuong_duong` | Hai loại hình dáng của hai hãng tương đương nhau (tra hai chiều) | `loai_a_id`, `loai_b_id`, `nguon` (nguồn catalogue) |
| `san_pham` | Danh mục sản phẩm đang phân phối | `ma_san_pham`, `loai_san_pham_id`, `duong_kinh_trong/ngoai`, `do_day` (mm), `vat_lieu`, `hang_san_xuat`, `gia_le_vnd`, `so_luong_ton` (tự cộng từ `ton_kho`), `dang_hoat_dong`, `thu_tu_hien_thi`, `url_anh`, `ghi_chu`, `don_vi_tinh`, `khoa_gia_thu_cong` |
| `gia_von_san_pham` | Giá vốn bình quân (nội bộ, chỉ kho/admin đọc) | `san_pham_id`, `gia_von_binh_quan_vnd` |

Cách quy đổi: sản phẩm gốc → `loai_san_pham_id` → `quy_doi_tuong_duong` ra các loại tương đương → lọc sản phẩm thuộc các loại đó
có 3 kích thước chênh lệch không quá 0,5 mm. Sản phẩm **chưa gán `loai_san_pham_id` sẽ không tham gia quy đổi**.

## 2. Kho hàng

| Bảng | Dùng để làm gì | Cột chính |
|---|---|---|
| `kho` | Danh sách kho vật lý | `ten`, `dia_chi`, `dang_hoat_dong` |
| `ton_kho` | Tồn của từng sản phẩm tại từng kho (duy nhất theo cặp `san_pham_id` + `kho_id`) | `so_luong` |
| `giao_dich_kho` | Mọi lần nhập/xuất/điều chuyển. **Chỉ INSERT**; trigger tự cập nhật `ton_kho`, `san_pham.so_luong_ton` và giá vốn | `so_phieu` (số phiếu nhập tự sinh PN-ngày-số thứ tự, chỉ có ở phiếu nhập), `loai_giao_dich` (`import`, `export`, `transfer_in`, `transfer_out`, `customer_return`, `disposal`), `so_luong`, `don_gia_von`, `ghi_chu_tham_chieu`, `nguoi_tao` |
| `hang_cho_ve_kho` | Hàng khách từ chối nhận, đang chờ nhập lại kho (RPC `nhan_hang_ve_kho`) | `don_hang_id`, `chi_tiet_don_hang_id`, `so_luong`, `trang_thai` (`pending`/`received`) |

## 3. Khách hàng & bán hàng

| Bảng | Dùng để làm gì | Cột chính |
|---|---|---|
| `khach_hang` | Hồ sơ khách (`id` = tài khoản đăng nhập) | `ma_khach_hang` (KH0001...), `ho_ten`, `so_dien_thoai`, `email`, `ten_cong_ty`, `dia_chi_mac_dinh`, `url_anh_dai_dien`, `ghi_chu` |
| `gio_hang` | Giỏ hàng đồng bộ lên máy chủ | `khach_hang_id`, `san_pham_id`, `so_luong`, `gia_tai_thoi_diem` |
| `don_hang` | Đơn đặt hàng | `trang_thai`, `tien_hang` (tạm tính), `tien_giam_gia`, `tien_chiet_khau_so_luong`, `thue_suat`, `tien_thue`, `phi_van_chuyen`, `tong_tien`, người nhận + địa chỉ giao, thông tin hủy |
| `chi_tiet_don_hang` | Từng dòng hàng của đơn | `san_pham_id`, `so_luong`, `don_gia`, `trang_thai_giao_hang`, `so_luong_da_giao`, `phan_tram_chiet_khau` |
| `lich_su_don_hang` | Mỗi lần đổi trạng thái đơn (trigger tự ghi) | `don_hang_id`, `trang_thai`, `nguoi_thay_doi` |
| `yeu_cau_tra_hang` | Khách xin đổi/trả hàng lỗi | `chi_tiet_don_hang_id`, `so_luong`, `ly_do`, `trang_thai` |
| `thong_bao` | Thông báo cho khách (xem ở trang Tài khoản) | `khach_hang_id`, `noi_dung_thong_bao`, `duong_dan`, `da_doc` |
| `quy_tac_chiet_khau` | Chiết khấu theo số lượng/giá trị đơn (admin cấu hình, hàm `compute_best_discount` chọn mức tốt nhất) | `so_luong_toi_thieu`, `gia_tri_don_toi_thieu`, `phan_tram_chiet_khau`, `pham_vi` (`all`/`product_type`/`products`), ngày hiệu lực |

Công thức tổng tiền: `tong_tien = tien_hang − tien_giam_gia − tien_chiet_khau_so_luong + tien_thue + phi_van_chuyen`.
(Riêng đơn giao một phần, `tong_tien` được tính lại theo phần hàng khách đã nhận.)

## 4. Yêu cầu hỗ trợ / báo giá

| Bảng | Dùng để làm gì | Cột chính |
|---|---|---|
| `yeu_cau_bao_gia` | Yêu cầu khách gửi (hỏi sản phẩm, tư vấn, bảo hành, khiếu nại...) | `loai_yeu_cau`, `trang_thai` (`new`, `processing`, `resolved`, `cancelled` — giao diện chỉ dùng 4 giá trị này), `nguoi_xu_ly`, `du_lieu_loai` (jsonb), `khach_hang_id`, các cột `tin_nhan_cuoi_*` / `*_doc_luc` phục vụ chấm "chưa đọc" |
| `chi_tiet_yeu_cau_bao_gia` | Sản phẩm trong yêu cầu | `san_pham_id`, `so_luong`, `don_gia`, `phan_tram_chiet_khau`, `gia_sau_chiet_khau` (cột tự tính) |
| `tin_nhan_ho_tro` | Khung chat trong từng yêu cầu | `yeu_cau_id`, `loai_nguoi_gui` (`customer`/`staff`/`system`), `noi_dung`, `tep_dinh_kem` |

## 5. Nhân sự & phân quyền

| Bảng | Dùng để làm gì | Cột chính |
|---|---|---|
| `ho_so_nhan_vien` | Hồ sơ nhân viên (`id` = tài khoản đăng nhập) | `ho_ten`, `email` (tự điền từ `auth.users` bằng trigger), `vai_tro` (`sales`/`warehouse`/`admin`), `dang_lam_viec` |
| `yeu_cau_dang_ky_nhan_vien` | Người xin làm nhân viên, chờ admin duyệt | `tai_khoan_id`, `vai_tro_de_xuat`, `trang_thai` (`pending`/`approved`/`rejected`), `nguoi_duyet` |

## 6. View & hàm

- View `v_customer_stats`: thống kê khách (tổng đơn, doanh thu...) cho trang Khách hàng.
- View `customer_refusal_stats` (cảnh báo khách hay hủy/từ chối nhận hàng): mỗi khách 1 dòng, **2 cột đếm theo đơn** — `problem_orders_last_7d` (7 ngày qua) và `problem_orders_this_month` (tháng này). Một đơn là "có vấn đề" khi: khách tự hủy, **hoặc** nhân viên hủy với 1 trong 3 lý do do khách ("Khách hàng yêu cầu hủy", "Khách hàng không xác nhận", "Không thể liên hệ khách hàng"), **hoặc** khách từ chối nhận ít nhất 1 dòng hàng. Đơn nhân viên hủy vì lý do khác không tính. Ngưỡng cảnh báo (quá 3 đơn/7 ngày hoặc quá 6 đơn/tháng) nằm ở `staff/js/don-hang/hang-so.js`.
- Cả 2 view dùng `security_invoker` (áp dụng RLS bảng gốc); chỉ `authenticated` được `SELECT`, `anon` không có quyền.
- Hàm cho phân quyền RLS: `is_staff()`, `staff_role()`, `la_quan_tri_hien_tai()`.
- Hàm website gọi trực tiếp (RPC): `tao_yeu_cau_ho_tro`, `nhan_hang_ve_kho`, `receive_return_request`.
- Các hàm còn lại là **trigger** (tự chạy khi ghi dữ liệu): trừ/cộng kho, ghi lịch sử đơn, kiểm tồn khi đặt hàng, chặn khách sửa tiền, tính lại tổng đơn...

## 7. Storage

Chỉ có 2 bucket (đều công khai để hiển thị ảnh), **server tự giới hạn 5 MB/file** — không chỉ kiểm ở trình duyệt:

| Bucket | Ai tải lên | Loại file cho phép |
|---|---|---|
| `product-images` | Nhân viên | jpeg, png, webp, gif |
| `request-images` | Mọi tài khoản đăng nhập | jpeg, png, webp |

## 8. Quyền ghi của khách / vãng lai (đã siết ở V47)

Khách chỉ ghi được những gì dưới đây; mọi cột "tiền" và "trạng thái" do server quyết định:

- **Đơn hàng / dòng đơn**: trigger `guard_don_hang_khach`, `guard_chi_tiet_khach` ghi đè giá, chiết khấu, tổng tiền và chặn sửa `so_luong_da_giao`, `ly_do_tu_choi`, `ngay_tu_choi`, `trang_thai_giao_hang`. Khách chỉ được hủy đơn.
- **Chi tiết báo giá** (`chi_tiet_yeu_cau_bao_gia`): khách/vãng lai chỉ thêm được dòng **không kèm giá**, số lượng 1–1000, vào yêu cầu `new` do chính họ tạo trong 2 giờ (hàm `private.cho_phep_them_dong_bao_gia`, schema `private` không lộ qua API). Nhân viên thêm dòng có giá như bình thường.
- **Đăng ký nhân viên**: chỉ tạo được với `trang_thai = 'pending'`, chưa có `nguoi_duyet`/`ngay_duyet`.
- **Yêu cầu trả hàng do khách tạo**: bắt buộc `pending`, chưa có người xử lý, và thuộc đơn của chính khách.
- Quyền `TRUNCATE`, `REFERENCES`, `TRIGGER` đã thu hồi khỏi `anon`/`authenticated` trên mọi bảng.

## 9. Quy ước dùng chung toàn website (mỗi thứ chỉ định nghĩa ở MỘT nơi)

| Quy ước | File duy nhất | Nội dung |
|---|---|---|
| Tồn kho | `js/dung-chung/ton-kho.js` | Hết hàng: ≤ 0 · Sắp hết: 1 → dưới `NGUONG_SAP_HET` (= 30) · Cần nhập: hết + sắp hết. Dùng cho Dashboard, Sản phẩm, Kho, Thông báo, số đỏ thanh bên và nhãn "sắp hết" ở trang khách. |
| Trạng thái đơn hàng | `js/dung-chung/trang-thai-don.js` | 7 trạng thái và tên hiển thị, dùng cho cả khách lẫn nhân viên. |
| Loại yêu cầu | `js/dung-chung/loai-yeu-cau.js` | 4 loại đang dùng + các loại "(cũ)". |
| Định dạng tiền | `js/dung-chung/dinh-dang.js` → `dinhDangTien()` | Luôn dạng `1.234.567₫`. |
| Công thức tổng đơn | | `tổng = tiền hàng − giảm giá − chiết khấu + thuế VAT 10% + phí vận chuyển`. Phí ship: 30.000₫, miễn phí từ 500.000₫. Giống nhau ở `tinh-chiet-khau.js` (web) và `recalc_don_hang_khach`, `receive_return_request` (database). |

