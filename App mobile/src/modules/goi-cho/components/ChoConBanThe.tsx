// Chép từ ChoConBanThe trong nha_de_xe/frontend/src/modules/goi-cho/components/GoiChoUi.tsx, sửa ở web thì nhớ sửa ở đây.
import { StyleSheet, Text, View } from 'react-native';
import { tenLoaiXe } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';
import type { ChoConBan } from '../models';

/** Số chỗ còn bán của một loại xe, kèm thanh đã dùng (đỏ khi hết chỗ). */
export function ChoConBanThe({ c }: { c: ChoConBan }) {
  const daDung = c.sucChua - c.soChoConBan;
  const phanTram = c.sucChua ? Math.round((daDung / c.sucChua) * 100) : 100;
  const het = c.soChoConBan <= 0;
  return (
    <View style={[s.the, het && s.het]}>
      <View style={s.dau}>
        <Text style={s.ten}>{tenLoaiXe(c.loaiXe)}</Text>
        <Text style={[s.so, het && { color: mau.loi }]}>{het ? 'Hết chỗ' : `Còn ${c.soChoConBan} / ${c.sucChua} chỗ`}</Text>
      </View>
      <View style={s.thanh}><View style={[s.day, { width: `${Math.min(100, phanTram)}%`, backgroundColor: het ? mau.loi : mau.ok }]} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  the: { flex: 1, minWidth: 150, backgroundColor: mau.the, borderRadius: bo.vua, borderWidth: 1, borderColor: mau.vien, padding: khoang.m, gap: khoang.s },
  het: { borderColor: mau.loi, backgroundColor: mau.loiNen },
  dau: { gap: 2 },
  ten: { fontSize: chu.nho, color: mau.mo, fontWeight: '600' },
  so: { fontSize: chu.thuong, color: mau.chu, fontWeight: '700' },
  thanh: { height: 6, borderRadius: 3, backgroundColor: mau.the2, overflow: 'hidden' },
  day: { height: 6, borderRadius: 3 },
});
