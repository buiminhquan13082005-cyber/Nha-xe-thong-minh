import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { hanhDongCua, nhanHanhDong } from '@/modules/thong-bao/dichDen';
import { NHAN_LOAI, type HopThu, type ThongBaoApp } from '@/modules/thong-bao/models';
import { useThongBao } from '@/modules/thong-bao/ThongBaoContext';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { Nhan, Nut, ThongBao } from '@/shared/ui/ui';
import { LOI_KHONG_MO_DUOC } from '@/shared/ui/useDichDen';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { dinhDangNgay } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';

const MAU_NHAN = { ok: 'ok', cho: 'canh', loi: 'loi', tin: 'tin' } as const;

/**
 * Hộp thư (giống ThongBaoPage.tsx của web): tự tải lại mỗi 15 giây, SignalR đẩy thông báo mới thì thêm lên đầu ngay.
 * Bấm thông báo: đánh dấu đã đọc và mở đúng màn cần làm (dichDen.ts).
 */
export default function ThongBaoScreen() {
  const { services } = useAuth();
  const { moThongBao, taiSoChuaDoc } = useThongBao();
  const hop = useTaiDuLieu(() => services.thongBao.layHopThu(), [services], 15_000);
  const [themMoi, setThemMoi] = useState<ThongBaoApp[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangKeo, setDangKeo] = useState(false);
  const [dangDocHet, setDangDocHet] = useState(false);
  const thamSo = useLocalSearchParams<{ loi?: string; mo?: string }>();
  const [anLoiUrl, setAnLoiUrl] = useState(false);
  useEffect(() => { setAnLoiUrl(false); }, [thamSo.loi, thamSo.mo]);

  // SignalR: thêm lên đầu ngay (chưa cần chờ lần tải sau); lần tải sau có bản ghi thật thì bỏ bản tạm
  useNgheThongBao((s) => {
    if (!s.id) return;
    setThemMoi((ds) => [{ id: s.id!, loai: s.loai, noiDung: s.noiDung, guiLuc: new Date().toISOString(), daDoc: false, hanhDong: s.hanhDong, thamChieuId: s.thamChieuId }, ...ds]);
  });

  const hopGhep: HopThu | null = hop.duLieu && {
    soChuaDoc: hop.duLieu.soChuaDoc + themMoi.filter((t) => !hop.duLieu!.thongBao.some((x) => x.id === t.id)).length,
    thongBao: [...themMoi.filter((t) => !hop.duLieu!.thongBao.some((x) => x.id === t.id)), ...hop.duLieu.thongBao],
  };

  async function taiLaiHet() {
    await hop.taiLai();
    setThemMoi([]);
    void taiSoChuaDoc();
  }

  async function keo() { setDangKeo(true); await taiLaiHet(); setDangKeo(false); }

  async function docHet() {
    setLoi(null); setDangDocHet(true);
    try { await services.thongBao.docHet(); await taiLaiHet(); }
    catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setDangDocHet(false); }
  }

  async function bam(t: ThongBaoApp) {
    setAnLoiUrl(true);
    if (!(await moThongBao(t))) await taiLaiHet(); // không có màn đích: chỉ đánh dấu đã đọc
    else void taiLaiHet();
  }

  const coYeuCauRa = hopGhep?.thongBao.some((t) => !t.daDoc && hanhDongCua(t) === 'XAC_NHAN_RA');

  return (
    <ManHinh
      tieuDe="Thông báo" dangKeo={dangKeo} onKeo={() => void keo()}
      phai={<Nut kieu="phu" nhan="Đọc hết" onPress={() => void docHet()} dangGui={dangDocHet}
        tat={!hopGhep || hopGhep.soChuaDoc === 0} />}
    >
      {thamSo.loi === LOI_KHONG_MO_DUOC && !anLoiUrl && (
        <ThongBao loai="loi">Không mở được nội dung này (không còn tồn tại hoặc bạn không có quyền xem).</ThongBao>
      )}
      {coYeuCauRa && (
        <Pressable onPress={() => router.push('/ra-vao')} accessibilityRole="button">
          <ThongBao loai="canh">Có xe đang chờ bạn xác nhận ở cổng ra. Bấm để mở trang Ra vào.</ThongBao>
        </Pressable>
      )}
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
      {hop.loi && !hop.duLieu && (
        <>
          <ThongBao loai="loi">{hop.loi}</ThongBao>
          <Nut kieu="phu" nhan="Thử lại" onPress={() => void hop.taiLai()} />
        </>
      )}
      {hop.dangTai && !hop.duLieu && <ActivityIndicator color={mau.chinh} style={{ paddingVertical: khoang.xl }} />}
      {hopGhep && hopGhep.thongBao.length === 0 && <ThongBao loai="tin">Chưa có thông báo nào.</ThongBao>}
      {hopGhep && hopGhep.thongBao.length > 0 && (
        <>
          <Text style={kieuChung.mo}><Text style={{ fontWeight: '800', color: mau.chu }}>{hopGhep.soChuaDoc}</Text> thông báo chưa đọc</Text>
          {hopGhep.thongBao.map((t) => <DongThongBao key={t.id} t={t} onBam={() => void bam(t)} />)}
        </>
      )}
    </ManHinh>
  );
}

/** Một thông báo: nhãn loại, "Mới", giờ gửi, nội dung, việc cần làm ("Xác nhận ra →"). Bấm cả dòng để mở. */
function DongThongBao({ t, onBam }: { t: ThongBaoApp; onBam: () => void }) {
  const nhan = NHAN_LOAI[t.loai] ?? { ten: t.loai, mau: 'tin' as const };
  const viec = nhanHanhDong(t);
  return (
    <Pressable accessibilityRole="button" onPress={onBam} style={({ pressed }) => [s.dong, t.daDoc && s.daDoc, pressed && { opacity: 0.85 }]}>
      <View style={s.dau}>
        <View style={s.cacNhan}>
          <Nhan chu={nhan.ten} loai={MAU_NHAN[nhan.mau]} />
          {!t.daDoc && <Nhan chu="Mới" loai="loi" />}
        </View>
        <Text style={kieuChung.moNho}>{dinhDangNgay(t.guiLuc)}</Text>
      </View>
      <Text style={[s.noiDung, t.daDoc && { color: mau.mo }]}>{t.noiDung}</Text>
      {viec && <Text style={s.viec}>{viec} →</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  dong: { backgroundColor: mau.the, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.chinh, padding: khoang.l, gap: khoang.s },
  daDoc: { borderColor: mau.vien, backgroundColor: mau.the2 },
  dau: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: khoang.s, flexWrap: 'wrap' },
  cacNhan: { flexDirection: 'row', gap: khoang.xs, flexWrap: 'wrap' },
  noiDung: { fontSize: chu.thuong, color: mau.chu, lineHeight: 21 },
  viec: { fontSize: chu.nho, fontWeight: '700', color: mau.chinhChu, alignSelf: 'flex-end' },
});
