// Địa chỉ backend (NGINX cổng 8080 của máy tính trong mạng LAN), đọc từ mobile/.env.
// Expo chỉ đưa biến EXPO_PUBLIC_* vào app, và phải viết đúng nguyên văn process.env.EXPO_PUBLIC_API_URL.

/** Bỏ khoảng trắng và dấu "/" ở cuối. Không bắt đầu bằng http:// hoặc https:// thì coi như chưa đặt (null). */
export function chuanHoaDiaChi(s: string | null | undefined): string | null {
  const v = (s ?? '').trim().replace(/\/+$/, '');
  return /^https?:\/\/[^/\s]+/i.test(v) ? v : null;
}

/** Cảnh báo cấu hình sai hay gặp: điện thoại không gọi được localhost của máy tính. */
export function canhBaoDiaChi(url: string | null): string | null {
  if (!url) return LOI_CHUA_CAU_HINH;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|$|\/)/i.test(url))
    return 'Điện thoại không gọi được localhost. Đặt EXPO_PUBLIC_API_URL là IP mạng LAN của máy tính (xem bằng ipconfig), ví dụ http://192.168.1.10:8080.';
  return null;
}

export const LOI_CHUA_CAU_HINH =
  'Chưa đặt EXPO_PUBLIC_API_URL trong mobile/.env (ví dụ http://192.168.1.10:8080). Sửa xong chạy lại: npx expo start --clear';

export const API_URL: string | null = chuanHoaDiaChi(process.env.EXPO_PUBLIC_API_URL);
