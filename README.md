# ABA Technical — Hệ thống tra cứu & quy đổi mã sản phẩm tương đương

Website cho **Công ty TNHH Kỹ thuật ABA** (phớt, gioăng công nghiệp): khách hàng tra cứu sản phẩm,
xem mã **tương đương giữa các hãng**, đặt hàng, gửi yêu cầu báo giá; nhân viên quản lý đơn hàng,
kho, sản phẩm, chiết khấu và phân quyền.

- **Giao diện:** HTML / CSS / JavaScript thuần (ES modules), không cần build.
- **Dữ liệu & xác thực:** Supabase (PostgreSQL + Auth + Storage), bảo vệ bằng Row Level Security.
- **Không có backend riêng:** frontend nói chuyện thẳng với Supabase; không cần chạy server nào.

## Cấu trúc thư mục

```
frontend/
├── index.html                 Trang chủ
├── config.js                  ★ Cấu hình Supabase (SUPABASE_URL, SUPABASE_ANON_KEY)
├── css/                           CSS chia 4 file: chung.css (mọi trang) · khach.css · nhan-vien.css · tien-ich.css (nạp sau cùng);
│                                  staff/css/kho.css: vài dòng riêng cho Kho
├── customer/                  Khu vực khách hàng
│   ├── danh-muc.html          Danh mục + lọc theo hãng / kích thước
│   ├── chi-tiet.html          Chi tiết sản phẩm + mã tương đương + thêm giỏ hàng
│   ├── giohang.html           Giỏ hàng, đặt hàng
│   ├── tai-khoan.html         Đăng nhập / đăng ký / đơn hàng / yêu cầu của tôi
│   ├── tu-van.html · ve-aba.html · lien-he.html
│   └── js/                    Mã JS riêng của từng trang (tai-khoan.js tách thành js/tai-khoan/)
├── staff/                     Khu vực nhân viên (mỗi chức năng 1 trang)
│   ├── nhan-vien-chung.js        Dùng chung: kiểm tra đăng nhập, phân quyền, sidebar, xuất Excel
│   ├── dashboard · don-hang · khach-hang · san-pham · kho
│   ├── bao-gia (Yêu cầu khách hàng) · chiet-khau · han-luu-kho · phan-quyen
│   └── js/                    Mã JS riêng của từng trang. Các trang lớn (don-hang, kho, bao-gia) tách thành
│                              thư mục con cùng tên (js/kho/, js/don-hang/, ...) — xem mục "Cách tổ chức mã"
└── js/dung-chung/                    Thư viện dùng chung (xem mục "Hàm dùng chung" bên dưới)
docs/                          ban-do-du-an.md (đọc trước: bản đồ & luồng chính); tu-dien-du-lieu.md (từ điển dữ liệu); lich-su/ = ghi chú cũ, chỉ để tra cứu
```

## Cách tổ chức mã của các trang lớn

Năm trang lớn được chia thành nhiều module nhỏ (mỗi file một nhóm việc, hầu hết dưới 300 dòng). File `js/<trang>.js`
(ví dụ `staff/js/don-hang.js`) vẫn là điểm vào mà HTML nạp, chỉ giữ phần khởi động; phần còn lại nằm trong thư mục
`js/<trang>/`. Tên module đặt theo vai trò, cùng một khuôn cho mọi trang:

| Module | Vai trò |
|---|---|
| `du-lieu-trang.js` | Biến dùng chung của trang (`ctx`, `state`, `badges`...). Biến bị gán lại có hàm `setXxx()` đi kèm |
| `nhan.js` / `hang-so.js` / `tien-ich.js` | Nhãn tiếng Việt, hằng số, hàm tiện ích thuần |
| `tai-du-lieu.js` | Tải dữ liệu từ Supabase, lọc, nhóm, thống kê |
| `giao-dien.js` | Vẽ giao diện (hàm `hienThi...` tạo HTML) |
| `su-kien.js` | Gắn sự kiện cho nút/ô nhập (`attach...Handlers`) |
| `hop-thoai.js`, `xuat-excel.js`, `nhap-excel.js`... | Từng nhóm chức năng riêng của trang |

