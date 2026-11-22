import { Stack } from 'expo-router';
import { mau } from '@/shared/theme';

/** Nhóm màn chưa đăng nhập: Đăng nhập, Đăng ký, Quên mật khẩu (đường dẫn không có "(auth)": /dang-nhap...). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: mau.nen } }} />;
}
