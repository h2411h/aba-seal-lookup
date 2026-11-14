// Kết nối Supabase DUY NHẤT của cả trang: mọi file cần Supabase đều import `supabase` từ đây
// (trước kia mỗi file tự tạo một client riêng nên một trang có thể tạo tới 5 client cùng lúc).
// `daCauHinh` = false khi config.js chưa điền SUPABASE_ANON_KEY thật; lúc đó `supabase` là null.
const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};

export const daCauHinh = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) && !SUPABASE_ANON_KEY.startsWith("DAN_");
export const supabase = daCauHinh ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
