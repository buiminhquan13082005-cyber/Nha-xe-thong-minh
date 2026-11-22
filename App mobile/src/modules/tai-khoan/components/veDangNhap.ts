import { router } from 'expo-router';

/** Quay về màn Đăng nhập: có màn trước thì lùi (giữ chữ đã gõ), mở thẳng từ liên kết thì thay bằng Đăng nhập. */
export function veDangNhap() {
  if (router.canGoBack()) router.back();
  else router.replace('/dang-nhap');
}
