import { useRef, useState } from 'react';
import { Text, type TextInputInstance } from 'react-native';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { ONhap } from '@/shared/ui/ONhap';
import { Nut, The, ThongBao } from '@/shared/ui/ui';
import { khoang } from '@/shared/theme';

/**
 * Đổi mật khẩu (giống DoiMatKhauPage.tsx của web). Đổi xong server huỷ phiên hiện tại: xoá phiên trên máy,
 * Stack.Protected tự đưa về màn Đăng nhập kèm câu "Đã đổi mật khẩu. Hãy đăng nhập lại."
 */
export default function DoiMatKhauScreen() {
  const { services } = useAuth();
  const [cu, setCu] = useState('');
  const [moi, setMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [loi, setLoi] = useState('');
  const [ban, setBan] = useState(false);
  const oMoi = useRef<TextInputInstance>(null);
  const oXacNhan = useRef<TextInputInstance>(null);

  async function gui() {
    if (ban) return;
    setLoi('');
    if (!cu || !moi) { setLoi('Nhập mật khẩu hiện tại và mật khẩu mới.'); return; }
    if (moi !== xacNhan) { setLoi('Mật khẩu xác nhận không khớp.'); return; }
    setBan(true);
    try {
      await services.auth.doiMatKhau(cu, moi);
      await services.phien.luu(null, 'Đã đổi mật khẩu. Hãy đăng nhập lại.');
    } catch (e) {
      setLoi(thongDiepLoi(e));
      setBan(false);
    }
  }

  return (
    <ManHinh vien={[]}>
      <The style={{ gap: khoang.l }}>
        <ONhap matKhau nhan="Mật khẩu hiện tại" value={cu} onChangeText={setCu} autoComplete="current-password" textContentType="password"
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => oMoi.current?.focus()} />
        <ONhap ref={oMoi} matKhau nhan="Mật khẩu mới" placeholder="Từ 8 đến 64 ký tự" value={moi} onChangeText={setMoi} maxLength={64}
          autoComplete="new-password" textContentType="newPassword" returnKeyType="next" submitBehavior="submit"
          onSubmitEditing={() => oXacNhan.current?.focus()} />
        <ONhap ref={oXacNhan} matKhau nhan="Nhập lại mật khẩu" value={xacNhan} onChangeText={setXacNhan} maxLength={64}
          autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={() => void gui()} />
        <Text style={kieuChung.moNho}>Sau khi đổi mật khẩu, bạn cần đăng nhập lại.</Text>
        {loi ? <ThongBao loai="loi">{loi}</ThongBao> : null}
        <Nut nhan={ban ? 'Đang đổi…' : 'Đổi mật khẩu'} onPress={() => void gui()} dangGui={ban} />
      </The>
    </ManHinh>
  );
}
