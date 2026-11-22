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
 * Đăng ký (giống DangKyPage.tsx của web): tạo tài khoản xong thì đăng nhập luôn bằng SĐT + mật khẩu vừa nhập.
 * Số điện thoại gửi nguyên chuỗi; backend tự bỏ khoảng trắng / dấu chấm và kiểm tra 10 số bắt đầu bằng 0 (như web).
 */
export default function DangKyScreen() {
  const { services, dangNhap } = useAuth();
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [loi, setLoi] = useState('');
  const [xong, setXong] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const oSdt = useRef<TextInputInstance>(null);
  const oEmail = useRef<TextInputInstance>(null);
  const oMatKhau = useRef<TextInputInstance>(null);
  const oXacNhan = useRef<TextInputInstance>(null);

  async function gui() {
    if (dangGui) return;
    setLoi('');
    // Web chặn bằng required của ô nhập; độ dài, định dạng SĐT / email để server kiểm tra và trả câu cụ thể
    if (!hoTen.trim() || !sdt.trim() || !email.trim() || !matKhau) { setLoi('Hãy điền đủ họ tên, số điện thoại, email và mật khẩu.'); return; }
    if (matKhau !== xacNhan) { setLoi('Mật khẩu xác nhận không khớp.'); return; }
    setDangGui(true);
    try { await services.auth.dangKy(hoTen, sdt, email, matKhau); }
    catch (e) { setLoi(thongDiepLoi(e)); setDangGui(false); return; }
    // Tài khoản đã lưu: đăng nhập luôn rồi vào tab Xe để thêm xe (như web: nav('/xe')). Stack.Protected tự chuyển màn.
    try { await dangNhap(sdt, matKhau, '/xe'); }
    catch { setXong(true); setDangGui(false); } // hiếm: đăng ký được mà đăng nhập lỗi (mạng, quá nhiều yêu cầu)
  }

  return (
    <KhungXacThuc
      nhan="Tài khoản mới" tieuDe="Tạo tài khoản" moTa="Sau khi đăng ký, bạn thêm xe và mua gói chỗ ngay trong ứng dụng."
      chan={
        <View style={s.hang}>
          <Text style={s.moTa}>Đã có tài khoản? </Text>
          <LienKet nhan="Đăng nhập" onPress={veDangNhap} />
        </View>
      }
    >
      {xong ? (
        <>
          <ThongBao loai="ok">Đăng ký thành công. Hãy đăng nhập bằng số điện thoại vừa đăng ký.</ThongBao>
          <Nut nhan="Về đăng nhập" onPress={veDangNhap} style={s.nut} />
        </>
      ) : (
        <>
          <ONhap
            nhan="Họ và tên" placeholder="Nguyễn Văn An" value={hoTen} onChangeText={setHoTen} maxLength={100}
            autoCapitalize="words" autoComplete="name" textContentType="name"
            returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oSdt.current?.focus()}
          />
          <ONhap
            ref={oSdt} nhan="Số điện thoại" placeholder="0912 345 678" value={sdt} onChangeText={setSdt}
            keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"
            returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oEmail.current?.focus()}
          />
          <ONhap
            ref={oEmail} nhan="Email" placeholder="ban@email.com" value={email} onChangeText={setEmail} maxLength={255}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
            returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oMatKhau.current?.focus()}
          />
          <ONhap
            ref={oMatKhau} matKhau nhan="Mật khẩu" placeholder="Từ 8 đến 64 ký tự" value={matKhau} onChangeText={setMatKhau} maxLength={64}
            autoComplete="new-password" textContentType="newPassword"
            returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oXacNhan.current?.focus()}
          />
          <ONhap
            ref={oXacNhan} matKhau nhan="Nhập lại mật khẩu" placeholder="Nhập lại mật khẩu" value={xacNhan} onChangeText={setXacNhan} maxLength={64}
            autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={() => void gui()}
          />
          {loi ? <ThongBao loai="loi">{loi}</ThongBao> : null}
          <Nut nhan={dangGui ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'} onPress={() => void gui()} dangGui={dangGui} style={s.nut} />
        </>
      )}
    </KhungXacThuc>
  );
}
