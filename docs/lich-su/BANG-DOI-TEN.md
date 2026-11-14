# Bảng đổi tên: tên cũ (tiếng Anh) → tên mới (tiếng Việt)

Tài liệu này giúp tra lại khi đọc báo cáo/tài liệu cũ. Mã nguồn đã đổi tên **đồng loạt và kiểm tra tự động** (xem cuối file).

## 1. File đã đổi tên

| Tên cũ | Tên mới |
|---|---|
| `style.css` | `kieu-dang.css` |
| `staff/staff-common.js` | `staff/nhan-vien-chung.js` |
| `js/lib/account-badge.js` | `js/dung-chung/huy-hieu-tai-khoan.js` |
| `js/lib/cart-badge.js` | `js/dung-chung/huy-hieu-gio-hang.js` |
| `js/lib/cart-store.js` | `js/dung-chung/luu-gio-hang.js` |
| `js/lib/cart-sync.js` | `js/dung-chung/dong-bo-gio-hang.js` |
| `js/lib/ensure-customer.js` | `js/dung-chung/dam-bao-khach-hang.js` |
| `js/lib/format.js` | `js/dung-chung/dinh-dang.js` |
| `js/lib/header-init.js` | `js/dung-chung/khoi-tao-dau-trang.js` |
| `js/lib/notif-badge.js` | `js/dung-chung/huy-hieu-thong-bao.js` |
| `js/lib/page-common.js` | `js/dung-chung/trang-chung.js` |
| `js/lib/promo-lib.js` | `js/dung-chung/tinh-chiet-khau.js` |
| `js/lib/shop-info.js` | `js/dung-chung/thong-tin-cua-hang.js` |
| `js/lib/site-header.js` | `js/dung-chung/dau-trang.js` |
| `customer/js/tai-khoan/state.js` | `customer/js/tai-khoan/du-lieu-trang.js` |
| `customer/js/tai-khoan/toast.js` | `customer/js/tai-khoan/thong-bao-nhanh.js` |
| `staff/js/bao-gia/state.js` | `staff/js/bao-gia/du-lieu-trang.js` |
| `staff/js/bao-gia/data.js` | `staff/js/bao-gia/tai-du-lieu.js` |
| `staff/js/don-hang/constants.js` | `staff/js/don-hang/hang-so.js` |
| `staff/js/don-hang/data.js` | `staff/js/don-hang/tai-du-lieu.js` |
| `staff/js/don-hang/helpers.js` | `staff/js/don-hang/tien-ich.js` |
| `staff/js/don-hang/state.js` | `staff/js/don-hang/du-lieu-trang.js` |
| `staff/js/kho/data.js` | `staff/js/kho/tai-du-lieu.js` |
| `staff/js/kho/helpers.js` | `staff/js/kho/tien-ich.js` |
| `staff/js/kho/state.js` | `staff/js/kho/du-lieu-trang.js` |

Thư mục `js/lib/` → `js/dung-chung/`. File `frontend/giohang.html` (chỉ chuyển hướng, không ai dùng) đã xóa.

## 2. Hàm / hằng / biến cấp file đã đổi tên (theo từng file)

### `customer/js/chi-tiet.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `code` | `maSanPham` |
| `autoBuy` | `muaNgay` |
| `state` | `duLieuTrang` |
| `getCart` | `layGioHang` |
| `cartCountLocal` | `demGioHang` |
| `addToCartLocal` | `themVaoGioHang` |
| `updateNavCartBadge` | `capNhatSoGioHangTrenMenu` |
| `ICONS` | `BIEU_TUONG` |
| `loadCustomer` | `taiKhachHang` |
| `stockBadge` | `nhanTonKho` |
| `equivalentCard` | `theTuongDuong` |
| `openOrderModal` | `moHopDatHang` |
| `attachEvents` | `ganSuKien` |
| `getFreshProduct` | `laySanPhamMoiNhat` |
| `submitDirectOrder` | `guiDonMuaNgay` |
| `submitQuoteRequest` | `guiYeuCauBaoGia` |
| `loadEquivalents` | `taiMaTuongDuong` |
| `loadProduct` | `taiSanPham` |

### `customer/js/danh-muc.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |

