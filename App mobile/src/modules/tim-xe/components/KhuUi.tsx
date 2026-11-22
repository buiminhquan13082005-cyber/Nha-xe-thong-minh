// Chép và chỉnh từ nha_de_xe/frontend/src/modules/tim-xe/components/MucChoKhu.tsx, TheKhu.tsx, DemNguocGiuCho.tsx
// và ThoiGianDaDo trong ManHinhDanDuong.tsx. Sửa ở web thì nhớ sửa ở đây.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/shared/auth/AuthContext';
import { Nhan, Nut } from '@/shared/ui/ui';
import { SoChay } from '@/shared/ui/chuyenDong';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { bo, chu, khoang, mau } from '@/shared/theme';
import { dinhDangGiuCho, giayGiuChoCon, thoiGianDaDo } from '../banDo';
import type { KhuCho, MucCho } from '../models';
import { TEN_MUC } from '../models';
import { MAU_MUC } from './BanDoBai';

const LOAI_NHAN_MUC: Record<MucCho, 'ok' | 'canh' | 'loi'> = { CON_NHIEU: 'ok', SAP_DAY: 'canh', DAY: 'loi' };

export function NhanMuc({ muc }: { muc: MucCho }) {
  return <Nhan chu={TEN_MUC[muc]} loai={LOAI_NHAN_MUC[muc]} />;
}

/**
 * Mức chỗ các khu xe máy: còn trên 20% là "Còn nhiều", từ 20% trở xuống "Sắp đầy", hết là "Đầy".
 * Số liệu tính từ dữ liệu (sức chứa − xe đang ghi ở khu − suất đang giữ), không phải AI.
 */
