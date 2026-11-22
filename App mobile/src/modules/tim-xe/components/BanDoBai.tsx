// Chép và chỉnh từ nha_de_xe/frontend/src/modules/tim-xe/components/BanDoBai.tsx, sửa ở web thì nhớ sửa ở đây.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Polyline } from 'react-native-svg';
import { mau } from '@/shared/theme';
import { SoChay, useChayMotLan, useVongLap } from '@/shared/ui/chuyenDong';
import { chuoiToaDo, thoiGianChay, tinhHanhTrinh, viTriMuiTen, type HanhTrinh } from '../banDo';
import type { DuongDiBanDo, KhuCho, MucCho } from '../models';
import { TEN_MUC } from '../models';
import { CONG_VAO_X, ghepKhuXeMay, KHU_XE_MAY_TREN_SO_DO, KICH_THUOC_ANH } from '../soDoXeMay';

const { rong: W, cao: H } = KICH_THUOC_ANH;
const ANH_SO_DO = require('../../../../assets/so-do-bai.png');
const XANH_DUONG = '#1f6fd1';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Màu chấm khu (giống .diem-khu.muc-* của web). */
export const MAU_MUC: Record<MucCho | 'CHUA', string> = { CON_NHIEU: mau.ok, SAP_DAY: mau.canh, DAY: mau.loi, CHUA: '#8a8f98' };

/** Hộp chứa mỗi chấm: đủ rộng để chạm (≥ 44pt) và để chấm nằm giữa đúng toạ độ (RN không có translate(-50%)). */
const HOP_CHAM = { rong: 88, cao: 48 };

/**
 * Ảnh "Phương án bố trí bãi đỗ xe" + 3 chấm khu xe máy (R, S, Hầm) + đường đi vẽ bằng SVG đè lên ảnh.
 * SVG dùng viewBox đúng kích thước gốc của ảnh nên co giãn cùng ảnh, nét vẽ không méo.
 * onChamKhu có thì chấm là nút bấm được; không có thì chỉ xem.
 */
export function BanDoBai({ khu, duong, khuDichId, khuChonId, hienViTri = false, viTri = CONG_VAO_X, nhanCuoi, onChamKhu, children }: {
  khu: KhuCho[] | undefined;
  /** Đường vẽ trên sơ đồ (đường vào khu hoặc đường ra cổng): chỉ cần các điểm. */
  duong?: Pick<DuongDiBanDo, 'diem'> | null;
  khuDichId?: number | null;
  khuChonId?: number | null;
  /** Ghim "Bạn đang ở đây" tại Cổng vào X (vừa qua cổng, chưa có GPS). */
  hienViTri?: boolean;
  /** Chỗ đặt ghim "Bạn đang ở đây" (tỉ lệ 0..1). Mặc định Cổng vào X; đường ra: đầu khu xe vừa rời. */
  viTri?: { x: number; y: number };
  /** Nhãn ghim ở điểm cuối đường (ví dụ "Cổng ra Y"), khi điểm đến không phải một khu. */
  nhanCuoi?: string;
  onChamKhu?: (k: KhuCho) => void;
  children?: ReactNode;
}) {
  const [rong, setRong] = useState(0);
  const cao = (rong * H) / W;
  const theoMa = ghepKhuXeMay(khu);
  const diem = duong?.diem ?? [];
  const toaDo = chuoiToaDo(diem);
  const hanhTrinh = useMemo(() => tinhHanhTrinh(diem), [toaDo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={s.khung} onLayout={(e) => setRong(e.nativeEvent.layout.width)}>
      {/* Kích thước ảnh ghi rõ bằng số = đúng khung. Chỉ dùng absoluteFill thì Android vẽ ảnh theo cỡ gốc (phóng to, lệch với đường đi). */}
      {rong > 0 && (
        <Image source={ANH_SO_DO} style={{ position: 'absolute', left: 0, top: 0, width: rong, height: cao }}
          resizeMode="stretch" accessibilityLabel="Sơ đồ bố trí bãi đỗ xe" />
      )}
      <Svg style={{ position: 'absolute', left: 0, top: 0 }} width={rong} height={cao} viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none" pointerEvents="none">
        {hanhTrinh && <DuongDi toaDo={toaDo} diem={diem} tong={hanhTrinh.tong} />}
        {hienViTri && <ViTriCuaBan viTri={viTri} />}
      </Svg>

      {rong > 0 && hanhTrinh && <XeChay key={toaDo} hanhTrinh={hanhTrinh} tiLe={rong / W} />}

      {rong > 0 && nhanCuoi && diem.length > 1 && (() => {
        const c = diem[diem.length - 1];
        return (
          <View pointerEvents="none" style={[s.hopCham, { left: c.x * rong - HOP_CHAM.rong / 2, top: c.y * cao - HOP_CHAM.cao / 2 }]}>
            <View style={s.ghimDich}><Text style={s.ghimChu}>{nhanCuoi}</Text></View>
            <ChamKhu nhan="Y" mauCham={mau.chu} laChon={false} laDich />
          </View>
        );
      })()}

      {rong > 0 && hienViTri && (
        <View pointerEvents="none" style={[s.ghimODay, { left: viTri.x * rong - 4, top: viTri.y * cao - 34 }]}>
          <Text style={s.ghimChu}>Bạn đang ở đây</Text>
        </View>
      )}

      {rong > 0 && KHU_XE_MAY_TREN_SO_DO.map((c) => {
        const k = theoMa.get(c.ma);
        const moTa = k ? `${c.ten}: còn ${k.conLai}/${k.sucChua} chỗ (${TEN_MUC[k.muc]})` : `${c.ten}: chưa có số liệu`;
        const laDich = !!k && k.id === khuDichId;
        const laChon = !!k && k.id === khuChonId;
        const mauCham = MAU_MUC[k ? k.muc : 'CHUA'];
        const viTri = { left: (c.x / 100) * rong - HOP_CHAM.rong / 2, top: (c.y / 100) * cao - HOP_CHAM.cao / 2 };
        const cham = <ChamKhu nhan={c.nhan} so={k?.conLai} mauCham={mauCham} laChon={laChon} laDich={laDich} />;
        return (
          <View key={c.ma} style={[s.hopCham, viTri]} pointerEvents="box-none">
            {laDich && <View style={s.ghimDich} pointerEvents="none"><Text style={s.ghimChu}>Điểm đến</Text></View>}
            {onChamKhu && k ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`${moTa}. Chạm để xem`} accessibilityState={{ selected: laChon }}
                onPress={() => onChamKhu(k)} style={s.vungCham} hitSlop={6}>
                {cham}
              </Pressable>
            ) : (
              <View accessibilityRole="image" accessibilityLabel={moTa} style={s.vungCham}>{cham}</View>
            )}
          </View>
        );
      })}
      {children}
    </View>
  );
}