### `customer/js/giohang.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `getCart` | `layGioHang` |
| `saveCart` | `luuGioHang` |
| `cartItems` | `danhSachGioHang` |
| `cartCount` | `soLuongGioHang` |
| `itemFinalPrice` | `giaCuoiSanPham` |
| `SELECTED_KEY` | `KHOA_DA_CHON` |
| `getSelected` | `layDaChon` |
| `saveSelected` | `luuDaChon` |
| `isSelected` | `daDuocChon` |
| `toggleSelected` | `doiChon` |
| `toggleSelectAll` | `doiChonTatCa` |
| `selectedItems` | `cacDongDaChon` |
| `selectedCount` | `soDongDaChon` |
| `selectedTotal` | `tongTienDaChon` |
| `updateNavCartBadge` | `capNhatSoGioHangTrenMenu` |
| `state` | `duLieuTrang` |
| `DEFAULT_TAX_RATE` | `THUE_SUAT_MAC_DINH` |
| `computeOrderTotals` | `tinhTongDonHang` |
| `loadSession` | `taiPhienDangNhap` |
| `loadCustomer` | `taiKhachHang` |
| `loadRecommendations` | `taiGoiY` |
| `addRecommendedToCart` | `themGoiYVaoGioHang` |
| `showToast` | `hienThongBaoNhanh` |
| `setQty` | `datSoLuong` |
| `removeItem` | `xoaDong` |
| `attachEvents` | `ganSuKien` |
| `openCheckout` | `moThanhToan` |
| `submitCheckout` | `guiDonHang` |

### `customer/js/lien-he.js`

| Tên cũ | Tên mới |
|---|---|
| `showToast` | `hienThongBaoNhanh` |

### `customer/js/tai-khoan/anh-dai-dien.js`

| Tên cũ | Tên mới |
|---|---|
| `uploadAvatar` | `taiAnhDaiDien` |
| `discardPendingAvatar` | `huyAnhDangChon` |
| `initial` | `chuCaiDau` |
| `avatarBlock` | `khoiAnhDaiDien` |

### `customer/js/tai-khoan/don-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `kpis` | `chiSoTongQuanDon` |
| `filteredOrders` | `donHangDaLoc` |
| `cancelInfo` | `thongTinHuy` |
| `toggleOrder` | `moRongDon` |
| `HISTORY_ICON` | `BIEU_TUONG_LICH_SU` |
| `reorder` | `muaLaiDon` |
| `cancelOrder` | `huyDon` |
| `orderStatusLabel` | `nhanTrangThaiDon` |
| `loadOrders` | `taiDonHang` |

### `customer/js/tai-khoan/ho-so.js`

| Tên cũ | Tên mới |
|---|---|
| `submitEmailChange` | `guiDoiEmail` |
| `loadCustomerProfile` | `taiHoSoKhach` |

### `customer/js/tai-khoan/phien.js`

| Tên cũ | Tên mới |
|---|---|
| `handleSession` | `xuLyPhien` |
| `subscribeOrderRealtime` | `theoDoiDonHangTrucTiep` |

### `customer/js/tai-khoan/du-lieu-trang.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `nextParam` | `thamSoTiepTheo` |
| `state` | `duLieuTrang` |
| `orderChannel` | `kenhDonHang` |
| `setOrderChannel` | `datKenhDonHang` |
| `actions` | `hanhDong` |

### `customer/js/tai-khoan/su-kien.js`

| Tên cũ | Tên mới |
|---|---|
| `attachAccountEvents` | `ganSuKienTaiKhoan` |
| `attachAuthEvents` | `ganSuKienDangNhap` |

### `customer/js/tai-khoan/thong-bao.js`

| Tên cũ | Tên mới |
|---|---|
| `staffPages` | `cacTrangNhanVien` |
| `roleLabelLocal` | `nhanVaiTroTaiCho` |
| `loadNotifications` | `taiThongBao` |
| `markNotificationRead` | `danhDauThongBaoDaDoc` |
| `markAllNotificationsRead` | `danhDauTatCaDaDoc` |
| `checkStaff` | `kiemTraNhanVien` |
| `checkSignupRequest` | `kiemTraYeuCauDangKy` |

### `customer/js/tai-khoan/thong-bao-nhanh.js`

| Tên cũ | Tên mới |
|---|---|
| `showToast` | `hienThongBaoNhanh` |

### `customer/js/tai-khoan/yeu-cau.js`

