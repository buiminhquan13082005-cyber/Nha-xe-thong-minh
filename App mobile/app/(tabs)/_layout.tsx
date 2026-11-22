import { Tabs } from 'expo-router';
import { useThongBao } from '@/modules/thong-bao/ThongBaoContext';
import { IconTaiKhoan, IconThongBao, IconTimXe, IconTrangChu, IconXe } from '@/shared/ui/icons';
import { mau } from '@/shared/theme';

/** Thanh tab dưới (đã đăng nhập): Trang chủ, Xe, Tìm xe, Thông báo (kèm số chưa đọc), Tài khoản. */
export default function TabsLayout() {
  const { soChuaDoc } = useThongBao();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: mau.chinhChu,
        tabBarInactiveTintColor: mau.mo,
        tabBarStyle: { backgroundColor: mau.the, borderTopColor: mau.vien },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: mau.nen },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: ({ color }) => <IconTrangChu mau={color} /> }} />
      <Tabs.Screen name="xe" options={{ title: 'Xe', tabBarIcon: ({ color }) => <IconXe mau={color} /> }} />
      <Tabs.Screen name="tim-xe" options={{ title: 'Tìm xe', tabBarIcon: ({ color }) => <IconTimXe mau={color} /> }} />
      <Tabs.Screen
        name="thong-bao"
        options={{
          title: 'Thông báo', tabBarIcon: ({ color }) => <IconThongBao mau={color} />,
          tabBarBadge: soChuaDoc > 0 ? (soChuaDoc > 99 ? '99+' : soChuaDoc) : undefined,
          tabBarBadgeStyle: { backgroundColor: mau.chinhChu, color: '#ffffff', fontSize: 11 },
        }}
      />
      <Tabs.Screen name="tai-khoan" options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <IconTaiKhoan mau={color} /> }} />
    </Tabs>
  );
}
