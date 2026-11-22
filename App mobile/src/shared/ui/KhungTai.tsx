import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { chu, khoang, mau } from '@/shared/theme';
import { Nut, The, ThongBao } from './ui';

/**
 * Thẻ có tiêu đề, tự lo 3 trạng thái của một lần tải: đang tải lần đầu (vòng quay), lỗi (thông điệp + Thử lại), có dữ liệu.
 * Mỗi thẻ tải riêng nên một API lỗi không làm trắng cả màn.
 */
export function KhungTai({ tieuDe, dangTai, loi, coDuLieu, onThuLai, children, phai }: {
  tieuDe: string; dangTai: boolean; loi: string | null; coDuLieu: boolean; onThuLai: () => void;
  children: ReactNode; phai?: ReactNode;
}) {
  return (
    <The style={{ gap: khoang.m }}>
      <View style={s.dau}>
        <Text style={s.tieuDe} accessibilityRole="header">{tieuDe}</Text>
        {phai}
      </View>
      {!coDuLieu && dangTai && <ActivityIndicator color={mau.chinh} style={s.quay} />}
      {!coDuLieu && !dangTai && loi && (
        <>
          <ThongBao loai="loi">{loi}</ThongBao>
          <Nut kieu="phu" nhan="Thử lại" onPress={onThuLai} />
        </>
      )}
      {coDuLieu && children}
    </The>
  );
}

const s = StyleSheet.create({
  dau: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: khoang.s },
  tieuDe: { fontSize: chu.vua, fontWeight: '700', color: mau.chu, flexShrink: 1 },
  quay: { paddingVertical: khoang.l },
});
