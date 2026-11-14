# Ghi chú tái cấu trúc JavaScript

## Nguyên tắc
- Mỗi trang chức năng giữ một file JavaScript chính: `don-hang.js`, `bao-gia.js`, `kho.js`, `tai-khoan.js`, `giohang.js`, `chi-tiet.js`.
- Không tạo `main.js` cho từng trang.
- Chỉ đưa logic thực sự dùng chung vào file dùng chung.
- Giữ nguyên luồng HTML -> JavaScript -> Supabase, không thêm kiến trúc MVC/service/repository.
- Các phần trong file lớn được chia bằng tiêu đề rõ ràng: dữ liệu, hiển thị, sự kiện, xử lý nghiệp vụ, realtime.

## Phần dùng chung mới
`frontend/js/dung-chung/trang-chung.js` chứa:
- Giờ làm việc 07:30–17:30.
- Tính thời điểm mở cửa tiếp theo.
- Hiển thị thông báo ngoài giờ.
- Toast dùng chung cho các trang khách hàng.

## Đã kiểm tra
- Tất cả file `.js` đều qua `node --check`.
- Tất cả đường dẫn import tương đối của JavaScript đều tồn tại.
- Không đổi tên các file HTML hiện có.

## 2026-10-07 — Bảo hành/Đổi trả nhiều sản phẩm trong cùng đơn
- Một yêu cầu `warranty` giờ gắn với `order_id` và mảng `du_lieu_loai.products`.
- Khách có thể chọn nhiều dòng sản phẩm thuộc cùng đơn đã thanh toán.
- Mỗi sản phẩm lưu `order_item_id`, `product_id`, `quantity_ordered`, `quantity_issue`, `issue_description`.
- Có thêm `resolution_request`: `warranty`, `exchange`, hoặc `return_refund`.
- Nhân viên xem/chỉnh sửa nhiều sản phẩm lỗi ngay trong trang yêu cầu; không cần tạo nhiều yêu cầu riêng cho cùng một đơn.
- Không cần tạo bảng mới; tận dụng cột JSONB `du_lieu_loai` hiện có.

## 2026-10-27 — Trang Kho: bỏ nhập bằng Excel, thêm nhập kho trực tiếp
- Bỏ hẳn nhập bằng file Excel (`kho/nhap-excel.js` cũ, 280 dòng; không còn file mẫu, không còn hộp xem trước).
- Thêm `kho/nhap-nhanh.js`: nút **"+ Nhập kho nhiều mã"** mở bảng gõ trực tiếp cho 1 phiếu nhập (chọn kho + ghi chú/số hóa đơn một lần, mỗi dòng gồm mã, số lượng, giá nhập).
  - Enter ở ô giá = xuống dòng, dòng cuối tự thêm dòng mới; có thể dán nhiều dòng từ Excel vào ô mã (3 cột: mã, số lượng, giá nhập).
  - Kiểm tra hết các dòng, hiện lỗi ngay trong hộp; ghi cả phiếu bằng **một** lệnh `insert` (tất cả hoặc không dòng nào), tối đa 200 dòng/phiếu.
  - Ô số lượng/giá nhập là ô chữ (`inputmode="numeric"`), không dùng `type="number"` vì trình duyệt tự xóa giá dán vào dạng `95,000`.
- Xuất Excel giữ lại trong `kho/xuat-excel.js` (~60 dòng): xuất đúng những gì đang hiển thị/đang lọc; cột giá vốn chỉ xuất cho Kho/Admin.
- Dọn khỏi `tien-ich.js`, `tai-du-lieu.js`, `du-lieu-trang.js` các hàm/trạng thái chỉ phục vụ phần cũ. Nút "Xóa bộ lọc" lịch sử chuyển về `giao-dich.js`.

## 2026-10-27 — Tinh giản xuất Excel ở các trang nhân viên
- Bỏ hộp chọn phạm vi ngày (`moHopXuatExcel`), `moHopPhamViExcel` (không còn ai dùng) và các hàm phụ `locDongTheoNgay`, `ngayCucBo`, `khoangThang` khỏi `nhan-vien-chung.js` (423 → 266 dòng). Còn lại ở phần Excel: `xuatRaExcel` (xuất). (`docFileExcel` còn sót lại nhưng không ai gọi — đã xóa ngày 2026-10-28.)
- Quy tắc chung: **xuất đúng những gì đang hiển thị** (đang lọc/tìm kiếm thế nào thì file ra thế đó). Muốn xuất theo ngày thì lọc ngày trên trang rồi xuất.
- Giữ xuất Excel: Đơn hàng (nút đầu trang + nút "⬇ Excel" từng nhóm), Kho (tồn kho, lịch sử), Khách hàng, Sản phẩm.
- Trang Sản phẩm: file xuất không còn dòng tiêu đề phụ phía trên, nên xuất ra → sửa trong Excel → nhập lại bằng "Cập nhật thông số" được ngay.
- Trang Yêu cầu khách hàng (`bao-gia`): bỏ hẳn xuất Excel (nút, hàm, thẻ `<script>` xlsx).
- (Ghi chú cũ nói còn nhập Excel ở trang Sản phẩm — thực tế trang này chỉ có xuất Excel, không có nút nhập.)

## 2026-10-27 — Trang chủ nhân viên (dashboard): bỏ biểu đồ khung giờ
- Bỏ biểu đồ "Doanh thu theo khung giờ hôm nay" (dữ liệu theo giờ, khung HTML, code Chart.js) khỏi `js/dashboard.js` (368 → 333 dòng). Trang chủ còn 2 biểu đồ: doanh thu 7 ngày và tỉ lệ trạng thái đơn.
- Sửa nhãn trạng thái `delivery_failed` ("Giao thất bại") ở "Đơn hàng gần đây" (trước đó hiện chữ tiếng Anh thô) và tính trạng thái này vào biểu đồ tròn.

## 2026-10-28 — Dọn code thừa và trùng lặp
- Xóa code chết: hàm `docFileExcel` (không ai gọi), biến/import không dùng ở `san-pham.js`, `dashboard.js`, `giao-hang.js`, `su-kien.js` (đơn hàng), `ho-so.js`, `bao-gia/nhan.js`.
- Gộp **6 bản** hàm chống chèn HTML về `maHoaHtml` trong `js/dung-chung/dinh-dang.js`.
- Gộp **4 bản** định dạng tiền (`dinhDangTienVND`, `dinhDangTien` cục bộ) về `dinhDangTien` dùng chung.
- Gộp **9 chỗ** tự `createClient` về một client duy nhất `js/dung-chung/ket-noi-supabase.js` (trước đó 1 trang có thể tạo tới 5 client, trình duyệt báo cảnh báo "Multiple GoTrueClient instances").
- Gộp nhãn trạng thái đơn hàng về `NHAN_TRANG_THAI_DON` trong `don-hang/hang-so.js` (dashboard không còn bản riêng, biểu đồ tròn lấy nhãn từ đây).
- Toast của khu nhân viên dùng lại bản của `trang-chung.js`; hàm tải hồ sơ khách ở trang Chi tiết/Giỏ hàng dùng chung `taiHoSoKhach`.
- Dọn `hang-so.js` (chú thích bị rách, đặt sai chỗ) và xóa khoảng 140 dòng CSS không còn class nào dùng (bộ chọn ngày tự vẽ `dfp-*`, `log-*-badge`, `featured-badge`...).
