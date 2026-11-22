import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VongDemNguoc } from '@/modules/cong-ra-vao/components/VongDemNguoc';
import { mocHetTheoMay, soGiayCon } from '@/modules/cong-ra-vao/demNguoc';
import type { YeuCauXacNhan } from '@/modules/cong-ra-vao/models';
import { useRaVao } from '@/modules/cong-ra-vao/RaVaoContext';
import { THONG_DIEP_HET_GIO, tinYeuCauDaKetThuc } from '@/modules/cong-ra-vao/tinYeuCau';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { Nut, ThongBao } from '@/shared/ui/ui';
import { dinhDangTien, hienThiBienSo } from '@/shared/utils/format';
import { chu, khoang, mau } from '@/shared/theme';

type DaTraLoi = 'dong-y' | 'tu-choi' | null;

/**
 * Xác nhận xe ra (giống 2FA), mở đè lên mọi màn khi RaVaoProvider thấy yêu cầu mới.
 * Đếm ngược từ soGiayConLai theo đồng hồ máy; mỗi lần tải lại (3 giây / SignalR) thì đồng bộ lại.
 * Ai được dùng xe trả lời trước thì có hiệu lực; người sau thấy "Đã được … xác nhận".
 */
export default function XacNhanRaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const yeuCauId = Number(id);
  const { services } = useAuth();
  const { duLieu, nhanLuc, taiLai, danhDauDaMo } = useRaVao();

  const yMoi = duLieu?.dangCho.find((y) => y.id === yeuCauId) ?? null;
  // Giữ bản cuối cùng thấy được: yêu cầu biến khỏi danh sách (đã xong / hết hạn) vẫn hiện biển số và lý do
  const [yDaThay, setYDaThay] = useState<YeuCauXacNhan | null>(null);
  useEffect(() => { if (yMoi) setYDaThay(yMoi); }, [yMoi]);
  const y = yMoi ?? yDaThay;

  // Mốc hết giờ theo đồng hồ máy, tính lại mỗi lần server trả số giây mới (nhanLuc đổi).
  // Yêu cầu biến khỏi danh sách thì giữ mốc cuối cùng để vẫn đếm về 0 đúng lúc.
  const mocMoi = yMoi ? mocHetTheoMay(yMoi.soGiayConLai, nhanLuc) : null;
  const [mocCu, setMocCu] = useState<number | null>(null);
  useEffect(() => { if (mocMoi !== null) setMocCu(mocMoi); }, [mocMoi]);
  const mocHet = mocMoi ?? mocCu;
  const [bayGio, setBayGio] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setBayGio(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const giay = mocHet === null ? 0 : soGiayCon(mocHet, bayGio);

  const [daTraLoi, setDaTraLoi] = useState<DaTraLoi>(null);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    danhDauDaMo(yeuCauId);
    Vibration.vibrate([0, 500, 200, 500]); // rung khi màn hiện: người dùng có thể đang không nhìn điện thoại
    void taiLai();
    return () => Vibration.cancel();
  }, [yeuCauId, danhDauDaMo, taiLai]);

  const luot = useMemo(
    () => (y ? duLieu?.lichSu.find((l) => l.id === y.luotGuiId) ?? null : null),
    [duLieu, y],
  );

  async function traLoi(dongY: boolean) {
    if (dangGui) return;
    setLoi(null); setDangGui(true);
    try {
      await services.congRaVao.nguoiDungXeTraLoi(yeuCauId, dongY);
      setDaTraLoi(dongY ? 'dong-y' : 'tu-choi');
      Vibration.cancel();
    } catch (e) {
      setLoi(thongDiepLoi(e)); // yêu cầu đã hết hạn, người khác đã trả lời...: hiện đúng câu của server
    } finally {
      setDangGui(false);
      void taiLai();
    }
  }

  function baoKhongPhaiToi() {
    Alert.alert(
      'Không phải bạn?',
      'Cổng sẽ không mở và quản lý bãi được báo ngay là có thể có người lấy nhầm / lấy trộm xe.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đúng, không phải tôi', style: 'destructive', onPress: () => void traLoi(false) },
      ],
    );
  }

  function dong() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const chuaAiTraLoi = !!yMoi && yMoi.nguoiDungXeDongY === null && yMoi.quanLyDongY === null;
  const conHoi = chuaAiTraLoi && giay > 0 && daTraLoi === null;

  return (
    <SafeAreaView style={s.manHinh}>
      <ScrollView contentContainerStyle={s.noiDung}>
        <Text style={s.nhan}>XE ĐANG Ở CỔNG RA</Text>
        {y ? <Text style={s.bienSo} accessibilityRole="header">{hienThiBienSo(y.bienSo)}</Text>
          : <Text style={s.bienSoCho}>{duLieu ? 'Không tìm thấy yêu cầu' : 'Đang tải…'}</Text>}
        {y && <Text style={s.mo}>Xe của {y.tenChuXe}</Text>}

        {y && <VongDemNguoc giay={daTraLoi ? 0 : giay} />}

        <KetQua
          coYeuCau={!!y} conHoi={conHoi} daTraLoi={daTraLoi} giay={giay} yMoi={yMoi}
          tinKetThuc={!yMoi && luot && !daTraLoi ? tinYeuCauDaKetThuc(luot) : null}
          coDuLieu={!!duLieu}
        />
        {loi && <ThongBao loai="canh">{loi}</ThongBao>}

        {luot?.trangThai === 'CHO_THANH_TOAN' && (
          <View style={s.khoi}>
            <ThongBao loai="canh">
              {`Gói của xe đã quá hạn${luot.phiQuaHan ? `, còn nợ ${dinhDangTien(luot.phiQuaHan)}` : ''}. Trả phí trên app, cổng sẽ tự mở.`}
            </ThongBao>
            <Nut nhan="Trả phí quá hạn" onPress={() => router.replace({ pathname: '/phi-qua-han/[xeId]', params: { xeId: String(luot.xeId) } })} />
          </View>
        )}

        {conHoi ? (
          <View style={s.khoi}>
            <Text style={s.cauHoi}>Có phải bạn đang lấy xe không?</Text>
            <Nut kieu="ok" nhan="Đúng là tôi" onPress={() => void traLoi(true)} dangGui={dangGui} style={s.nutLon} />
            <Nut kieu="loi" nhan="Không phải tôi" onPress={baoKhongPhaiToi} tat={dangGui} style={s.nutLon} />
          </View>
        ) : (
          <Nut kieu="phu" nhan="Đóng" onPress={dong} style={s.nutLon} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Dòng trạng thái dưới vòng đếm ngược: đang hỏi / đã trả lời / người khác đã trả lời / hết giờ / đã kết thúc. */
function KetQua({ coYeuCau, conHoi, daTraLoi, giay, yMoi, tinKetThuc, coDuLieu }: {
  coYeuCau: boolean; conHoi: boolean; daTraLoi: DaTraLoi; giay: number; yMoi: YeuCauXacNhan | null;
  tinKetThuc: { loai: 'tin' | 'canh'; noiDung: string } | null; coDuLieu: boolean;
}) {
  if (daTraLoi === 'dong-y') return <ThongBao loai="ok">Đã xác nhận. Cổng ra đang mở cho xe của bạn.</ThongBao>;
  if (daTraLoi === 'tu-choi') return <ThongBao loai="loi">Đã báo không phải bạn. Cổng không mở, quản lý bãi đã được báo.</ThongBao>;
  if (conHoi) return <Text style={s.mo}>Quá 60 giây không ai trả lời thì cổng không mở.</Text>;
  if (yMoi && yMoi.nguoiDungXeDongY !== null) {
    return (
      <ThongBao loai={yMoi.nguoiDungXeDongY ? 'ok' : 'canh'}>
        {`Đã được ${yMoi.nguoiDungXeTraLoi ?? 'người dùng xe'} ${yMoi.nguoiDungXeDongY ? 'xác nhận' : 'báo không phải mình'}.`}
      </ThongBao>
    );
  }
  if (yMoi && yMoi.quanLyDongY !== null) return <ThongBao loai="tin">Quản lý bãi đã xử lý yêu cầu này.</ThongBao>;
  if (tinKetThuc) return <ThongBao loai={tinKetThuc.loai}>{tinKetThuc.noiDung}</ThongBao>;
  if (coYeuCau && giay === 0) return <ThongBao loai="loi">{THONG_DIEP_HET_GIO}</ThongBao>;
  if (coDuLieu && !coYeuCau) return <ThongBao loai="tin">Yêu cầu này không còn chờ xác nhận. Xem lịch sử ở trang Ra vào.</ThongBao>;
  return null;
}

const s = StyleSheet.create({
  manHinh: { flex: 1, backgroundColor: mau.nen },
  noiDung: { flexGrow: 1, padding: khoang.xl, alignItems: 'center', justifyContent: 'center', gap: khoang.l },
  nhan: { fontSize: 13, fontWeight: '700', letterSpacing: 1.6, color: mau.chinhChu },
  bienSo: { fontSize: 46, fontWeight: '900', color: mau.chu, letterSpacing: 1, textAlign: 'center' },
  bienSoCho: { fontSize: chu.lon, fontWeight: '700', color: mau.mo },
  mo: { fontSize: chu.thuong, color: mau.mo, textAlign: 'center' },
  khoi: { alignSelf: 'stretch', gap: khoang.m },
  cauHoi: { fontSize: chu.vua, fontWeight: '700', color: mau.chu, textAlign: 'center' },
  nutLon: { minHeight: 60, alignSelf: 'stretch' },
});
