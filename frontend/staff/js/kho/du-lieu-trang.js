// Trạng thái dùng chung của trang Kho hàng (staff/kho.html). Các module trong thư mục này cùng import từ đây.
export const phanTuGoc = document.getElementById("root");
export const nguCanh = {};    // { supabase, session, staff } — kho.js gán vào (Object.assign) sau khi đăng nhập
export const huyHieu = {}; // số thông báo trên sidebar — kho.js gán vào sau khi đăng nhập
// Hàm vẽ lại trang: kho.js đăng ký actions.render = hienThiTrang để các module khác gọi lại mà không import vòng.
export const hanhDong = { render: () => {} };

export const duLieuTrang = { warehouses: [], warehouseStock: [], transactions: [], costs: {}, showTransModal: false, showAddProductModal: false, suaSanPham: null, showNhapNhanh: false, stockSearch: "", transSearch: "", transTypeFilter: "all", transWarehouseFilter: "all", transGroupBy: "day",
  // Bộ lọc thời gian cho "Lịch sử giao dịch kho" — dùng CHUNG cho cả bảng hiển thị trên màn hình
  // và file Excel xuất ra, để tránh lệch nhau giữa "đang xem gì" và "xuất ra gì".
  transDateMode: "all", // all | day | month | range
  transDateDay: new Date().toISOString().slice(0, 10),
  transDateMonth: new Date().toISOString().slice(0, 7),
  transDateFrom: new Date().toISOString().slice(0, 10),
  transDateTo: new Date().toISOString().slice(0, 10),
  transPage: 1,
  transPageSize: 20 };
