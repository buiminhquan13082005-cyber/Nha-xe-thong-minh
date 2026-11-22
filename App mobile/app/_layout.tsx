import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RaVaoProvider } from '@/modules/cong-ra-vao/RaVaoContext';
import { ThongBaoProvider } from '@/modules/thong-bao/ThongBaoContext';
import { DieuHuongToanCuc } from '@/modules/tim-xe/components/DieuHuongToanCuc';
import { AuthProvider, useAuth } from '@/shared/auth/AuthContext';
import { mau } from '@/shared/theme';

/**
 * Gốc của app: AuthProvider (phiên + SignalR), rồi các bộ theo dõi chỉ chạy khi đã đăng nhập:
 * RaVaoProvider (xác nhận xe ra 60 giây), ThongBaoProvider (số chưa đọc, thẻ thông báo nổi), DieuHuongToanCuc (chỉ đường khi xe vừa qua cổng).
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <DieuHuongTheoPhien />
    </AuthProvider>
  );
}

/** Thanh tiêu đề của các màn mở từ trang khác (có nút quay lại). */
const coTieuDe = (title: string) => ({
  headerShown: true, title, headerTintColor: mau.chu, headerBackTitle: 'Quay lại',
  headerStyle: { backgroundColor: mau.nen }, headerShadowVisible: false,
  headerTitleStyle: { fontWeight: '700' as const },
});

/**
 * Chặn màn theo phiên (Stack.Protected). Phiên đổi thì expo-router tự chuyển màn, các màn không phải tự điều hướng:
 * đăng nhập xong → vào thanh tab; đăng xuất hoặc API báo 401 (đăng nhập ở máy khác) → về Đăng nhập, hiện câu của server.
 * Đang đọc phiên đã lưu thì phủ vòng quay lên trên, để không thấy màn Đăng nhập loé lên rồi mới vào tab.
 */
function DieuHuongTheoPhien() {
  const { phien, dangNap, trangSauDangNhap } = useAuth();
  const coPhien = !!phien;
  return (
    <RaVaoProvider batDau={coPhien}>
      <ThongBaoProvider batDau={coPhien}>
        <View style={s.goc}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: mau.nen } }}>
            <Stack.Protected guard={coPhien} redirectTo="/dang-nhap">
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="xac-nhan-ra/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="ra-vao" options={coTieuDe('Ra vào')} />
              <Stack.Screen name="phi-qua-han/[xeId]" options={coTieuDe('Trả phí quá hạn')} />
              <Stack.Screen name="mua-goi/[xeId]" options={coTieuDe('Mua / gia hạn gói')} />
              <Stack.Screen name="so-do" options={coTieuDe('Sơ đồ chỗ trống')} />
              <Stack.Screen name="nhom-gia-dinh" options={coTieuDe('Nhóm gia đình')} />
              <Stack.Screen name="doi-mat-khau" options={coTieuDe('Đổi mật khẩu')} />
            </Stack.Protected>
            <Stack.Protected guard={!coPhien} redirectTo={trangSauDangNhap}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Screen name="kiem-tra-ket-noi" options={coTieuDe('Kiểm tra kết nối')} />
          </Stack>
          {coPhien && <DieuHuongToanCuc />}
          {dangNap && (
            <View style={[StyleSheet.absoluteFill, s.cho]}>
              <ActivityIndicator size="large" color={mau.chinh} />
            </View>
          )}
        </View>
      </ThongBaoProvider>
    </RaVaoProvider>
  );
}

const s = StyleSheet.create({
  goc: { flex: 1, backgroundColor: mau.nen },
  cho: { alignItems: 'center', justifyContent: 'center', backgroundColor: mau.nen },
});
