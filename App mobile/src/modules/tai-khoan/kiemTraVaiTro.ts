import { LoiApi } from '@/shared/models';
import type { PhienDangNhap } from './models';

export const MA_KHONG_PHAI_NGUOI_DUNG = 'KHONG_PHAI_NGUOI_DUNG';
export const THONG_DIEP_KHONG_PHAI_NGUOI_DUNG = 'App chỉ dành cho người dùng, Admin dùng trang web.';

/**
 * Luật của app: chỉ vai trò USER được dùng app. Kết quả đăng nhập của vai trò khác thì ném lỗi
 * để nơi gọi KHÔNG lưu token. (Phiên web của Admin vẫn bị server thay bằng phiên mới: xem README.)
 */
export function chiNhanNguoiDung(p: PhienDangNhap): PhienDangNhap {
  if (p?.vaiTro !== 'USER') throw new LoiApi(403, MA_KHONG_PHAI_NGUOI_DUNG, THONG_DIEP_KHONG_PHAI_NGUOI_DUNG);
  return p;
}
