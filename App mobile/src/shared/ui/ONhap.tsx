import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { bo, chu, khoang, mau } from '@/shared/theme';

type Props = TextInputProps & {
  nhan: string;
  /** true: ô mật khẩu, có nút con mắt hiện / ẩn. */
  matKhau?: boolean;
  ref?: Ref<TextInputInstance>;
};

/** Ô nhập có nhãn (.xt-truong + .o-nhap ở web). Truyền ref để bấm "Tiếp" trên bàn phím thì nhảy sang ô sau. */
export function ONhap({ nhan, matKhau = false, ref, style, ...props }: Props) {
  const [hien, setHien] = useState(false);
  const [dangChon, setDangChon] = useState(false);
  return (
    <View style={s.truong}>
      <Text style={s.nhan}>{nhan}</Text>
      <View>
        <TextInput
          ref={ref}
          accessibilityLabel={nhan}
          placeholderTextColor={mau.chuGoiY}
          secureTextEntry={matKhau && !hien}
          autoCapitalize={matKhau ? 'none' : props.autoCapitalize}
          autoCorrect={matKhau ? false : props.autoCorrect}
          {...props}
          onFocus={(e) => { setDangChon(true); props.onFocus?.(e); }}
          onBlur={(e) => { setDangChon(false); props.onBlur?.(e); }}
          style={[s.o, dangChon && s.oChon, matKhau && { paddingRight: 56 }, style]}
        />
        {matKhau && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            hitSlop={8}
            onPress={() => setHien(!hien)}
            style={s.mat}
          >
            <IconMat hien={hien} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Hai biểu tượng con mắt chép đúng nét từ DangNhapPage.tsx của web. */
function IconMat({ hien }: { hien: boolean }) {
  const net = { stroke: mau.mo, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {hien ? (
        <>
          <Path d="M3 3l18 18" {...net} />
          <Path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.9" {...net} />
          <Path d="M6.6 6.6A17 17 0 0 0 2.5 12S6 19 12 19a9.6 9.6 0 0 0 5.4-1.6" {...net} />
          <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...net} />
        </>
      ) : (
        <>
          <Path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" {...net} />
          <Circle cx={12} cy={12} r={3} {...net} />
        </>
      )}
    </Svg>
  );
}

const s = StyleSheet.create({
  truong: { gap: khoang.s },
  nhan: { fontSize: chu.nho, fontWeight: '600', color: mau.nhanO },
  o: {
    height: 52, paddingHorizontal: khoang.l, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.vien,
    backgroundColor: mau.the, fontSize: 16, color: mau.chu,
  },
  oChon: { borderColor: mau.chinh },
  mat: { position: 'absolute', right: 4, top: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
});