Cách đọc một trang: mở `js/<trang>.js` (khởi động) → `giao-dien.js` (màn hình trông thế nào) → `su-kien.js` (bấm nút thì
điều gì xảy ra) → `tai-du-lieu.js` (dữ liệu lấy từ đâu). Hai module cần gọi lẫn nhau (ví dụ `tai-du-lieu.js` cần vẽ lại trang) thì gọi
qua `actions` trong `du-lieu-trang.js` (`actions.hienThiTrang()`) để tránh import vòng.

### Khu vực nhân viên tách riêng khỏi khu vực khách

- **Không có header công khai.** Trang nhân viên chỉ có thanh bên (sidebar) bên trái gồm 4 phần: logo · thẻ người dùng (tên, vai trò) · menu theo vai trò · nút đăng xuất.
  Số đỏ cạnh mỗi mục là số việc đang chờ; mục "Thông báo" hiện tổng số việc. Cấu trúc sidebar nằm ở một hàm duy nhất `hienThiThanhBenNhanVien` (`staff/nhan-vien-chung.js`), kiểu dáng ở đầu `css/nhan-vien.css`.
- **Tài khoản nhân viên không dùng chức năng của khách** (giỏ hàng, đặt hàng, trang công khai): mở trang khách thì tự chuyển về Trang chủ nhân viên
  (`js/dung-chung/chan-nhan-vien.js`, gọi từ `khoi-tao-dau-trang.js`). Nhân viên đã nghỉ việc hoặc đang chờ duyệt vẫn là khách bình thường. Muốn mua hàng phải dùng tài khoản khách riêng.
  Đây là chặn ở giao diện; DB vẫn giữ nguyên các luật RLS sẵn có.

### Tầng hiển thị (z-index)

Các lớp nổi trên giao diện dùng biến CSS trong `css/chung.css` (`:root`): `--z-modal` = 3000 (hộp thoại, che và làm mờ mọi thứ bên dưới, kể cả thanh bên nhân viên), `--z-toast` = 3200 (thông báo nổi, luôn trên cùng). Hộp thoại tự dựng bằng JS cũng dùng các
biến này; hộp thoại dài hơn màn hình thì cuộn được từ đầu. Khi thêm hộp thoại mới, dùng `var(--z-modal)` thay vì số cố định.

### Ô ngày dùng thành phần mặc định

Các ô chọn ngày (lọc đơn hàng, kho, nhật ký, chiết khấu, ngày dự kiến của yêu cầu) là `<input type="date">` của trình duyệt;
`.value` luôn là `yyyy-mm-dd` nên dùng thẳng để lọc/so sánh. **Cách hiển thị (ngày/tháng/năm hay tháng/ngày/năm) do ngôn ngữ
của trình duyệt quyết định:** máy để tiếng Anh-Mỹ sẽ hiện tháng trước ngày, máy để tiếng Việt hiện ngày trước tháng. Ảnh đại diện
dùng ô chọn file mặc định: chọn ảnh → xem trước trong khung tròn (CSS `object-fit: cover`) → bấm Lưu mới tải lên.

### Thanh toán và liên hệ

Hệ thống **không có cổng thanh toán**: mô hình là «đặt hàng → cửa hàng gọi xác nhận và hướng dẫn thanh toán» (nhận hàng trả tiền
hoặc chuyển khoản), phù hợp bán hàng cho doanh nghiệp. Để khách luôn biết cách liên hệ, khối **«Thanh toán & liên hệ»**
(hotline, email, giờ làm việc, và cách chuyển khoản nếu có) hiện ở màn «Đặt hàng thành công» (giỏ hàng và trang chi tiết) và
trong thẻ các đơn đang xử lý ở Tài khoản. Toàn bộ thông tin nằm ở **một file** `frontend/js/dung-chung/thong-tin-cua-hang.js`; muốn hiện số tài
khoản ngân hàng thì điền `nganHang` trong file đó (để trống thì chỉ hiện «cửa hàng sẽ hướng dẫn qua điện thoại»). Hệ thống chưa ghi
nhận trạng thái «đã thanh toán» — xem mục hạn chế.