export function MucChoKhu({ khu, chiTiet = false, khuNoiBat }: { khu: KhuCho[]; chiTiet?: boolean; khuNoiBat?: number | null }) {
  if (khu.length === 0) return <Text style={s.mo}>Chưa có khu xe máy nào.</Text>;
  return (
    <View style={s.luoi}>
      {khu.map((k) => {
        const dung = Math.min(100, k.sucChua > 0 ? ((k.soXe + k.soGiu) / k.sucChua) * 100 : 100);
        return (
          <View key={k.id} style={[s.theKhu, khuNoiBat === k.id && { borderColor: mau.chinh, borderWidth: 2 }]}>
            <View style={s.dau}>
              <Text style={s.ten}>{k.ten}</Text>
              <NhanMuc muc={k.muc} />
            </View>
            <Text style={s.mo}><Text style={s.so}>{k.conLai}</Text> / {k.sucChua} chỗ còn</Text>
            <View style={s.thanh}><View style={[s.day, { width: `${dung}%`, backgroundColor: MAU_MUC[k.muc] }]} /></View>
            {chiTiet && (
              <Text style={s.moNho}>
                {k.soXe} xe đang ở khu · {k.soGiu} suất đang giữ
                {k.khoangCachTuCong != null && ` · cách cổng ${Math.round(k.khoangCachTuCong)} m`}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Thẻ nhỏ khi chạm một chấm khu: tên, chỗ còn, mức, độ dài đường đi từ Cổng vào X và nút thao tác.
 * cheDo "dan-duong": "Chỉ đường tới đây" (đổi khu đích) · "xem": "Xem đường đi" / "Ẩn đường".
 * Khu đầy (chỗ còn đã trừ suất đang giữ ≤ 0) thì nút khoá, ghi "Khu đã đầy".
 */
export function TheKhu({ khu, cheDo, laDich = false, dangHienDuong = false, dangGui = false, onChiDuong, onXemDuong, onAnDuong, onDong }: {
  khu: KhuCho;
  cheDo: 'dan-duong' | 'xem';
  laDich?: boolean;
  dangHienDuong?: boolean;
  dangGui?: boolean;
  onChiDuong?: () => void;
  onXemDuong?: () => void;
  onAnDuong?: () => void;
  onDong: () => void;
}) {
  const { services } = useAuth();
  const duong = useTaiDuLieu(() => services.dieuHuong.layDuongDi(khu.id), [services, khu.id]);
  const day = khu.conLai <= 0;

  return (
    <View style={s.the} accessibilityLabel={`Thông tin ${khu.ten}`}>
      <View style={s.dau}>
        <Text style={s.ten}>{khu.ten}</Text>
        <NhanMuc muc={khu.muc} />
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng thẻ" onPress={onDong} hitSlop={10} style={s.nutX}>
          <Text style={s.nutXChu}>✕</Text>
        </Pressable>
      </View>
      <View style={s.hangSo}><SoChay gia={khu.conLai} style={s.so} /><Text style={s.mo}> / {khu.sucChua} chỗ còn trống</Text></View>
      <Text style={s.moNho}>
        {duong.duLieu ? `Đường đi khoảng ${duong.duLieu.tongMet} m từ Cổng vào X` : duong.loi ? 'Chưa có đường đi tới khu này' : 'Đang tính đường đi…'}
      </Text>
      {cheDo === 'dan-duong' && (
        <Nut nhan={laDich ? 'Đang chỉ đường tới khu này' : day ? 'Khu đã đầy' : dangGui ? 'Đang đổi…' : 'Chỉ đường tới đây'}
          onPress={() => onChiDuong?.()} tat={day || laDich} dangGui={dangGui} />
      )}
      {cheDo === 'xem' && (
        dangHienDuong
          ? <Nut kieu="phu" nhan="Ẩn đường" onPress={() => onAnDuong?.()} />
          : <Nut nhan="Xem đường đi" onPress={() => onXemDuong?.()} tat={!duong.duLieu} />
      )}
    </View>
  );
}

/**
 * Đếm ngược suất giữ chỗ. Số giây còn lại theo GIỜ SERVER (hetHanLuc − bayGio của cùng một lần tải),
 * rồi đếm bằng đồng hồ máy, để máy lệch giờ cũng không sai.
 */
export function DemNguocGiuCho({ hetHanLuc, bayGio }: { hetHanLuc: string; bayGio: string }) {
  const goc = giayGiuChoCon(hetHanLuc, bayGio);
  const [con, setCon] = useState(goc);
  useEffect(() => {
    const batDau = Date.now();
    setCon(goc);
    const id = setInterval(() => setCon(Math.max(0, goc - Math.floor((Date.now() - batDau) / 1000))), 500);
    return () => clearInterval(id);
  }, [goc]);
  return <Text style={[s.giu, con <= 60 && { color: mau.loi }]}>{dinhDangGiuCho(con)}</Text>;
}

/** "đã đỗ 25 phút" (cập nhật mỗi 30 giây). Chỉ để hiển thị, KHÔNG tính tiền. */
export function ThoiGianDaDo({ tu }: { tu: string }) {
  const [bay, setBay] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setBay(Date.now()), 30_000); return () => clearInterval(id); }, []);
  return <Text>{thoiGianDaDo(tu, bay)}</Text>;
}

const s = StyleSheet.create({
  hangSo: { flexDirection: 'row', alignItems: 'baseline' },
  luoi: { gap: khoang.s },
  theKhu: { backgroundColor: mau.the, borderRadius: bo.vua, borderWidth: 1, borderColor: mau.vien, padding: khoang.m, gap: 6 },
  the: { backgroundColor: mau.the, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.chinh, padding: khoang.l, gap: khoang.s },
  dau: { flexDirection: 'row', alignItems: 'center', gap: khoang.s },
  ten: { fontSize: chu.thuong, fontWeight: '700', color: mau.chu, flex: 1 },
  so: { fontSize: chu.lon, fontWeight: '800', color: mau.chu },
  mo: { fontSize: chu.thuong, color: mau.mo },
  moNho: { fontSize: chu.nho, color: mau.mo },
  thanh: { height: 6, borderRadius: 3, backgroundColor: mau.the2, overflow: 'hidden' },
  day: { height: 6, borderRadius: 3 },
  nutX: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  nutXChu: { fontSize: 18, color: mau.mo },
  giu: { fontWeight: '800', color: mau.chu },
});
