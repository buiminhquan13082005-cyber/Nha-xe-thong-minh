import { useRef, useState } from 'react';
import { Text, View, type TextInputInstance } from 'react-native';
import { veDangNhap } from '@/modules/tai-khoan/components/veDangNhap';
import { KhungXacThuc } from '@/modules/tai-khoan/components/KhungXacThuc';
import { kieuXacThuc as s } from '@/modules/tai-khoan/components/kieuXacThuc';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { ONhap } from '@/shared/ui/ONhap';
import { LienKet, Nut, ThongBao } from '@/shared/ui/ui';

/**
 * Khôi phục mật khẩu (giống QuenMatKhauPage.tsx của web), 2 bước trên cùng một màn:
 * 1) nhập SĐT, server gửi mã qua email (luôn trả cùng một câu, không lộ số nào đã đăng ký);
 * 2) nhập mã trong email + mật khẩu mới.
 */
export default function QuenMatKhauScreen() {
  const { services } = useAuth();
  const [sdt, setSdt] = useState('');
  const [ma, setMa] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [loi, setLoi] = useState('');
  const [tin, setTin] = useState('');
  const [daDatLai, setDaDatLai] = useState(false);
  const [dangGui, setDangGui] = useState<'ma' | 'dat-lai' | null>(null);
  const oMatKhau = useRef<TextInputInstance>(null);
  const oXacNhan = useRef<TextInputInstance>(null);

  async function guiMa() {
    if (dangGui) return;
    setLoi(''); setTin('');
    if (!sdt.trim()) { setLoi('Nhập số điện thoại của tài khoản.'); return; }
    setDangGui('ma');
    try { setTin((await services.auth.quenMatKhau(sdt)).thongDiep); }
    catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setDangGui(null); }
  }

  async function datLai() {
    if (dangGui) return;
    setLoi(''); setTin('');
    if (!ma.trim() || !matKhau) { setLoi('Nhập mã trong email và mật khẩu mới.'); return; }
    if (matKhau !== xacNhan) { setLoi('Mật khẩu xác nhận không khớp.'); return; }
    setDangGui('dat-lai');
    try {
      await services.auth.datLaiMatKhau(sdt, ma.trim(), matKhau);
      setTin('Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.');
      setMa(''); setMatKhau(''); setXacNhan(''); setDaDatLai(true);
    } catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setDangGui(null); }
  }

  return (
    <KhungXacThuc
      nhan="Quên mật khẩu" tieuDe="Khôi phục mật khẩu" moTa="Nhận mã qua email của tài khoản rồi đặt mật khẩu mới."
      chan={<LienKet nhan="Về đăng nhập" onPress={veDangNhap} />}
    >
      {daDatLai ? (
        <>
          <ThongBao loai="ok">{tin}</ThongBao>
          <Nut nhan="Về đăng nhập" onPress={veDangNhap} style={s.nut} />
        </>
      ) : (
        <>
          <View style={s.phan}>
            <Text style={s.tieuDeNho}>1. Nhận mã</Text>
            <ONhap
              nhan="Số điện thoại" placeholder="0912 345 678" value={sdt} onChangeText={setSdt}
              keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"
              returnKeyType="send" onSubmitEditing={() => void guiMa()}
            />
            <Nut kieu="phu" nhan={dangGui === 'ma' ? 'Đang gửi…' : 'Gửi mã qua email'} onPress={() => void guiMa()}
              dangGui={dangGui === 'ma'} tat={dangGui !== null} style={s.nut} />
          </View>
          <View style={s.vach} />
          <View style={s.phan}>
            <Text style={s.tieuDeNho}>2. Đặt mật khẩu mới</Text>
            <ONhap
              nhan="Mã trong email" value={ma} onChangeText={setMa} maxLength={64}
              autoCapitalize="characters" autoCorrect={false} autoComplete="one-time-code" textContentType="oneTimeCode"
              returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oMatKhau.current?.focus()}
            />
            <ONhap
              ref={oMatKhau} matKhau nhan="Mật khẩu mới" placeholder="Từ 8 đến 64 ký tự" value={matKhau} onChangeText={setMatKhau} maxLength={64}
              autoComplete="new-password" textContentType="newPassword"
              returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oXacNhan.current?.focus()}
            />
            <ONhap
              ref={oXacNhan} matKhau nhan="Nhập lại mật khẩu" value={xacNhan} onChangeText={setXacNhan} maxLength={64}
              autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={() => void datLai()}
            />
            <Nut nhan={dangGui === 'dat-lai' ? 'Đang xử lý…' : 'Đặt lại mật khẩu'} onPress={() => void datLai()}
              dangGui={dangGui === 'dat-lai'} tat={dangGui !== null || !sdt.trim()} style={s.nut} />
          </View>
          {loi ? <ThongBao loai="loi">{loi}</ThongBao> : null}
          {tin ? <ThongBao loai="ok">{tin}</ThongBao> : null}
        </>
      )}
    </KhungXacThuc>
  );
}
