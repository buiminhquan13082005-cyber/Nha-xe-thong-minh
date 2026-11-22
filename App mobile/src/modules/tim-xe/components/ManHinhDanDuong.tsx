// Chép và chỉnh từ nha_de_xe/frontend/src/modules/tim-xe/components/ManHinhDanDuong.tsx, sửa ở web thì nhớ sửa ở đây.
import { useState, type ReactNode } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { Nut, ThongBao } from '@/shared/ui/ui';
import { useChayMotLan } from '@/shared/ui/chuyenDong';
import { dinhDangNgay, hienThiBienSo } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';
import type { DieuHuongCuaToi, KhuCho, PhienDieuHuong } from '../models';
import { BanDoBai } from './BanDoBai';
import { DemNguocGiuCho, TheKhu, ThoiGianDaDo } from './KhuUi';

/** "21:30" từ dinhDangNgay ("19/11/2026 21:30"). */
const gioPhut = (s: string) => dinhDangNgay(s).split(' ')[1] ?? '';

/**
 * Màn hình dẫn đường trong bãi ("Google Maps thu nhỏ"). Không dùng GPS: vị trí bắt đầu là Cổng vào X,
 * "đã tới nơi" là lần camera hướng VÀO của khu quét được biển. Chạm chấm khu khác để đổi khu đích.
 */
