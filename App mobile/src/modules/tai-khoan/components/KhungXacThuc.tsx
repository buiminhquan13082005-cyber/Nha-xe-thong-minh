import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { bong, khoang, mau } from '@/shared/theme';

/**
 * Khung chung của Đăng nhập / Đăng ký / Quên mật khẩu, vẽ giống KhungXacThuc.tsx của web:
 * vạch sơn ô đỗ phía trên, ô giữa tô hồng cam, hai ô bên bạc hà / vàng; logo nằm giữa ô; dưới là nhãn, tiêu đề, mô tả, form.
 * Bàn phím hiện thì khung tự đẩy lên và cuộn được, ô đang nhập không bị che.
 */
export function KhungXacThuc({ nhan, tieuDe, moTa, children, chan }: {
  nhan: string; tieuDe: string; moTa: string; children: ReactNode; chan?: ReactNode;
}) {
  return (
    <SafeAreaView style={s.manHinh} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.manHinh} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.cuon} keyboardShouldPersistTaps="handled">
          <View style={s.hero} accessible={false} importantForAccessibility="no-hide-descendants">
            <Svg width="100%" height="100%" viewBox="0 0 390 220" preserveAspectRatio="xMidYMax slice" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="xtMo" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0.5" stopColor={mau.nen} stopOpacity={0} />
                  <Stop offset="1" stopColor={mau.nen} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x={79} y={79} width={76} height={150} fill={mau.phuBacHa} fillOpacity={0.22} />
              <Rect x={235} y={79} width={76} height={150} fill={mau.phuVang} fillOpacity={0.35} />
              <Path d="M-10 34 H400" stroke={mau.nhanO} strokeOpacity={0.14} strokeWidth={2} strokeDasharray="22 16" />
              <Path d="M-10 78 H400" stroke={mau.nhanO} strokeOpacity={0.2} strokeWidth={2} />
              <Path d="M0 78 V220 M78 78 V220 M156 78 V220 M234 78 V220 M312 78 V220 M390 78 V220" stroke={mau.nhanO} strokeOpacity={0.2} strokeWidth={2} />
              <Rect x={157} y={79} width={76} height={150} fill={mau.chinh} fillOpacity={0.14} />
              <Path d="M156 78 V220 M234 78 V220 M156 78 H234" stroke={mau.chinh} strokeWidth={3} fill="none" />
              <Rect x={0} y={0} width={390} height={220} fill="url(#xtMo)" />
            </Svg>
            <View style={s.logo}>
              <Image source={require('../../../../assets/logo.png')} style={s.logoAnh} resizeMode="contain" accessibilityLabel="Logo nhà xe" />
            </View>
          </View>

          <View style={s.than}>
            <Text style={s.nhanNho}>{nhan.toUpperCase()}</Text>
            <Text style={s.tieuDe} accessibilityRole="header">{tieuDe}</Text>
            <Text style={s.moTa}>{moTa}</Text>
            <View style={s.form}>{children}</View>
          </View>

          {chan && <View style={s.chan}>{chan}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  manHinh: { flex: 1, backgroundColor: mau.nen },
  cuon: { flexGrow: 1 },
  hero: { height: 220, overflow: 'hidden' },
  logo: {
    position: 'absolute', top: 96, alignSelf: 'center', width: 104, height: 104, borderRadius: 26, padding: 8,
    backgroundColor: mau.the, borderWidth: 1, borderColor: mau.vien, ...bong,
  },
  logoAnh: { width: '100%', height: '100%' },
  than: { paddingHorizontal: khoang.xl, gap: khoang.s },
  nhanNho: { fontSize: 12, fontWeight: '600', letterSpacing: 1.6, color: mau.chinhChu },
  tieuDe: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.4, color: mau.chu },
  moTa: { fontSize: 15, lineHeight: 22, color: mau.mo },
  form: { marginTop: 20, gap: khoang.l },
  chan: { marginTop: 'auto', paddingVertical: 28, paddingHorizontal: khoang.xl, alignItems: 'center', gap: khoang.xs },
});
