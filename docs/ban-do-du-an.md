# Bản đồ dự án ABA — đọc 10 phút là nắm

## 1. Dự án chạy thế nào (3 ý)

1. **Không có server riêng.** Trình duyệt (HTML/CSS/JS thuần) nói chuyện thẳng với **Supabase** (PostgreSQL + đăng nhập).
2. **Việc "khó" do database làm.** Trừ kho, tính giá vốn, ghi lịch sử, tạo thông báo đều là *trigger* trong DB. JS chỉ ghi dữ liệu vào, DB tự tính phần còn lại.
3. **Ai được làm gì do database chặn** (Row Level Security — RLS). Ẩn nút ở giao diện chỉ để cho đẹp, việc chặn thật nằm ở DB.

Hai khu vực:

| Khu vực | Ai dùng | Cửa vào |
|---|---|---|
| `customer/` + `index.html` | Khách | Trang chủ |
| `staff/` | Nhân viên (Kinh doanh, Thủ kho, Quản trị) | **Chỉ đăng nhập ở `customer/tai-khoan.html`**, đúng quyền thì tự vào `staff/` |

## 2. Các trang

| Trang | Làm gì | Bảng chính |
|---|---|---|
| danh-muc, chi-tiet | Tra cứu sản phẩm, xem mã tương đương, thêm giỏ | `san_pham`, `quy_doi_tuong_duong`, `gio_hang` |
| giohang | Đặt hàng | `don_hang`, `chi_tiet_don_hang` |
| lien-he, tai-khoan | Hỏi đáp/hỗ trợ, đơn của tôi, đăng nhập | `tin_nhan_ho_tro`, `yeu_cau_bao_gia`, `khach_hang` |
| staff/dashboard | Tổng quan theo vai trò | nhiều bảng (chỉ đọc) |
| staff/don-hang | Duyệt đơn, giao hàng, nhận hàng trả về | `don_hang`, `lich_su_don_hang`, `yeu_cau_tra_hang` |
| staff/kho | Nhập/xuất kho, tồn kho, giá vốn | `giao_dich_kho` → `ton_kho`, `gia_von_san_pham` |
| staff/han-luu-kho | Hàng tồn lâu, tiêu hủy | `giao_dich_kho`, `gia_von_san_pham` |
| staff/san-pham, chiet-khau | Giá bán, quy tắc chiết khấu số lượng | `san_pham`, `quy_tac_chiet_khau` |
| staff/bao-gia (Yêu cầu khách hàng) | Trả lời báo giá, hỗ trợ | `yeu_cau_bao_gia`, `tin_nhan_ho_tro` |
| staff/khach-hang, phan-quyen | Xem khách; duyệt/đổi quyền nhân viên | `khach_hang`, `ho_so_nhan_vien` |
| staff/thong-bao | Việc đang chờ xử lý | đọc các bảng ở trên |

Ghi chú: trang nhân viên nào cũng đọc thêm ~8 bảng vì thanh bên hiện **số đỏ** (đơn chờ, hàng sắp hết...). Đó là hàm `layHuyHieuThanhBen` trong `staff/nhan-vien-chung.js`, không phải trang đó cần các bảng đấy.

## 3. Kho — phần giáo viên hay hỏi nhất

**Quy tắc vàng:** mọi thay đổi số lượng kho đều là *một dòng mới* trong `giao_dich_kho` (sổ cái, không sửa, không xóa). Trigger `apply_inventory_transaction` tự cập nhật `ton_kho` và `gia_von_san_pham`.

- **Nhập:** cộng số lượng, tính lại **giá vốn bình quân** = (giá cũ × tồn cũ + giá nhập × SL nhập) ÷ tổng SL.
- **Xuất:** chỉ trừ số lượng, giá vốn bình quân **giữ nguyên**. Lịch sử có ghi thêm giá vốn lúc xuất để biết giá trị hàng rời kho.
- **Số phiếu nhập** (`PN-20261101-001`) do trang web tự sinh: lấy số lớn nhất hôm nay + 1.

| Tình huống | Cách ghi |
|---|---|
| Nhập hàng từ nhà cung cấp | Nhập kho → *Nhập hàng mua* (cần giá) |
| Hàng hỏng, tự bỏ | Xuất kho → Hàng hỏng / lỗi |
| Đếm thấy ít hơn hệ thống | Xuất kho → Hao hụt / kiểm kê thiếu |
| Gửi mẫu, biếu tặng | Xuất kho → Xuất mẫu / biếu tặng |
| Gửi hàng lỗi về nhà cung cấp | Xuất kho → Trả nhà cung cấp |
| Nhập ghi **dư** (100 → 110) | Xuất kho → Điều chỉnh nhập nhầm |
| Nhập ghi **thiếu** (100 → 90) hoặc kiểm kê **thừa** | Nhập kho → *Điều chỉnh tăng* (tự lấy giá vốn) |
| Bán cho khách | **Không dùng form kho**; tạo đơn ở trang Đơn hàng, DB tự trừ kho |

Cách nhớ: kho **nhiều hơn** thực tế thì **xuất**; kho **ít hơn** thực tế thì **nhập (điều chỉnh tăng)**. Không sửa, không xóa giao dịch cũ — chỉ thêm giao dịch điều chỉnh, để còn dấu vết kiểm tra.

Giới hạn nên nói thẳng: hệ thống chưa có sổ công nợ/hoàn tiền nhà cung cấp, và phiếu trả hàng chưa nối tự động với phiếu nhận lô thay (chỉ nối qua ghi chú).