| Tên cũ | Tên mới |
|---|---|
| `REQ_TYPE_LABELS` | `NHAN_LOAI_YEU_CAU` |
| `REQ_STATUS_LABELS` | `NHAN_TRANG_THAI_YEU_CAU` |
| `reqStatusDotColor` | `mauChamTrangThaiYeuCau` |
| `escapeReqHtml` | `maHoaHtmlYeuCau` |
| `requestMessages` | `tinNhanYeuCau` |
| `loadRequestMessages` | `taiTinNhanYeuCau` |
| `renderRequestMessage` | `veTinNhanYeuCau` |
| `sendingCustomerFollowUps` | `dangGuiTinNhanTiepKhach` |
| `sendRequestFollowUp` | `guiTinNhanTiep` |
| `sendRequestFollowUpOnce` | `guiTinNhanTiepMotLan` |
| `loadMyRequests` | `taiYeuCauCuaToi` |

### `js/dung-chung/luu-gio-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `CART_PREFIX` | `TIEN_TO_GIO_HANG` |
| `LEGACY_KEY` | `KHOA_CU` |
| `keyFor` | `khoaCuaKhach` |
| `migrateLegacyCart` | `chuyenGioHangCu` |
| `getCart` | `layGioHang` |
| `saveCartRaw` | `luuGioHangTho` |
| `cartCount` | `soLuongGioHang` |
| `renderNavCartBadge` | `veSoGioHangTrenMenu` |

### `js/dung-chung/dong-bo-gio-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `syncCartToServer` | `dongBoGioHangLenMayChu` |

### `js/dung-chung/dam-bao-khach-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `ensureCustomer` | `damBaoCoKhachHang` |

### `js/dung-chung/dinh-dang.js`

| Tên cũ | Tên mới |
|---|---|
| `fmtMoney` | `dinhDangTien` |
| `fmtDateVN` | `dinhDangNgayVN` |

### `js/dung-chung/khoi-tao-dau-trang.js`

| Tên cũ | Tên mới |
|---|---|
| `activeHref` | `hrefDangMo` |
| `actionsHtml` | `htmlNutThaoTac` |
| `mount` | `phanTuGanHeader` |

### `js/dung-chung/trang-chung.js`

| Tên cũ | Tên mới |
|---|---|
| `BUSINESS_HOURS` | `KHUNG_GIO_LAM_VIEC` |
| `businessHoursStatus` | `trangThaiGioLamViec` |
| `fmtNextOpen` | `dinhDangLanMoCuaTiep` |
| `showToast` | `hienThongBaoNhanh` |

### `js/dung-chung/tinh-chiet-khau.js`

| Tên cũ | Tên mới |
|---|---|
| `FREE_SHIP_THRESHOLD` | `NGUONG_MIEN_PHI_SHIP` |
| `FLAT_SHIP_FEE` | `PHI_SHIP_CO_DINH` |
| `computeShippingFee` | `tinhPhiVanChuyen` |
| `isPromoValidNow` | `khuyenMaiConHieuLuc` |
| `loadDiscountRules` | `taiQuyTacChietKhau` |
| `discountRuleApplies` | `quyTacChietKhauApDung` |
| `bestDiscountPercentForItem` | `phanTramChietKhauTotNhat` |
| `computeQuantityDiscountTotal` | `tinhTongChietKhauSoLuong` |

### `js/dung-chung/thong-tin-cua-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `SHOP_INFO` | `THONG_TIN_CUA_HANG` |

### `js/dung-chung/dau-trang.js`

| Tên cũ | Tên mới |
|---|---|
| `NAV_ITEMS` | `CAC_MUC_MENU` |
| `buildHeaderHtml` | `dungHtmlDauTrang` |
| `buildCartLinkHtml` | `dungHtmlLienKetGioHang` |
| `buildAccountLinkHtml` | `dungHtmlLienKetTaiKhoan` |
| `buildNotifBellHtml` | `dungHtmlChuongThongBao` |
| `customerNotifPlaceholderHtml` | `htmlChoChuongThongBaoKhach` |

### `staff/js/bao-gia/bao-hanh.js`

| Tên cũ | Tên mới |
|---|---|
| `warrantyProductRows` | `cacDongSanPhamBaoHanh` |
| `collectStaffWarrantyData` | `thuThapDuLieuBaoHanh` |

### `staff/js/bao-gia/tai-du-lieu.js`

