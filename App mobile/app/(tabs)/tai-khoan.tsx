import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useAuth } from '@/shared/auth/AuthContext';
import { IconTiep } from '@/shared/ui/icons';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { Nut, The } from '@/shared/ui/ui';
import { bo, chu, khoang, mau } from '@/shared/theme';

const MUC: { ten: string; moTa: string; toi: Href }[] = [
  { ten: 'Nhóm gia đình', moTa: 'Tạo nhóm, mã mời, dùng chung xe', toi: '/nhom-gia-dinh' },
  { ten: 'Ra vào', moTa: 'Xác nhận xe ra, lịch sử ra vào', toi: '/ra-vao' },
  { ten: 'Mua / gia hạn gói', moTa: 'Chọn gói cho xe đã duyệt', toi: '/mua-goi/0' },
  { ten: 'Sơ đồ chỗ trống', moTa: 'Chỗ còn ở các khu xe máy', toi: '/so-do' },
  { ten: 'Đổi mật khẩu', moTa: 'Đổi xong cần đăng nhập lại', toi: '/doi-mat-khau' },
  { ten: 'Kiểm tra kết nối máy chủ', moTa: 'Khi app báo không kết nối được', toi: '/kiem-tra-ket-noi' },
];

/** Tài khoản: thông tin, lối vào các mục không nằm trên thanh tab (giống menu dọc của web), đăng xuất. */
export default function TaiKhoanScreen() {
  const { phien, dangXuat } = useAuth();
  const [dangGui, setDangGui] = useState(false);

  async function xuat() {
    setDangGui(true);
    await dangXuat(); // xong thì Stack.Protected tự đưa về Đăng nhập
  }

  return (
    <ManHinh tieuDe="Tài khoản">
      <The style={{ gap: 4 }}>
        <Text style={s.ten}>{phien?.hoTen || 'Người dùng'}</Text>
        <Text style={kieuChung.moNho}>Thành viên · Mã tài khoản #{phien?.id}</Text>
        <Text style={kieuChung.moNho}>Mỗi tài khoản đăng nhập trên một điện thoại.</Text>
      </The>

      <View style={s.ds}>
        {MUC.map((m, i) => (
          <Pressable key={m.ten} accessibilityRole="button" onPress={() => router.push(m.toi)}
            style={({ pressed }) => [s.muc, i > 0 && s.vach, pressed && { backgroundColor: mau.the2 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.mucTen}>{m.ten}</Text>
              <Text style={kieuChung.moNho}>{m.moTa}</Text>
            </View>
            <IconTiep mau={mau.mo} />
          </Pressable>
        ))}
      </View>

      <Nut kieu="phu" nhan={dangGui ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={() => void xuat()} dangGui={dangGui} />
    </ManHinh>
  );
}

const s = StyleSheet.create({
  ten: { fontSize: chu.lon, fontWeight: '800', color: mau.chu },
  ds: { backgroundColor: mau.the, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.vien, overflow: 'hidden' },
  muc: { flexDirection: 'row', alignItems: 'center', gap: khoang.m, paddingHorizontal: khoang.l, paddingVertical: khoang.m, minHeight: 60 },
  vach: { borderTopWidth: 1, borderTopColor: mau.vien },
  mucTen: { fontSize: chu.thuong, fontWeight: '700', color: mau.chu },
});