## 4. Trigger trong database (17 trigger, 22 hàm)

Chỉ cần nhớ nhóm, không cần thuộc từng hàm:

| Nhóm | Hàm | Việc |
|---|---|---|
| Kho | `apply_inventory_transaction` | Mỗi dòng `giao_dich_kho` → cập nhật tồn + giá vốn |
| Đơn hàng | `check_stock_before_order_item`, `handle_order_stock_on_status_change`, `recalc_don_hang_khach`, `fn_log_order_status_change` | Kiểm tra tồn khi đặt, trừ/hoàn kho khi đổi trạng thái, tính lại tổng tiền, ghi lịch sử trạng thái |
| Thông báo | `notify_cart_price_drop`, `notify_quote_response`, `fn_tin_nhan_*` | Tạo thông báo cho khách |
| Phân quyền | `bao_ve_phan_quyen`, `guard_don_hang_khach`, `guard_chi_tiet_khach`, `staff_role`, `is_staff` | Chặn sửa quyền/đơn trái phép |
| Tiện ích | `sync_selling_price`, `autofill_customer_email`, `dien_email_ho_so_nhan_vien` | Đồng bộ giá bán, tự điền email |

(Tên hàm ở nhóm Đơn hàng/Thông báo/Phân quyền là mô tả theo tên và cách dùng; trước khi bảo vệ nên mở thân hàm trong Supabase → Database → Functions để chắc chắn từng dòng.)

## 5. Chỗ có thể làm gọn thêm

1. **Đã dọn:** bảng `nhat_ky_thao_tac`, hai hàm `danh_dau_da_doc_ho_tro` / `doi_trang_thai_ho_tro` đã xóa khỏi DB; phân quyền đã gọn về 3 vai trò (bỏ cờ `la_admin_goc`); logic giỏ hàng gom về `js/dung-chung/luu-gio-hang.js`; khu nhân viên bỏ header (chỉ còn sidebar) và nhân viên không còn dùng được trang khách (`js/dung-chung/chan-nhan-vien.js`); bỏ chuông thông báo ở header (thông báo xem trong trang Tài khoản); giờ làm việc ở giỏ hàng chỉ còn là một dòng thông báo cố định; xóa 11 cột không dùng trong DB (`khach_hang`: 8 cột CRM cũ; `san_pham`: `noi_bat`, `vi_tri_ke`; `giao_dich_kho`: `nhom_dieu_chuyen_id`).
2. **Trang Tài khoản (khách) nạp 17 file JS** — nhiều nhất dự án (gồm đăng nhập, đăng ký nhân viên, đơn, yêu cầu). Nếu bị hỏi "sao nhiều file", trả lời: mỗi file một nhóm việc (`phien`, `giao-dien`, `yeu-cau`...).
3. **Số đỏ ở thanh bên đọc ~8 bảng mỗi lần mở trang nhân viên.** Chạy đủ nhanh với dữ liệu hiện tại; nếu cần gọn có thể đổi thành một view trong DB.
4. **Đã gộp:** mọi đơn hàng (đặt từ giỏ và "Mua ngay") đều đi qua **một hàm** `taoDonHang()` trong `js/dung-chung/tao-don-hang.js`, và mọi phép tính tiền (tạm tính, chiết khấu, VAT, phí ship, tổng) nằm ở `tinhTongDonHang()` trong `js/dung-chung/tinh-chiet-khau.js`. Muốn đổi thuế/phí ship thì sửa đúng 1 chỗ.
5. **`css/nhan-vien.css` còn nhiều luật khai báo lặp** (nhất là nhóm `.request-filter-grid` và `.request-table-wrap` bị vá nhiều lớp). Không gây lỗi, nhưng khó đọc; có thể gộp lại.
6. **Điểm cần giải thích khi bị hỏi:** trang Tài khoản dùng `hanhDong` (bảng tra hàm) để các file con gọi `hienThiTrang` mà không import vòng quanh nhau.

## 6. CSS — 4 file, mỗi trang chỉ nạp 3 file

| File | Nội dung | Ai nạp |
|---|---|---|
| `css/chung.css` | Màu/biến (`:root`), bố cục, header, footer, nút, ô nhập, bảng, hộp thoại | Mọi trang |
| `css/khach.css` | Trang chủ, danh mục, chi tiết, giỏ hàng, liên hệ, tài khoản, tư vấn, về ABA | Trang khách |
| `css/nhan-vien.css` | Thanh bên, thẻ số liệu, Khách hàng, Yêu cầu khách hàng, trang chủ Thủ kho | Trang nhân viên |
| `css/tien-ich.css` | Vài lớp tiện ích nhỏ | Mọi trang, nạp **sau cùng** |

Mỗi trang nạp theo thứ tự: `chung` → (`khach` hoặc `nhan-vien`) → `tien-ich`. Một trang khách đọc khoảng 1.350 dòng, một trang nhân viên khoảng 1.440 dòng (trước đây mọi trang đều đọc ~2.900 dòng). `staff/css/kho.css` (10 dòng) chỉ cho trang Kho.

Quy ước: mỗi trang/khối dùng một tiền tố riêng (`acc-` tài khoản, `tk-` trang chủ Thủ kho, `pq-` phân quyền, `request-` yêu cầu khách hàng...). Muốn sửa giao diện một trang thì mở file của khu vực đó, tìm theo tiền tố.
