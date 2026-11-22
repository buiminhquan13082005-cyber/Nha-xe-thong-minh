import { StyleSheet } from 'react-native';
import { mau } from '@/shared/theme';

/** Style dùng chung của các màn Đăng nhập / Đăng ký / Quên mật khẩu (.xt-mo-ta, .xt-ghi-chu, .xt-quen, .xt-nut ở web). */
export const kieuXacThuc = StyleSheet.create({
  hang: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  moTa: { fontSize: 15, lineHeight: 22, color: mau.mo },
  ghiChu: { fontSize: 12, color: mau.chuGoiY, textAlign: 'center' },
  quen: { alignItems: 'flex-end' },
  nut: { minHeight: 54 },
  tieuDeNho: { fontSize: 17, fontWeight: '700', color: mau.chu },
  phan: { gap: 16 },
  vach: { height: 1, backgroundColor: mau.vien, marginVertical: 4 },
});