## Hàm dùng chung (đọc trước khi viết thêm hàm mới)

Trước khi tự viết một hàm nhỏ, hãy kiểm tra xem đã có sẵn trong `frontend/js/dung-chung/` hay chưa — trước đây
chính việc mỗi file tự viết lại những hàm này làm dự án bị lặp code.

| Cần làm gì | Dùng gì | File |
|---|---|---|
| Kết nối Supabase | `import { supabase, daCauHinh }` — **một** client duy nhất cho cả trang, không gọi `createClient` ở nơi khác | `ket-noi-supabase.js` |
| Định dạng tiền / ngày | `dinhDangTien(n)`, `dinhDangNgayVN(iso)` | `dinh-dang.js` |
| Chống chèn mã HTML | `maHoaHtml(chuỗi)` — bọc mọi chuỗi người dùng nhập trước khi ghép vào `innerHTML` | `dinh-dang.js` |
| Thông báo nổi (toast) | `hienThongBaoNhanh(msg)` (trang nhân viên import qua `nhan-vien-chung.js`) | `trang-chung.js` |
| Nhãn trạng thái đơn hàng | `NHAN_TRANG_THAI_DON`, `CAC_TRANG_THAI` | `staff/js/don-hang/hang-so.js` |
| Đọc/tạo hồ sơ khách | `taiHoSoKhach(...)`, `damBaoCoKhachHang(...)` | `dam-bao-khach-hang.js` |
| Đưa khách chưa đăng nhập tới trang Tài khoản, đăng nhập xong tự quay lại | `chuyenDenDangNhap("giohang.html")` | `trang-chung.js` |
| Chặn nhân viên vào trang khách | `chuyenNhanVienVeKhuNoiBo(đường dẫn)` | `chan-nhan-vien.js` |
| Giỏ hàng (thêm, lưu, đếm, số trên menu) | `themVaoGioHang(session, sp, sl)`, `luuGioHang(session, giỏ)`, `layGioHang(session)` — **một** nơi duy nhất, các trang không tự viết lại | `luu-gio-hang.js` |

## Cách chạy thử

1. Mở `frontend/config.js`, điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` của project Supabase.
2. **Chạy bằng một web server cục bộ**, ví dụ extension *Live Server* của VS Code
   (`http://127.0.0.1:5500/frontend/index.html`). Không mở trực tiếp bằng `file://` vì trình duyệt
   chặn ES modules.
3. Khu vực nhân viên: `frontend/staff/dashboard.html` (hoặc link "Đăng nhập nhân viên" ở chân trang chủ).

Nếu đăng ký bị báo *"email rate limit exceeded"*: Supabase Dashboard → Authentication → Providers →
Email → tắt **Confirm email** (gói Free giới hạn số email xác nhận mỗi giờ).

## Phân quyền nhân viên

Có **3 vai trò**, lưu ở đúng một cột `ho_so_nhan_vien.vai_tro`: **admin** (Quản trị viên), **warehouse** (Thủ kho),
**sales** (Kinh doanh). Chỉ Quản trị viên được duyệt nhân viên mới, đổi vai trò và cho nghỉ việc; không ai được tự đổi
vai trò hay tự cho nghỉ chính mình (trigger `bao_ve_phan_quyen` trong DB chặn đúng luật này, nên luôn còn ít nhất 1 Quản trị viên).

| Trang | admin | sales | warehouse |
|---|:-:|:-:|:-:|
| Đơn hàng, Khách hàng | ✔ | ✔ | |
| Sản phẩm, Yêu cầu khách hàng, Chiết khấu | ✔ | ✔ | ✔ |
| Kho hàng, Hạn lưu kho (xem), Trang chủ | ✔ | ✔ | ✔ |
| Phân quyền | ✔ (QTV: chỉ Thủ kho/Kinh doanh) | | |