/**
 * Đường đi: viền trắng "mọc" dần từ Cổng vào X (0,9 giây), rồi nét đứt xanh + mũi tên hiện ra, nét đứt chạy liên tục
 * về phía khu đích (giống .duong-vien / .duong-net / @keyframes chay-net của web).
 */
function DuongDi({ toaDo, diem, tong }: { toaDo: string; diem: { x: number; y: number }[]; tong: number }) {
  const ve = useChayMotLan(toaDo, 900);
  const { v: chay } = useVongLap(900, { native: false });
  return (
    <G>
      <AnimatedPolyline points={toaDo} fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.9}
        strokeDasharray={[tong + 1, tong + 1]} strokeDashoffset={ve.interpolate({ inputRange: [0, 1], outputRange: [tong + 1, 0] })} />
      <AnimatedG opacity={ve.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0, 0, 1] })}>
        <AnimatedPolyline points={toaDo} fill="none" stroke={XANH_DUONG} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={[9, 7]} strokeDashoffset={chay.interpolate({ inputRange: [0, 1], outputRange: [0, -16] })} />
        {viTriMuiTen(diem).map((m, i) => (
          <Path key={i} d="M -3.5 -4 L 3 0 L -3.5 4" fill="none" stroke="#0b3d7a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) rotate(${m.goc.toFixed(0)})`} />
        ))}
      </AnimatedG>
    </G>
  );
}

/** Chấm "Bạn đang ở đây" (Cổng vào X, hoặc đầu khu khi đi ra), có vòng toả ra liên tục (giống .vi-tri-song của web). */
function ViTriCuaBan({ viTri }: { viTri: { x: number; y: number } }) {
  const { v: song, giam } = useVongLap(1800, { native: false });
  return (
    <G transform={`translate(${viTri.x * W} ${viTri.y * H})`}>
      {giam
        ? <Circle r={9} fill="rgba(31, 111, 209, 0.25)" />
        : <AnimatedCircle fill="rgba(31, 111, 209, 0.35)"
            r={song.interpolate({ inputRange: [0, 1], outputRange: [5, 20] })}
            opacity={song.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })} />}
      <Circle r={5} fill={XANH_DUONG} stroke="#ffffff" strokeWidth={2.5} />
    </G>
  );
}

