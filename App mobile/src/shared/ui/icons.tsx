import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Biểu tượng thanh tab: nét mảnh 1.8 cùng kiểu với biểu tượng con mắt của web. Vẽ bằng react-native-svg, không thêm thư viện icon.

type P = { mau: ColorValue; co?: number };

function Khung({ co = 24, children }: { co?: number; children: React.ReactNode }) {
  return <Svg width={co} height={co} viewBox="0 0 24 24">{children}</Svg>;
}

const net = (mau: ColorValue) => ({ stroke: mau, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

export function IconTrangChu({ mau, co }: P) {
  return (
    <Khung co={co}>
      <Path d="M3.5 10.5 12 3.5l8.5 7" {...net(mau)} />
      <Path d="M5.5 9v11h13V9" {...net(mau)} />
      <Path d="M10 20v-5.5h4V20" {...net(mau)} />
    </Khung>
  );
}

export function IconXe({ mau, co }: P) {
  return (
    <Khung co={co}>
      <Circle cx={6} cy={16.5} r={3} {...net(mau)} />
      <Circle cx={18} cy={16.5} r={3} {...net(mau)} />
      <Path d="M6 16.5h6l3-6h-4.5M15 10.5l3 6M13.5 6.5h3l-1.5 4" {...net(mau)} />
    </Khung>
  );
}

export function IconTimXe({ mau, co }: P) {
  return (
    <Khung co={co}>
      <Path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" {...net(mau)} />
      <Circle cx={12} cy={10} r={2.4} {...net(mau)} />
    </Khung>
  );
}

export function IconThongBao({ mau, co }: P) {
  return (
    <Khung co={co}>
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" {...net(mau)} />
      <Path d="M10 20.5a2 2 0 0 0 4 0" {...net(mau)} />
    </Khung>
  );
}

export function IconTaiKhoan({ mau, co }: P) {
  return (
    <Khung co={co}>
      <Circle cx={12} cy={8.5} r={3.8} {...net(mau)} />
      <Path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" {...net(mau)} />
    </Khung>
  );
}

/** Mũi tên nhỏ ">" ở cuối dòng bấm được. */
export function IconTiep({ mau, co = 18 }: P) {
  return (
    <Khung co={co}>
      <Path d="M9 5.5 15.5 12 9 18.5" {...net(mau)} />
    </Khung>
  );
}

/** Ô đỗ trống (trạng thái rỗng). */
export function IconODo({ mau, co = 40 }: P) {
  return (
    <Khung co={co}>
      <Rect x={5} y={3.5} width={14} height={17} rx={2} {...net(mau)} strokeDasharray="3 2.5" />
      <Path d="M10 15.5v-7h2.6a2.2 2.2 0 0 1 0 4.4H10" {...net(mau)} />
    </Khung>
  );
}