| Tên cũ | Tên mới |
|---|---|
| `loadQuotes` | `taiYeuCau` |
| `loadStaffMap` | `taiBanDoNhanVien` |
| `loadProductsForSuggestion` | `taiSanPhamGoiY` |
| `loadPaidOrders` | `taiDonDaThanhToan` |
| `loadQuoteItems` | `taiDongYeuCau` |
| `matchesSearch` | `khopTuKhoa` |
| `filteredQuotes` | `yeuCauDaLoc` |
| `markCustomerReplyRead` | `danhDauDaDocPhanHoiKhach` |
| `markCancelled` | `danhDauDaHuy` |

### `staff/js/bao-gia/giao-dien.js`

| Tên cũ | Tên mới |
|---|---|
| `actionButtons` | `cacNutThaoTac` |

### `staff/js/bao-gia/nhan.js`

| Tên cũ | Tên mới |
|---|---|
| `REQUEST_TYPES` | `LOAI_YEU_CAU` |
| `LEGACY_REQUEST_LABELS` | `NHAN_YEU_CAU_CU` |
| `requestTypeLabel` | `nhanLoaiYeuCau` |
| `STATUSES` | `CAC_TRANG_THAI` |
| `statusBadgeClass` | `lopNhanTrangThai` |
| `OPEN_STATUSES` | `TRANG_THAI_DANG_MO` |
| `orderLabel` | `nhanDonHang` |
| `productLabel` | `nhanSanPham` |
| `productOptions` | `luaChonSanPham` |
| `paidOrderOptions` | `luaChonDonDaThanhToan` |
| `relatedSummary` | `tomTatLienQuan` |
| `escapeRequestHtml` | `maHoaHtmlYeuCau` |

### `staff/js/bao-gia/du-lieu-trang.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `setCtx` | `datNguCanh` |
| `badges` | `huyHieu` |
| `setBadges` | `datHuyHieu` |
| `staffMap` | `banDoNhanVien` |
| `setStaffMap` | `datBanDoNhanVien` |
| `staffList` | `dsNhanVien` |
| `setStaffList` | `datDsNhanVien` |
| `allProducts` | `tatCaSanPham` |
| `setAllProducts` | `datTatCaSanPham` |
| `state` | `duLieuTrang` |
| `actions` | `hanhDong` |

### `staff/js/bao-gia/su-kien.js`

| Tên cũ | Tên mới |
|---|---|
| `attachToolbarHandlers` | `ganSuKienThanhCongCu` |
| `attachResultHandlers` | `ganSuKienKetQua` |

### `staff/js/bao-gia/trao-doi.js`

| Tên cũ | Tên mới |
|---|---|
| `getRequestMessages` | `layTinNhanYeuCau` |
| `renderStaffMessages` | `veTinNhanNhanVien` |
| `sendingStaffRequestReplies` | `dangGuiPhanHoi` |
| `sendStaffRequestReply` | `guiPhanHoiNhanVien` |
| `sendStaffRequestReplyOnce` | `guiPhanHoiNhanVienMotLan` |

### `staff/js/chiet-khau.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `badges` | `huyHieu` |
| `state` | `duLieuTrang` |
| `canManageDiscounts` | `coQuyenQuanLyChietKhau` |
| `fmtDateVN` | `dinhDangNgayVN` |
| `ruleStatus` | `trangThaiQuyTac` |
| `scopeLabel` | `nhanPhamVi` |
| `conditionLabel` | `nhanDieuKien` |
| `loadAll` | `taiTatCa` |
| `attachEvents` | `ganSuKien` |

### `staff/js/dashboard.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `badges` | `huyHieu` |
| `kpi` | `chiSo` |
| `recentOrders` | `donGanDay` |
| `lowStock` | `hangSapHet` |
| `loadDashboard` | `taiBangDieuKhien` |
| `attachWarehouseEvents` | `ganSuKienKho` |
| `chartRevenue` | `bieuDoDoanhThu` |
| `chartStatus` | `bieuDoTrangThai` |
| `chartHourly` | `bieuDoTheoGio` |

### `staff/js/don-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `subscribeOrderRealtime` | `theoDoiDonHangTrucTiep` |

### `staff/js/don-hang/hang-so.js`

