import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { bo, bong, chu, khoang, mau } from '@/shared/theme';

// Component giao diện dùng chung (tương ứng class .nut, .the, ThongBao trong shared/ui/ui.tsx của web).

type KieuNut = 'chinh' | 'phu' | 'ok' | 'loi';

const MAU_NUT: Record<KieuNut, { nen: string; chu: string; vien: string }> = {
  chinh: { nen: mau.chinh, chu: mau.chuTrenChinh, vien: mau.chinhDam },
  phu: { nen: mau.the, chu: mau.chu, vien: mau.vien },
  ok: { nen: mau.ok, chu: '#ffffff', vien: mau.ok },
  loi: { nen: mau.loi, chu: '#ffffff', vien: mau.loi },
};

/** Nút bấm. dangGui = true: hiện vòng quay và khoá nút (chống bấm hai lần khi đang gửi). */
export function Nut({ nhan, onPress, kieu = 'chinh', dangGui = false, tat = false, style }: {
  nhan: string; onPress: () => void; kieu?: KieuNut; dangGui?: boolean; tat?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const m = MAU_NUT[kieu];
  const khoa = tat || dangGui;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: khoa, busy: dangGui }}
      disabled={khoa}
      onPress={onPress}
      style={({ pressed }) => [s.nut, { backgroundColor: m.nen, borderColor: m.vien }, khoa && s.nutTat, pressed && s.nutNhan, style]}
    >
      {dangGui && <ActivityIndicator color={m.chu} style={{ marginRight: khoang.s }} />}
      <Text style={[s.nutChu, { color: m.chu }]}>{nhan}</Text>
    </Pressable>
  );
}

/** Thẻ nền trắng bo góc có bóng (.the ở web). */
export function The({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.the, style]}>{children}</View>;
}

type LoaiHop = 'ok' | 'loi' | 'canh' | 'tin';
const MAU_HOP: Record<LoaiHop, { nen: string; chu: string }> = {
  ok: { nen: mau.okNen, chu: mau.ok },
  loi: { nen: mau.loiNen, chu: mau.loi },
  canh: { nen: mau.canhNen, chu: mau.canh },
  tin: { nen: mau.tinNen, chu: mau.tin },
};

/** Hộp thông báo màu (lỗi, thành công, cảnh báo, tin). */
export function ThongBao({ loai, children }: { loai: LoaiHop; children: ReactNode }) {
  const m = MAU_HOP[loai];
  return (
    <View accessibilityRole={loai === 'loi' ? 'alert' : undefined} style={[s.hop, { backgroundColor: m.nen }]}>
      <Text style={[s.hopChu, { color: m.chu }]}>{children}</Text>
    </View>
  );
}

/** Nhãn nhỏ có màu (.nhan-ok / .nhan-cho / .nhan-loi / .nhan-tin ở web): trạng thái duyệt, trạng thái lượt gửi... */
export function Nhan({ chu: noiDung, loai }: { chu: string; loai: LoaiHop | 'mo' }) {
  const m = loai === 'mo' ? { nen: mau.the2, chu: mau.mo } : MAU_HOP[loai];
  return (
    <View style={[s.nhanO, { backgroundColor: m.nen }]}>
      <Text style={[s.nhanChu, { color: m.chu }]}>{noiDung}</Text>
    </View>
  );
}

/** Chữ bấm được (.xt-lien-ket ở web). Vùng bấm cao ít nhất 44 điểm cho dễ chạm. */
export function LienKet({ nhan, onPress, mo = false }: { nhan: string; onPress: () => void; mo?: boolean }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={({ pressed }) => [s.lienKet, pressed && s.nutNhan]}>
      <Text style={[s.lienKetChu, mo && s.lienKetMo]}>{nhan}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  nhanO: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  nhanChu: { fontSize: 12, fontWeight: '700' },
  lienKet: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 2 },
  lienKetChu: { fontSize: chu.thuong, fontWeight: '600', color: mau.chinhChu },
  lienKetMo: { fontWeight: '500', color: mau.mo, fontSize: 14 },
  nut: {
    minHeight: 48, paddingHorizontal: khoang.l, borderRadius: bo.lon, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  nutTat: { opacity: 0.55 },
  nutNhan: { opacity: 0.85 },
  nutChu: { fontSize: chu.thuong, fontWeight: '700' },
  the: { backgroundColor: mau.the, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.vien, padding: khoang.l, ...bong },
  hop: { borderRadius: bo.vua, paddingVertical: khoang.m, paddingHorizontal: khoang.l },
  hopChu: { fontSize: chu.thuong, lineHeight: 21 },
});
