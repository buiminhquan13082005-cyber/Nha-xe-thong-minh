// Chép và chỉnh từ nha_de_xe/frontend/src/modules/goi-cho/utils/anhGiayDangKy.ts, sửa ở web thì nhớ sửa ở đây.
// Kiểm tra sơ bộ trên máy cho người dùng biết sớm. Kiểm tra THẬT (đọc nội dung tệp) nằm ở server.

export const ANH_TOI_DA_MB = 5;
/** Ảnh chụp điện thoại thường 4000px: thu về tối đa 1600px chiều ngang trước khi gửi (đủ đọc chữ trên cà vẹt). */
export const ANH_RONG_TOI_DA = 1600;
export const CHAT_LUONG_JPEG = 0.8;

/** Ảnh đã chọn và đã nén, sẵn sàng gửi lên PUT /api/xe/{xeId}/giay-dang-ky. */
export interface AnhDaChon {
  uri: string;
  ten: string;
  kieu: 'image/jpeg' | 'image/png';
  /** Byte, nếu máy cho biết. */
  kichThuoc?: number;
}

export function kiemTraAnh(a: AnhDaChon | null): string | null {
  if (!a) return 'Chưa chọn ảnh giấy đăng ký xe.';
  if (a.kieu !== 'image/jpeg' && a.kieu !== 'image/png') return 'Chỉ nhận ảnh JPG hoặc PNG.';
  if (a.kichThuoc !== undefined && a.kichThuoc > ANH_TOI_DA_MB * 1024 * 1024) return `Ảnh tối đa ${ANH_TOI_DA_MB} MB.`;
  return null;
}
