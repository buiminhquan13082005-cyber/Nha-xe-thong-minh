import { useRef, useState } from 'react';
import { Text, View, type TextInputInstance } from 'react-native';
import { router } from 'expo-router';
import { KhungXacThuc } from '@/modules/tai-khoan/components/KhungXacThuc';
import { kieuXacThuc as s } from '@/modules/tai-khoan/components/kieuXacThuc';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { ONhap } from '@/shared/ui/ONhap';
import { LienKet, Nut, ThongBao } from '@/shared/ui/ui';

/**
 * Đăng nhập (giống DangNhapPage.tsx của web). Thành công thì không tự điều hướng:
 * phiên đổi nên Stack.Protected trong app/_layout.tsx tự rời nhóm (auth).
 */
export default function DangNhapScreen() {
  const { dangNhap, thongBaoPhien } = useAuth();
  const [sdt, setSdt] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const oMatKhau = useRef<TextInputInstance>(null);

  async function gui() {
    if (dangGui) return;
    // Web chặn bằng thuộc tính required của ô nhập; app không có form HTML nên kiểm tra ở đây (cùng câu với server)
    if (!sdt.trim() || !matKhau) { setLoi('Nhập số điện thoại và mật khẩu.'); return; }
    setDangGui(true); setLoi(null);
    try {
      await dangNhap(sdt, matKhau);
    } catch (e) {
      setLoi(thongDiepLoi(e));
      setDangGui(false);
    }
  }

  return (
    <KhungXacThuc
      nhan="Nhà xe thông minh" tieuDe="Đăng nhập" moTa="Gửi xe, tìm lại xe và quản lý gói chỗ của bạn."
      chan={<>
        <View style={s.hang}>
          <Text style={s.moTa}>Chưa có tài khoản? </Text>
          <LienKet nhan="Tạo tài khoản" onPress={() => router.push('/dang-ky')} />
        </View>
        <Text style={s.ghiChu}>Mỗi tài khoản đăng nhập trên một điện thoại.</Text>
        <LienKet nhan="Kiểm tra kết nối máy chủ" mo onPress={() => router.push('/kiem-tra-ket-noi')} />
      </>}
    >
      {thongBaoPhien && <ThongBao loai="canh">{thongBaoPhien}</ThongBao>}
      <ONhap
        nhan="Số điện thoại" placeholder="0912 345 678" value={sdt} onChangeText={setSdt}
        keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oMatKhau.current?.focus()}
      />
      <View>
        <ONhap
          ref={oMatKhau} matKhau nhan="Mật khẩu" placeholder="Nhập mật khẩu" value={matKhau} onChangeText={setMatKhau}
          autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={() => void gui()}
        />
        <View style={s.quen}><LienKet nhan="Quên mật khẩu?" mo onPress={() => router.push('/quen-mat-khau')} /></View>
      </View>
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
      <Nut nhan={dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'} onPress={() => void gui()} dangGui={dangGui} style={s.nut} />
    </KhungXacThuc>
  );
}
