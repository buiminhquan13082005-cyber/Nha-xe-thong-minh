import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { mau } from '@/shared/theme';
import { tiLeCon } from '../demNguoc';

/** Vòng đếm ngược (thay cho thanh .dem-nguoc của web). Còn ≤ 10 giây thì chuyển đỏ như .dem-nguoc-gap. */
export function VongDemNguoc({ giay, co = 168 }: { giay: number; co?: number }) {
  const net = 12;
  const r = (co - net) / 2;
  const chuVi = 2 * Math.PI * r;
  const gap = giay <= 10;
  const mauVong = giay === 0 ? mau.chuGoiY : gap ? mau.loi : mau.ok;
  return (
    <View style={{ width: co, height: co }} accessibilityRole="timer" accessibilityLabel={`Còn ${giay} giây`}>
      <Svg width={co} height={co}>
        <Circle cx={co / 2} cy={co / 2} r={r} stroke={mau.vien} strokeWidth={net} fill="none" />
        <Circle
          cx={co / 2} cy={co / 2} r={r} stroke={mauVong} strokeWidth={net} fill="none" strokeLinecap="round"
          strokeDasharray={`${chuVi} ${chuVi}`} strokeDashoffset={chuVi * (1 - tiLeCon(giay))}
          transform={`rotate(-90 ${co / 2} ${co / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, s.giua]}>
        <Text style={[s.so, { color: mauVong }]}>{giay}</Text>
        <Text style={s.don}>giây</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  giua: { alignItems: 'center', justifyContent: 'center' },
  so: { fontSize: 52, fontWeight: '800', lineHeight: 58 },
  don: { fontSize: 14, color: mau.mo, marginTop: -4 },
});
