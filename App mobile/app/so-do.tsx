import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BanDoBai, ChuThichSoDo } from '@/modules/tim-xe/components/BanDoBai';
import { MucChoKhu, TheKhu } from '@/modules/tim-xe/components/KhuUi';
import type { DuongDiBanDo } from '@/modules/tim-xe/models';
import { khuXeMayTrenSoDo } from '@/modules/tim-xe/soDoXeMay';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { Nut, The, ThongBao } from '@/shared/ui/ui';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { SoChay } from '@/shared/ui/chuyenDong';
import { dinhDangTien } from '@/shared/utils/format';
import { dinhDangNgay } from '@/shared/utils/ngayGio';
import { chu, khoang, mau } from '@/shared/theme';

/** Nhóm số theo kiểu Việt Nam: 1.234 (dinhDangTien rồi bỏ " đ"). */
const so = (n: number) => dinhDangTien(n).replace(' đ', '');

/**
 * Sơ đồ chỗ trống (giống SoDoChoTrongPage.tsx của web, phần người dùng). Hiện chỉ làm XE MÁY: 3 chấm R, S, Hầm B1/B2.
 * Số trên chấm là chỗ còn trống (đã trừ suất đang giữ cho xe vừa qua cổng). Tự cập nhật mỗi 10 giây.
 * Chạm chấm khu → thẻ khu → "Xem đường đi" từ Cổng vào X (chỉ để xem: không tạo phiên, không giữ suất).
 */
export default function SoDoChoTrongScreen() {
  const { services } = useAuth();
  const ds = useTaiDuLieu(() => services.timXe.laySoXeKhu(), [services], 10_000);
  const khuXeMay = khuXeMayTrenSoDo(ds.duLieu?.khu);
  const tongCon = khuXeMay.reduce((t, k) => t + k.conLai, 0);
  const tongSucChua = khuXeMay.reduce((t, k) => t + k.sucChua, 0);
  const [dangKeo, setDangKeo] = useState(false);

  const [chonId, setChonId] = useState<number | null>(null);
  const [duong, setDuong] = useState<DuongDiBanDo | null>(null);
  const [loiDuong, setLoiDuong] = useState<string | null>(null);
  const chon = khuXeMay.find((k) => k.id === chonId) ?? null;

  async function xemDuong(khuId: number) {
    setLoiDuong(null);
    try { setDuong(await services.dieuHuong.layDuongDi(khuId)); }
    catch (e) { setLoiDuong(thongDiepLoi(e)); }
  }

  async function keo() { setDangKeo(true); await ds.taiLai(); setDangKeo(false); }

  return (
    <ManHinh vien={[]} dangKeo={dangKeo} onKeo={() => void keo()}>
      <The style={s.tong}>
        {ds.duLieu ? <SoChay gia={tongCon} dinhDang={so} style={s.tongSo} /> : <Text style={s.tongSo}>–</Text>}
        <View style={{ flex: 1 }}>
          <Text style={s.tongNhan}>chỗ xe máy còn trống</Text>
          <Text style={kieuChung.moNho}>
            {khuXeMay.length > 0
              ? `trên ${so(tongSucChua)} chỗ ở ${khuXeMay.length} khu · cập nhật ${dinhDangNgay(ds.duLieu?.bayGio).split(' ')[1] ?? ''}`
              : ds.duLieu ? 'Chưa có số liệu khu xe máy' : 'Đang tải…'}
          </Text>
        </View>
      </The>

      <ChuThichSoDo />
      {ds.loi && !ds.duLieu && (
        <>
          <ThongBao loai="loi">{ds.loi}</ThongBao>
          <Nut kieu="phu" nhan="Thử lại" onPress={() => void ds.taiLai()} />
        </>
      )}

      <BanDoBai khu={ds.duLieu?.khu} duong={duong} khuDichId={duong?.denKhuId} khuChonId={chonId} hienViTri={!!duong}
        onChamKhu={(k) => setChonId((c) => (c === k.id ? null : k.id))} />
      {chon
        ? <TheKhu khu={chon} cheDo="xem" dangHienDuong={duong?.denKhuId === chon.id}
            onXemDuong={() => void xemDuong(chon.id)} onAnDuong={() => setDuong(null)} onDong={() => setChonId(null)} />
        : <Text style={kieuChung.mo}>Chạm vào chấm R, S hoặc Hầm để xem chỗ trống và đường đi từ Cổng vào X.</Text>}
      {loiDuong && <ThongBao loai="loi">{loiDuong}</ThongBao>}
      {duong && !chon && <Nut kieu="phu" nhan="Ẩn đường" onPress={() => setDuong(null)} />}

      <Text style={kieuChung.tieuDeMuc}>Chi tiết khu xe máy</Text>
      {ds.dangTai && !ds.duLieu && <ActivityIndicator color={mau.chinh} />}
      {ds.duLieu && <MucChoKhu khu={khuXeMay} chiTiet />}
    </ManHinh>
  );
}

const s = StyleSheet.create({
  tong: { flexDirection: 'row', alignItems: 'center', gap: khoang.l },
  tongSo: { fontSize: 40, fontWeight: '900', color: mau.ok },
  tongNhan: { fontSize: chu.vua, fontWeight: '700', color: mau.chu },
});
