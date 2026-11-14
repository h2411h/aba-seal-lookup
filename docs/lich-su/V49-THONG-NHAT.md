# V49 — Thống nhất quy ước + đơn giản hóa cảnh báo khách

## Đã thống nhất
- **Ngưỡng "sắp hết hàng"**: trước đây 3 giá trị khác nhau (dưới 30 ở Dashboard/Sản phẩm, ≤ 10 ở thanh bên/Thông báo/Kho, dưới 20 ở trang khách). Nay chỉ còn `NGUONG_SAP_HET = 30` trong `js/dung-chung/ton-kho.js`.
- **Nhãn trạng thái đơn**: khách thấy "Đã giao một phần", nhân viên thấy "Giao một phần" và mỗi bên giữ một bản sao bảng nhãn. Nay dùng chung `trang-thai-don.js` ("Giao một phần").
- **Nhãn loại yêu cầu**: bảng nhãn chép ở 2 nơi, nay dùng chung `loai-yeu-cau.js`.
- **Ký hiệu tiền**: 39 chỗ `₫` và 8 chỗ `đ`, mỗi chỗ tự ghép `toLocaleString`. Nay 69 chỗ đều gọi `dinhDangTien()`.
- **Chính tả**: 3 chỗ "huỷ" → "hủy".
- **Chữ ngưỡng cảnh báo trong chi tiết đơn** trước đây viết cứng "3 đơn/tuần, 6 đơn/tháng"; nay lấy từ hằng số nên đổi ngưỡng là chữ đổi theo.

## Lỗi database đã sửa
- `receive_return_request` tính lại tổng đơn khi nhận hàng trả nhưng **quên cộng phí vận chuyển**, trong khi đặt hàng, xác nhận giao và sửa phí ship đều có. Đã sửa hàm và chỉnh 6 đơn bị lệch đúng 30.000₫ (xem bên dưới).

| Đơn | Tổng cũ | Tổng mới |
|---|---|---|
| 6FB23785 | 346.940 | 376.940 |
| 9FA05ED2 | 124.300 | 154.300 |
| 6D9D7193 | 124.300 | 154.300 |
| 182370DB | 124.300 | 154.300 |
| DF7EE0A9 | 0 | 30.000 |
| 7578E390 | 0 | 30.000 |

  (Nếu muốn miễn phí ship cho đơn đã trả hết hàng thì đặt `phi_van_chuyen = 0` cho 2 đơn DF7EE0A9, 7578E390 và `tong_tien = 0`.)

## Cảnh báo khách hay hủy/từ chối nhận — làm đơn giản
- View `customer_refusal_stats`: từ 6 cột xuống 2 cột, đếm theo đơn (trước đây đếm trùng theo dòng sản phẩm) và không còn tính đơn nhân viên hủy vì lý do không phải do khách.
- JS: 4 hàm + 2 đối tượng trạng thái → 2 hàm (`canhBaoKhach`, `nhanCanhBao`). Style inline → class `.refusal-note`.