export function ManHinhDanDuong({ du, khu, onDong, onDoiKhu }: {
  du: DieuHuongCuaToi;
  khu: KhuCho[] | undefined;
  onDong: () => void;
  onDoiKhu: (khuId: number) => Promise<void>;
}) {
  const p = du.phien;
  const tieuDe = !p ? 'Bãi xe máy' : p.trangThai === 'DANG_DAN' ? 'Đang dẫn đường' : 'Dẫn đường đã kết thúc';
  return (
    <Modal visible animationType="slide" onRequestClose={onDong} presentationStyle="fullScreen">
      <SafeAreaView style={s.manHinh}>
        <View style={s.dau}>
          <View style={{ flex: 1 }}>
            <Text style={s.nhanNho}>{tieuDe.toUpperCase()}</Text>
            {p && <Text style={s.bienSo}>{hienThiBienSo(p.bienSo)}</Text>}
          </View>
          <Nut kieu="phu" nhan={p?.trangThai === 'DANG_DAN' ? 'Thu nhỏ' : 'Đóng'} onPress={onDong} />
        </View>
        <ScrollView contentContainerStyle={s.than}>
          {p?.trangThai === 'DANG_DAN'
            ? <DangDan p={p} bayGio={du.bayGio} khu={khu} onDoiKhu={onDoiKhu} />
            : p ? <KetThuc p={p} khu={khu} onDong={onDong} />
            : du.hetCho ? <HetCho bienSo={du.hetCho.bienSo} khu={khu} /> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DangDan({ p, bayGio, khu, onDoiKhu }: { p: PhienDieuHuong; bayGio: string; khu: KhuCho[] | undefined; onDoiKhu: (id: number) => Promise<void> }) {
  const [chon, setChon] = useState<KhuCho | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [tin, setTin] = useState<{ loai: 'ok' | 'loi'; noiDung: string } | null>(null);
  const dich = khu?.find((k) => k.id === p.khuDich.id) ?? p.khuDich;
  const chonMoi = chon && (khu?.find((k) => k.id === chon.id) ?? chon);

  async function doi(k: KhuCho) {
    setDangGui(true); setTin(null);
    try {
      await onDoiKhu(k.id);
      setTin({ loai: 'ok', noiDung: `Đã đổi điểm đến sang ${k.ten}. Thời gian giữ chỗ vẫn giữ nguyên.` });
      setChon(null);
    } catch (e) { setTin({ loai: 'loi', noiDung: thongDiepLoi(e) }); }
    finally { setDangGui(false); }
  }

  return (
    <>
      <View style={s.huongDan} accessibilityLiveRegion="polite">
        <Text style={s.cau}>Đi tới <Text style={{ fontWeight: '800' }}>{dich.ten}</Text>, còn {dich.conLai} chỗ</Text>
        <Text style={s.mo}>
          {p.duong ? `Khoảng ${p.duong.tongMet} m từ Cổng vào X` : 'Chưa có đường đi trên sơ đồ'}
          {p.khuGoiYId !== p.khuDich.id && ' · khu bạn tự chọn'}
        </Text>
        <Text style={s.mo}>Giữ chỗ cho bạn còn <DemNguocGiuCho hetHanLuc={p.hetHanLuc} bayGio={bayGio} /></Text>
      </View>

      {p.canhBao && <ThongBao loai="canh">{`${p.canhBao.ten} đã đầy, mời bạn sang ${dich.ten} theo đường trên bản đồ.`}</ThongBao>}
      {tin && <ThongBao loai={tin.loai}>{tin.noiDung}</ThongBao>}

      <BanDoBai khu={khu} duong={p.duong} khuDichId={p.khuDich.id} khuChonId={chon?.id} hienViTri
        onChamKhu={(k) => setChon((c) => (c?.id === k.id ? null : k))} />

      {chonMoi
        ? <TheKhu khu={chonMoi} cheDo="dan-duong" laDich={chonMoi.id === p.khuDich.id} dangGui={dangGui}
            onChiDuong={() => void doi(chonMoi)} onDong={() => setChon(null)} />
        : <Text style={s.mo}>Muốn đỗ chỗ khác? Chạm vào chấm R, S hoặc Hầm trên bản đồ.</Text>}

      {p.duong && p.duong.diem.length > 1 && (
        <View style={s.cacBuoc}>
          {p.duong.diem.filter((d) => d.ten).map((d, i) => (
            <Text key={i} style={s.buoc}>{i + 1}. {d.ten}</Text>
          ))}
        </View>
      )}
    </>
  );
}

function KetQua({ loai, bieuTuong, tieuDe, children }: { loai: 'ok' | 'tin' | 'canh'; bieuTuong?: string; tieuDe: string; children?: ReactNode }) {
  const m = { ok: [mau.okNen, mau.ok], tin: [mau.tinNen, mau.tin], canh: [mau.canhNen, mau.canh] }[loai];
  // Biểu tượng bật ra (giống @keyframes bat-ra của web); "✓" thì tự vẽ dấu tích
  const bat = useChayMotLan(tieuDe, 450, { native: true });
  const scale = bat.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.3, 1.12, 1] });
  return (
    <View style={[s.ketQua, { backgroundColor: m[0] }]}>
      {bieuTuong && (
        <Animated.View style={{ opacity: bat, transform: [{ scale }] }}>
          {bieuTuong === '✓' ? <DauTich mauNet={m[1]} /> : <Text style={[s.bieuTuong, { color: m[1] }]}>{bieuTuong}</Text>}
        </Animated.View>
      )}
      <Text style={[s.ketQuaTieuDe, { color: m[1] }]}>{tieuDe}</Text>
      {children}
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const VONG = 2 * Math.PI * 23; // chu vi vòng tròn r = 23
const NET = 32; // chiều dài nét tích M15 27 L22 34 L37 18

/** Dấu tích "Đã đến bãi đỗ": vẽ vòng tròn rồi vẽ nét tích (giống .dau-tich của web). */
function DauTich({ mauNet }: { mauNet: string }) {
  const vong = useChayMotLan('vong', 600, { treMs: 150 });
  const net = useChayMotLan('net', 400, { treMs: 550 });
  return (
    <Svg width={56} height={56} viewBox="0 0 52 52">
      <AnimatedCircle cx={26} cy={26} r={23} fill="none" stroke={mauNet} strokeWidth={2.5} opacity={0.45} strokeLinecap="round"
        strokeDasharray={[VONG, VONG]} strokeDashoffset={vong.interpolate({ inputRange: [0, 1], outputRange: [VONG, 0] })} />
      <AnimatedPath d="M 15 27 L 22 34 L 37 18" fill="none" stroke={mauNet} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={[NET, NET]} strokeDashoffset={net.interpolate({ inputRange: [0, 1], outputRange: [NET, 0] })} />
    </Svg>
  );
}

function KetThuc({ p, khu, onDong }: { p: PhienDieuHuong; khu: KhuCho[] | undefined; onDong: () => void }) {
  const thuc = p.khuThucTe;
  return (
    <>
      {p.trangThai === 'DA_TOI' && thuc && (
        <KetQua loai="ok" bieuTuong="✓" tieuDe="Đã đến bãi đỗ thành công">
          <Text style={s.chu}>Đang đỗ xe tại <Text style={{ fontWeight: '800' }}>{thuc.ten}</Text></Text>
          <Text style={s.mo}>Vào khu lúc {gioPhut(thuc.vaoLuc)} · đã đỗ <ThoiGianDaDo tu={thuc.vaoLuc} /></Text>
        </KetQua>
      )}
      {p.trangThai === 'TOI_KHU_KHAC' && thuc && (
        <KetQua loai="tin" bieuTuong="i" tieuDe={`Bạn đã đỗ tại ${thuc.ten}`}>
          <Text style={s.chu}>Khác khu được chỉ định ({p.khuDich.ten}). Không sao, hệ thống ghi theo camera.</Text>
          <Text style={s.mo}>Vào khu lúc {gioPhut(thuc.vaoLuc)} · đã đỗ <ThoiGianDaDo tu={thuc.vaoLuc} /></Text>
        </KetQua>
      )}
      {p.trangThai === 'HET_HAN' && (
        <KetQua loai="canh" bieuTuong="!" tieuDe="Chưa xác nhận được vị trí xe">
          <Text style={s.chu}>{`Hết thời gian giữ chỗ ở ${p.khuDich.ten} mà camera khu chưa thấy xe. Đỗ xong, bạn có thể bấm "Đã đỗ xe" trong mục Tìm xe.`}</Text>
        </KetQua>
      )}
      {p.trangThai === 'DA_DONG' && (
        <KetQua loai="tin" tieuDe="Xe đã ra khỏi bãi">
          <Text style={s.chu}>Kết thúc dẫn đường, chỗ giữ ở {p.khuDich.ten} đã được trả lại.</Text>
        </KetQua>
      )}
      {thuc && <BanDoBai khu={khu} khuDichId={thuc.id} />}
      <Nut nhan="Đã hiểu" onPress={onDong} />
    </>
  );
}

function HetCho({ bienSo, khu }: { bienSo: string; khu: KhuCho[] | undefined }) {
  return (
    <>
      <KetQua loai="canh" bieuTuong="!" tieuDe="Bãi xe máy đã hết chỗ">
        <Text style={s.chu}>{`Xe ${hienThiBienSo(bienSo)} đã qua cổng nhưng các khu R, S, Hầm đều đã đầy nên chưa chỉ đường được. Vui lòng hỏi nhân viên bãi.`}</Text>
      </KetQua>
      <BanDoBai khu={khu} />
    </>
  );
}

const s = StyleSheet.create({
  manHinh: { flex: 1, backgroundColor: mau.nen },
  dau: { flexDirection: 'row', alignItems: 'center', gap: khoang.m, paddingHorizontal: khoang.l, paddingVertical: khoang.m, borderBottomWidth: 1, borderBottomColor: mau.vien },
  nhanNho: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: mau.chinhChu },
  bienSo: { fontSize: chu.lon, fontWeight: '800', color: mau.chu },
  than: { padding: khoang.l, gap: khoang.l, paddingBottom: khoang.xxl },
  huongDan: { gap: 4 },
  cau: { fontSize: chu.lon, color: mau.chu },
  mo: { fontSize: chu.thuong, color: mau.mo },
  chu: { fontSize: chu.thuong, color: mau.chu, textAlign: 'center' },
  cacBuoc: { gap: 4, backgroundColor: mau.the, borderRadius: bo.vua, padding: khoang.m, borderWidth: 1, borderColor: mau.vien },
  buoc: { fontSize: chu.nho, color: mau.chu },
  ketQua: { borderRadius: bo.lon, padding: khoang.xl, alignItems: 'center', gap: khoang.s },
  bieuTuong: { fontSize: 36, fontWeight: '900' },
  ketQuaTieuDe: { fontSize: chu.vua, fontWeight: '800', textAlign: 'center' },
});