| Tên cũ | Tên mới |
|---|---|
| `CARRIER_OPTIONS` | `CAC_DON_VI_VAN_CHUYEN` |
| `STATUSES` | `CAC_TRANG_THAI` |
| `REVENUE_STATUSES` | `TRANG_THAI_TINH_DOANH_THU` |
| `REFUSAL_WEEK_THRESHOLD` | `NGUONG_TU_CHOI_TUAN` |
| `REFUSAL_MONTH_THRESHOLD` | `NGUONG_TU_CHOI_THANG` |
| `COMPANY_NAME` | `TEN_CONG_TY` |
| `COMPANY_ADDRESS` | `DIA_CHI_CONG_TY` |
| `CANCEL_REASONS` | `LY_DO_HUY` |

### `staff/js/don-hang/tai-du-lieu.js`

| Tên cũ | Tên mới |
|---|---|
| `loadOrders` | `taiDonHang` |
| `refusalStatFor` | `thongKeTuChoiCua` |
| `refusalWarningReason` | `lyDoCanhBaoTuChoi` |
| `refusalWarningBadge` | `nhanCanhBaoTuChoi` |
| `matchesSearch` | `khopTuKhoa` |
| `inDateRange` | `trongKhoangNgay` |
| `filteredOrders` | `donHangDaLoc` |
| `groupInfo` | `thongTinNhom` |
| `buildGroups` | `dungNhom` |
| `computeAnalytics` | `tinhThongKe` |
| `loadOrderHistory` | `taiLichSuDon` |

### `staff/js/don-hang/giao-dien.js`

| Tên cũ | Tên mới |
|---|---|
| `orderRowHtml` | `htmlDongDonHang` |

### `staff/js/don-hang/giao-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `saveBatchDelivery` | `luuKetQuaGiaoHang` |
| `completeDelivery` | `hoanTatGiaoHang` |
| `recordPostDeliveryReturn` | `ghiNhanTraHangSauGiao` |
| `receiveReturnRequest` | `nhanYeuCauTraHang` |
| `rejectReturnRequest` | `tuChoiYeuCauTraHang` |

### `staff/js/don-hang/tien-ich.js`

| Tên cũ | Tên mới |
|---|---|
| `itemDeliveryLabel` | `nhanGiaoHangDong` |
| `dateKey` | `khoaNgay` |
| `isoToDisplay` | `isoSangNgayGio` |
| `describeOrderHistory` | `moTaLichSuDon` |
| `statusBadgeClass` | `lopNhanTrangThai` |

### `staff/js/don-hang/hop-thoai.js`

| Tên cũ | Tên mới |
|---|---|
| `closeCarrierModal` | `dongHopDonViVanChuyen` |

### `staff/js/don-hang/in-xuat.js`

| Tên cũ | Tên mới |
|---|---|
| `printInvoice` | `inHoaDon` |
| `exportOrdersToExcel` | `xuatDonHangRaExcel` |

### `staff/js/don-hang/du-lieu-trang.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `setCtx` | `datNguCanh` |
| `badges` | `huyHieu` |
| `setBadges` | `datHuyHieu` |
| `staffMap` | `banDoNhanVien` |
| `setStaffMap` | `datBanDoNhanVien` |
| `state` | `duLieuTrang` |
| `orderChannel` | `kenhDonHang` |
| `setOrderChannel` | `datKenhDonHang` |
| `actions` | `hanhDong` |

### `staff/js/don-hang/su-kien.js`

| Tên cũ | Tên mới |
|---|---|
| `attachModalHandlers` | `ganSuKienHopThoai` |
| `attachToolbarHandlers` | `ganSuKienThanhCongCu` |
| `attachResultHandlers` | `ganSuKienKetQua` |

### `staff/js/han-luu-kho.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `badges` | `huyHieu` |
| `state` | `duLieuTrang` |
| `fmtNgay` | `dinhDangNgay` |
| `fmtTien` | `dinhDangTien` |
| `esc` | `maHoaHtml` |

### `staff/js/khach-hang.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `badges` | `huyHieu` |
| `state` | `duLieuTrang` |
| `escapeHtml` | `maHoaHtml` |
| `filtered` | `daLoc` |
| `loadAll` | `taiTatCa` |
| `attachEvents` | `ganSuKien` |

### `staff/js/kho/tai-du-lieu.js`

