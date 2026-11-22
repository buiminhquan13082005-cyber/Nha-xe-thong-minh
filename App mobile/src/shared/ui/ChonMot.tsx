import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bo, chu, khoang, mau } from '@/shared/theme';

/** Chọn một trong vài lựa chọn (thay cho <select> ngắn của web), ví dụ Xe máy / Ô tô. */
export function ChonMot<T extends string | number>({ nhan, giaTri, luaChon, onChon }: {
  nhan?: string; giaTri: T; luaChon: { giaTri: T; ten: string }[]; onChon: (v: T) => void;
}) {
  return (
    <View style={{ gap: khoang.s }}>
      {nhan && <Text style={s.nhan}>{nhan}</Text>}
      <View style={s.hang} accessibilityRole="radiogroup">
        {luaChon.map((l) => {
          const chon = l.giaTri === giaTri;
          return (
            <Pressable
              key={String(l.giaTri)} accessibilityRole="radio" accessibilityState={{ selected: chon }}
              onPress={() => onChon(l.giaTri)} style={[s.o, chon && s.oChon]}
            >
              <Text style={[s.chu, chon && s.chuChon]}>{l.ten}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  nhan: { fontSize: chu.nho, fontWeight: '600', color: mau.nhanO },
  hang: { flexDirection: 'row', flexWrap: 'wrap', gap: khoang.s },
  o: { minHeight: 44, paddingHorizontal: khoang.l, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.vien, backgroundColor: mau.the, justifyContent: 'center' },
  oChon: { borderColor: mau.chinh, backgroundColor: mau.loiNen },
  chu: { fontSize: chu.thuong, color: mau.mo, fontWeight: '600' },
  chuChon: { color: mau.chinhChu },
});