**Tạo admin đầu tiên:** đăng ký tài khoản ở `customer/tai-khoan.html`, rồi trong Supabase Dashboard →
Table Editor → `ho_so_nhan_vien` → Insert row: `id` = UUID của tài khoản (Authentication → Users),
`ho_ten` = tên bạn, `vai_tro` = `admin`. (Phải làm trong Dashboard vì chỉ admin mới ghi được bảng này.)

**Nhân viên mới:** tự đăng ký tài khoản, gửi yêu cầu (`yeu_cau_dang_ky_nhan_vien`); admin duyệt
tại `staff/phan-quyen.html`.

## Tra cứu & quy đổi mã tương đương (tính năng cốt lõi)

Ở trang chi tiết sản phẩm, hệ thống:

1. Lấy **loại sản phẩm** của mã đang xem (`san_pham.loai_san_pham_id`, ví dụ hãng NOK – loại ISI).
2. Tra bảng `quy_doi_tuong_duong` (hai chiều) để biết các loại của hãng khác tương đương
   (ví dụ ISI ⇄ V-UNR, M-MUR2).
3. Lọc các sản phẩm thuộc những loại đó có **đường kính trong, đường kính ngoài, độ dày chênh lệch
   không quá 0,5 mm** so với sản phẩm gốc.

**Để tính năng này có kết quả, mỗi sản phẩm phải có đủ `loai_san_pham_id` và 3 kích thước.**
Lưu ý: form "Thêm sản phẩm" và "Nhập kho nhiều mã" trên trang Kho hàng **không gán `loai_san_pham_id`**
(và đặt giá bán = 0). Sản phẩm thêm bằng cách đó sẽ không tham gia quy đổi cho đến khi được gán loại
(import CSV bằng Supabase Table Editor kèm cột `loai_san_pham_id`, hoặc cập nhật trực tiếp trong Supabase).

## Cơ sở dữ liệu (Supabase)

| Nhóm | Bảng |
|---|---|
| Sản phẩm & quy đổi | `san_pham`, `loai_san_pham`, `quy_doi_tuong_duong`, `gia_von_san_pham` (chỉ kho/admin đọc) |
| Kho | `kho`, `ton_kho`, `giao_dich_kho`, `hang_cho_ve_kho` (hàng khách từ chối nhận, chờ nhập lại kho) |
| Bán hàng | `khach_hang`, `gio_hang`, `don_hang`, `chi_tiet_don_hang`, `lich_su_don_hang`, `yeu_cau_tra_hang` |
| Yêu cầu & hỗ trợ | `yeu_cau_bao_gia`, `chi_tiet_yeu_cau_bao_gia`, `tin_nhan_ho_tro`, `thong_bao` |
| Chiết khấu | `quy_tac_chiet_khau` (hàm `compute_best_discount`) |
| Nhân sự | `ho_so_nhan_vien`, `yeu_cau_dang_ky_nhan_vien` |
| View thống kê | `v_customer_stats`, `customer_refusal_stats` |
| Storage | `product-images`, `request-images` |

### Bảo mật

- Mọi bảng đều bật RLS. Khách chỉ thấy dữ liệu của mình và sản phẩm đang bán; nhân viên thấy theo vai trò.
- `ho_so_nhan_vien` chỉ admin được ghi (không ai tự cấp quyền admin cho mình được).
- **Chống khách sửa giá** — 3 trigger trên `chi_tiet_don_hang` / `don_hang`
  (`guard_chi_tiet_khach`, `recalc_don_hang_khach`, `guard_don_hang_khach`): khi **khách** đặt hàng,
  database tự lấy giá từ `san_pham`, tự tính chiết khấu và tổng đơn; khách không sửa được tiền, chỉ được
  hủy đơn. Nhân viên không bị ảnh hưởng.
- ⚠️ **Quy tắc ship (miễn phí từ 500.000đ, còn lại 30.000đ) và VAT 10% nằm ở 2 nơi**: frontend
  (`js/dung-chung/tinh-chiet-khau.js`, `customer/js/giohang.js`) và trigger `recalc_don_hang_khach`. Đổi chính sách
  phải sửa cả hai, nếu không tổng tiền khách thấy sẽ khác tổng database ghi.

### Quy trình trả hàng