| Tên cũ | Tên mới |
|---|---|
| `groupInfo` | `thongTinNhom` |
| `buildTransGroups` | `dungNhomGiaoDich` |
| `filteredStock` | `tonKhoDaLoc` |
| `transDateRange` | `khoangNgayGiaoDich` |
| `filteredTransactions` | `giaoDichDaLoc` |
| `transDateLabel` | `nhanNgayGiaoDich` |
| `loadData` | `taiDuLieu` |

### `staff/js/kho/tien-ich.js`

| Tên cũ | Tên mới |
|---|---|
| `transTypeLabel` | `nhanLoaiGiaoDich` |
| `canManageWarehouse` | `coQuyenQuanLyKho` |
| `numOrNull` | `soHoacNull` |

### `staff/js/kho/du-lieu-trang.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `badges` | `huyHieu` |
| `actions` | `hanhDong` |
| `state` | `duLieuTrang` |

### `staff/js/kho/nhap-nhanh.js`, `staff/js/kho/xuat-excel.js` (2026-10-27: viết mới thay cho nhap-excel.js cũ, nên không có tên cũ)

### `staff/js/phan-quyen.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `badges` | `huyHieu` |
| `state` | `duLieuTrang` |
| `filteredStaff` | `nhanVienDaLoc` |
| `loadStaff` | `taiNhanVien` |
| `roleLabelReq` | `nhanVaiTroYeuCau` |

### `staff/js/san-pham.js`

| Tên cũ | Tên mới |
|---|---|
| `root` | `phanTuGoc` |
| `ctx` | `nguCanh` |
| `badges` | `huyHieu` |
| `state` | `duLieuTrang` |
| `loadProducts` | `taiDanhSachSanPham` |
| `filtered` | `daLoc` |
| `numOrNull` | `soHoacNull` |
| `uploadProductImage` | `taiAnhSanPham` |
| `handleImport` | `xuLyNhap` |

### `staff/nhan-vien-chung.js`

| Tên cũ | Tên mới |
|---|---|
| `getSupabaseClient` | `layKetNoiSupabase` |
| `requireStaff` | `batBuocNhanVien` |
| `roleLabel` | `nhanVaiTro` |
| `getSidebarBadges` | `layHuyHieuThanhBen` |
| `NOTIF_META` | `THONG_TIN_THONG_BAO` |
| `attachLogout` | `ganDangXuat` |
| `exportToExcel` | `xuatRaExcel` |
| `readExcelFile` | `docFileExcel` |
| `localDay` | `ngayCucBo` |
| `filterRowsByDate` | `locDongTheoNgay` |
| `monthRange` | `khoangThang` |
| `openExcelExportModal` | `moHopXuatExcel` |
| `openExcelScopeModal` | `moHopPhamViExcel` |
| `showToast` | `hienThongBaoNhanh` |

## 3. Những gì KHÔNG đổi (và vì sao)

- **Tên thuộc tính trong đối tượng** như `duLieuTrang.quotes`, `nguCanh.staff`, `nguCanh.supabase`, `hanhDong.render`: giữ tiếng Anh để không làm hỏng chỗ khác đọc cùng thuộc tính.
- **Biến cục bộ bên trong hàm** (`row`, `item`, `data`, `error`…): giữ nguyên. Riêng `data` và `error` là tên trả về của Supabase nên bắt buộc giữ.
- **Tên bảng/cột trong DB** vốn đã là tiếng Việt, không đụng tới.
- `config.js`, `index.html`, `window.APP_CONFIG`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, biến `supabase`: là tên chuẩn/được tài liệu nhắc, giữ nguyên.
- Thư mục `customer/` và `staff/`, và tên các trang `.html`: giữ nguyên vì là đường dẫn người dùng gõ và Supabase có thể dùng để chuyển hướng.

## 4. Cách đã kiểm tra
1. Đổi tên theo **phạm vi biến** (phân tích cú pháp), không dùng tìm-thay-thế mù; 2.827 điểm sửa, 0 xung đột tên.
2. `node --check` mọi file, ESLint `no-undef` (không còn tên chưa khai báo), mọi `import`/thẻ HTML trỏ đúng file.
3. Chạy **25 lượt** (14 trang khách + 11 trang nhân viên) trước và sau khi đổi tên với Supabase giả, kèm bấm thử mọi nút: nội dung trang, trạng thái sau khi bấm và danh sách lỗi **giống hệt nhau**.
