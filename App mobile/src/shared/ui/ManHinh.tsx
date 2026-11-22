import type { ReactNode, Ref } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { chu, khoang, mau } from '@/shared/theme';

/**
 * Khung chung của một màn: tiêu đề lớn (tuỳ chọn), cuộn được, kéo xuống để tải lại.
 * Màn mở từ trang khác đã có thanh tiêu đề của Stack (nút quay lại): bỏ tieuDe và truyền vien={[]} (thanh tiêu đề đã chừa tai thỏ).
 */
export function ManHinh({ tieuDe, phai, children, dangKeo, onKeo, cuonRef, vien = ['top'] }: {
  tieuDe?: string; phai?: ReactNode; children: ReactNode; dangKeo?: boolean; onKeo?: () => void;
  cuonRef?: Ref<ScrollViewInstance>; vien?: Edge[];
}) {
  return (
    <SafeAreaView style={s.manHinh} edges={vien}>
      <ScrollView
        ref={cuonRef}
        contentContainerStyle={s.noiDung}
        keyboardShouldPersistTaps="handled"
        refreshControl={onKeo ? <RefreshControl refreshing={!!dangKeo} onRefresh={onKeo} colors={[mau.chinh]} tintColor={mau.chinh} /> : undefined}
      >
        {tieuDe && (
          <View style={s.dau}>
            <Text style={s.tieuDe} accessibilityRole="header">{tieuDe}</Text>
            {phai}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export const kieuChung = StyleSheet.create({
  tieuDeMuc: { fontSize: chu.vua, fontWeight: '700', color: mau.chu, marginTop: khoang.s },
  mo: { fontSize: chu.thuong, color: mau.mo },
  moNho: { fontSize: chu.nho, color: mau.mo },
  hangNut: { flexDirection: 'row', flexWrap: 'wrap', gap: khoang.s },
  nutGian: { flex: 1, minWidth: 140 },
  dong: { flexDirection: 'row', justifyContent: 'space-between', gap: khoang.s },
  nhan: { fontSize: chu.nho, color: mau.mo },
  giaTri: { fontSize: chu.thuong, color: mau.chu, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  bienSo: { fontSize: 20, fontWeight: '800', color: mau.chu, letterSpacing: 0.5 },
  vach: { borderTopWidth: 1, borderTopColor: mau.vien, paddingTop: khoang.m },
  toSang: { borderColor: mau.chinh, borderWidth: 2 },
});

const s = StyleSheet.create({
  manHinh: { flex: 1, backgroundColor: mau.nen },
  noiDung: { padding: khoang.l, gap: khoang.l, paddingBottom: khoang.xxl },
  dau: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: khoang.s, marginTop: khoang.s },
  tieuDe: { fontSize: chu.rat_lon, fontWeight: '800', color: mau.chu, flexShrink: 1 },
});