`Đơn hoàn tất → Tạo yêu cầu trả hàng → Kiểm tra điều kiện → Xác nhận đã nhận hàng → customer_return →
cập nhật tồn kho + tổng đơn` (hàm `receive_return_request`, chạy trong một giao dịch).
Không dùng cho hàng khách đã bóc ra sử dụng hoặc chỉ đổi ý.

## Import danh mục hàng loạt

Dùng **Supabase Dashboard → Table Editor → bảng `san_pham` → Insert → Import data from CSV**
(không cần backend). File CSV cần có đủ các cột `ma_san_pham`, `loai_san_pham_id`, ba kích thước
(đường kính trong, đường kính ngoài, độ dày), vật liệu, hãng và giá, để sản phẩm tham gia được tính năng
quy đổi. Import lại cùng một file sẽ tạo dòng trùng, nên kiểm tra trước khi import.

> Backend FastAPI (`/import-excel`, `/equivalents`) đã bị gỡ: frontend không gọi nó, ghi từng dòng
> chậm, không loại trùng và mở CORS `*` kèm service_role key.

## Việc còn lại / hạn chế

- Chưa có cổng thanh toán và chưa lưu trạng thái «đã thanh toán» (thanh toán thực hiện ngoài hệ thống theo hướng dẫn của cửa hàng).
- Dữ liệu mẫu còn ít (15 sản phẩm, 2 dòng quy đổi): cần nhập thêm sản phẩm của hãng tương đương
  (V-UNR, M-MUR2) kèm loại và kích thước để demo quy đổi.
- Tài khoản nhân viên đặt hàng qua giao diện khách vẫn dùng giá do frontend gửi (nhân viên vốn được
  tin cậy sửa tiền).


## Trang "Hạn lưu kho & tiêu hủy" (`staff/han-luu-kho.html`)

Trang riêng trên sidebar (ngay dưới "Kho hàng"), thay chỗ của chức năng Nhật ký đã bỏ.

- **Chính sách:** hàng nhập kho quá N năm (N do công ty quyết định từng lúc) mà chưa bán hết phải tiêu hủy. Gõ N vào ô "Hạn lưu kho" rồi bấm Lưu. `CANH_BAO_THANG` = báo trước 12 tháng, nằm đầu file `frontend/staff/js/han-luu-kho.js`.
- **Cách tính:** mỗi lần hàng vào kho (nhập / chuyển đến / khách trả) là một lô, hạn = ngày lô + N năm. Hàng bán theo nhập trước – xuất trước (FIFO) nên số còn trong kho thuộc các lô mới nhất; phần tồn không có phiếu nhập tính là lô cũ nhất (ngày = ngày tạo mã). Không cần bảng "lô hàng" riêng.
- **Tiêu hủy:** nút "🗑 Tiêu hủy N" (chỉ Kho/Admin) ghi giao dịch kho loại `disposal` — DB tự trừ tồn, trang Kho hàng hiện "🗑️ Tiêu huỷ hết hạn". Có nút **In biên bản tiêu hủy** (Thủ kho – Kế toán – Giám đốc ký).
- **Ghi nhớ:** số năm đã lưu được nhớ trong trình duyệt, đổi trang rồi quay lại vẫn giữ (mặc định 10 năm nếu chưa lưu).


## Quy ước đặt tên (đã Việt hóa)

- Tên file, hàm, hằng và biến cấp file được đặt bằng tiếng Việt không dấu: hàm dạng `taiDuLieu`, `hienThiTrang`, `ganSuKien`; hằng dạng `TEN_CONG_TY`; file dạng `tai-du-lieu.js`, `du-lieu-trang.js`.
- Mỗi trang lớn tách module theo vai trò: `du-lieu-trang.js` (dữ liệu của trang), `tai-du-lieu.js` (tải từ DB), `giao-dien.js` (vẽ HTML), `su-kien.js` (xử lý bấm nút), `tien-ich.js` (hàm phụ), `hang-so.js` (hằng số).
- Muốn tra tên cũ → tên mới: xem `docs/lich-su/BANG-DOI-TEN.md`.
