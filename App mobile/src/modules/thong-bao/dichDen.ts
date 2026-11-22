// Chép từ nha_de_xe/frontend/src/modules/thong-bao/dichDen.ts (phần của khách), sửa ở web thì nhớ sửa ở đây.
// Một chỗ duy nhất quy đổi thông báo → màn cần tới. Tab Thông báo và thẻ nổi SignalR đều gọi file này.
// Khác web: app chỉ dành cho người dùng (hành động Admin → null), đường dẫn là route của app (expo-router).

/** Khớp NhaXe.Modules.ThongBao.Contracts.HanhDongThongBao (C#). Đổi bên này thì đổi bên kia. */
export const HANH_DONG_KHACH = [
  'XAC_NHAN_RA',   // luot_gui_id: xe đang ở cổng ra, xác nhận trong 60 giây
  'XEM_LUOT',      // luot_gui_id: xem lượt gửi trong lịch sử Ra vào
  'TRA_PHI',       // xe_id: trả phí quá hạn
  'DAN_DUONG',     // luot_gui_id: mở màn hình chỉ đường tới khu
  'DUONG_RA',      // luot_gui_id: xe vừa ra khỏi khu, mở màn hình chỉ đường ra Cổng ra Y
  'XEM_VI_TRI',    // xe_id: xe đang đỗ ở khu nào (Tìm xe)
  'XEM_SO_DO',     // —: sơ đồ chỗ trống (bãi hết chỗ, khu đầy không có chỉ dẫn)
  'MUA_GOI',       // xe_id: mua / gia hạn gói, chọn sẵn xe
  'GUI_LAI_GIAY',  // xe_id: xe bị từ chối, tải lại ảnh giấy đăng ký
  'XEM_XE',        // xe_id: xe bị gỡ / gói bị huỷ
  'XEM_NHOM',      // nhóm: nhóm gia đình
  'DOI_MAT_KHAU',  // —: chưa có nơi gửi (dự phòng cho cảnh báo đăng nhập lạ)
] as const;

export type HanhDongKhach = (typeof HANH_DONG_KHACH)[number];

/** Thông báo cần người nhận LÀM gì đó thì có nhãn bên phải. Chỉ để biết thì không có nhãn. */
export const NHAN_HANH_DONG: Partial<Record<HanhDongKhach, string>> = {
  XAC_NHAN_RA: 'Xác nhận ra',
  DAN_DUONG: 'Xem đường đi',
  DUONG_RA: 'Xem đường ra',
  TRA_PHI: 'Trả phí',
  MUA_GOI: 'Mua gói',
  GUI_LAI_GIAY: 'Gửi lại giấy',
  DOI_MAT_KHAU: 'Đổi mật khẩu',
};

/** Phần thông báo đủ để quyết định nơi tới (dùng chung cho hộp thư và sự kiện SignalR). */
export interface ThongBaoDich {
  loai: string;
  noiDung: string;
  hanhDong?: string | null;
  thamChieuId?: number | null;
}

const laKhach = (h: string): h is HanhDongKhach => (HANH_DONG_KHACH as readonly string[]).includes(h);

/** Thông báo cũ (trước khi có cột hanh_dong): đoán hành động từ loai + câu chữ. Không đoán được thì null. */
export function suyHanhDong(tb: ThongBaoDich): HanhDongKhach | null {
  const nd = tb.noiDung.toLowerCase();
  switch (tb.loai) {
    case 'RA': return nd.includes('đang ở cổng ra') ? 'XAC_NHAN_RA' : 'XEM_LUOT';
    case 'VAO': case 'NGHI_MAT': return 'XEM_LUOT';
    case 'CHO_THANH_TOAN': case 'QUA_HAN': return 'TRA_PHI';
    case 'KHU':
      if (nd.includes('hết chỗ') || nd.includes('sơ đồ')) return 'XEM_SO_DO';
      if (nd.includes('mời vào') || nd.includes('mời bạn sang')) return 'DAN_DUONG';
      return 'XEM_VI_TRI';
    case 'SAP_HET_HAN': case 'HET_HAN': return 'MUA_GOI';
    case 'KET_QUA_DUYET': return nd.includes('từ chối') ? 'GUI_LAI_GIAY' : 'MUA_GOI';
    case 'XE_BI_GO': case 'HUY_GOI': return 'XEM_XE';
    case 'NHOM': return 'XEM_NHOM';
    default: return null;
  }
}

/** Hành động hiệu lực: cột hanh_dong nếu có (và là hành động của khách), không thì suy từ loai. */
export function hanhDongCua(tb: ThongBaoDich): HanhDongKhach | null {
  if (tb.hanhDong) return laKhach(tb.hanhDong) ? tb.hanhDong : null;
  return suyHanhDong(tb);
}

/**
 * Đường dẫn màn đích trong app, kèm id để màn tô sáng đúng dòng / thẻ.
 * null: không có màn phù hợp (loại lạ) hoặc là hành động của Admin.
 */
export function duongDanCho(tb: ThongBaoDich): string | null {
  const hd = hanhDongCua(tb);
  if (!hd) return null;
  const id = tb.thamChieuId ?? null;
  const q = (ten: string) => (id === null ? '' : `?${ten}=${id}`);
  switch (hd) {
    case 'XAC_NHAN_RA': return id === null ? '/ra-vao' : `/ra-vao?luot=${id}&xacNhan=1`;
    case 'XEM_LUOT': return `/ra-vao${q('luot')}`;
    case 'TRA_PHI': return id === null ? '/ra-vao' : `/phi-qua-han/${id}`;
    case 'DAN_DUONG': return `/tim-xe${q('danDuong')}`;
    case 'DUONG_RA': return `/tim-xe${q('duongRa')}`;
    case 'XEM_VI_TRI': return `/tim-xe${q('xe')}`;
    case 'XEM_SO_DO': return '/so-do';
    case 'MUA_GOI': return `/mua-goi/${id ?? 0}`;
    case 'GUI_LAI_GIAY': case 'XEM_XE': return `/xe${q('xe')}`;
    case 'XEM_NHOM': return '/nhom-gia-dinh';
    case 'DOI_MAT_KHAU': return '/doi-mat-khau';
  }
}

/** Nhãn hành động bên phải thông báo ("Xác nhận ra →"), hoặc null nếu chỉ để biết. */
export function nhanHanhDong(tb: ThongBaoDich): string | null {
  const hd = hanhDongCua(tb);
  return hd ? NHAN_HANH_DONG[hd] ?? null : null;
}