/** Icon xe máy chạy dọc đường từ cổng tới khu đích, dừng ở đích một nhịp rồi chạy lại. Tắt khi giảm chuyển động. */
function XeChay({ hanhTrinh, tiLe }: { hanhTrinh: HanhTrinh; tiLe: number }) {
  const giay = thoiGianChay(hanhTrinh);
  const { v, giam } = useVongLap(giay * 820, { nghiMs: giay * 180, treMs: 900 });
  const hien = useChayMotLan(hanhTrinh, 300, { treMs: 900, native: true });
  if (giam) return null;
  const moc = hanhTrinh.diem.map((d) => d.moc);
  const NUA = 11;
  const translateX = v.interpolate({ inputRange: moc, outputRange: hanhTrinh.diem.map((d) => d.x * tiLe - NUA) });
  const translateY = v.interpolate({ inputRange: moc, outputRange: hanhTrinh.diem.map((d) => d.y * tiLe - NUA) });
  return (
    <Animated.View pointerEvents="none" style={[s.xeChay, { opacity: hien, transform: [{ translateX }, { translateY }] }]}>
      <Svg width={NUA * 2} height={NUA * 2} viewBox="-11 -11 22 22">
        <Circle r={9.5} fill={XANH_DUONG} stroke="#ffffff" strokeWidth={2} />
        <Circle cx={-3.6} cy={2.4} r={2.1} fill="none" stroke="#ffffff" strokeWidth={1.5} />
        <Circle cx={3.6} cy={2.4} r={2.1} fill="none" stroke="#ffffff" strokeWidth={1.5} />
        <Path d="M -3.6 2.4 L -1 -1.3 L 2.3 -1.3 L 3.6 2.4 M 2.3 -1.3 L 1.5 -3.8 L 3.4 -3.8" fill="none" stroke="#ffffff"
          strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

/**
 * Chấm khu: màu chuyển mượt khi đổi mức (còn nhiều → sắp đầy → đầy), số chỗ đếm lên/xuống,
 * nảy nhẹ khi được chọn, và có vòng toả khi là điểm đến (giống .diem-khu.diem-dich / @keyframes nhip-dich của web).
 */
function ChamKhu({ nhan, so, mauCham, laChon, laDich }: { nhan: string; so?: number; mauCham: string; laChon: boolean; laDich: boolean }) {
  // Màu: giữ màu cũ, chạy 0 -> 1 sang màu mới trong 0,6 giây
  const mauTruoc = useRef(mauCham);
  const [chuyenMau, setChuyenMau] = useState(() => ({ tu: mauCham, den: mauCham, v: new Animated.Value(1) }));
  useEffect(() => {
    if (mauTruoc.current === mauCham) return;
    const moi = { tu: mauTruoc.current, den: mauCham, v: new Animated.Value(0) };
    mauTruoc.current = mauCham;
    setChuyenMau(moi);
    Animated.timing(moi.v, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
  }, [mauCham]);
  const nen = chuyenMau.v.interpolate({ inputRange: [0, 1], outputRange: [chuyenMau.tu, chuyenMau.den] });

  const nay = useChayMotLan(laChon, 380, { native: true });
  const scale = laChon ? nay.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.2, 1] }) : 1;
  const { v: nhip } = useVongLap(1600, { bat: laDich });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {laDich && (
        <Animated.View pointerEvents="none" style={[s.vongDich, {
          opacity: nhip.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scaleX: nhip.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) },
            { scaleY: nhip.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
        }]} />
      )}
      <Animated.View style={[s.cham, { backgroundColor: nen }, laChon && s.chamChon, laDich && s.chamDich]}>
        <View style={s.chamMa}><Text style={s.chamMaChu}>{nhan}</Text></View>
        {so !== undefined && <SoChay gia={so} style={s.chamSo} />}
      </Animated.View>
    </Animated.View>
  );
}

/** Chú thích màu dưới sơ đồ (.chu-thich-so-do của web). */
export function ChuThichSoDo() {
  const muc: [keyof typeof MAU_MUC, string][] = [
    ['CON_NHIEU', `${TEN_MUC.CON_NHIEU} (trên 20%)`], ['SAP_DAY', `${TEN_MUC.SAP_DAY} (20% trở xuống)`],
    ['DAY', TEN_MUC.DAY], ['CHUA', 'Chưa có số liệu'],
  ];
  return (
    <View style={s.chuThich}>
      {muc.map(([m, ten]) => (
        <View key={m} style={s.chuThichMuc}>
          <View style={[s.chuThichCham, { backgroundColor: MAU_MUC[m] }]} />
          <Text style={s.chuThichChu}>{ten}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  khung: { width: '100%', aspectRatio: W / H, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e9eef2' },
  hopCham: { position: 'absolute', width: HOP_CHAM.rong, height: HOP_CHAM.cao, alignItems: 'center', justifyContent: 'center' },
  vungCham: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cham: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 2, paddingRight: 6, paddingVertical: 2,
    borderRadius: 99, borderWidth: 2, borderColor: '#ffffff', elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  chamChon: { borderColor: mau.chu, borderWidth: 3 },
  chamDich: { borderColor: '#ffd84d', borderWidth: 3 },
  chamMa: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  chamMaChu: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  chamSo: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  xeChay: { position: 'absolute', left: 0, top: 0, zIndex: 3, elevation: 4 },
  vongDich: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 99, backgroundColor: XANH_DUONG },
  ghimODay: { position: 'absolute', backgroundColor: XANH_DUONG, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  ghimDich: { position: 'absolute', top: -10, backgroundColor: mau.chu, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  ghimChu: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  chuThich: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chuThichMuc: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chuThichCham: { width: 12, height: 12, borderRadius: 6 },
  chuThichChu: { fontSize: 12, color: mau.mo },
});
