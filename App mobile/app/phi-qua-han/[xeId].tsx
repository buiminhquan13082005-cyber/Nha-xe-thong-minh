import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import type { PhiQuaHan } from '@/modules/goi-cho/models';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { LienKet, Nut, The, ThongBao } from '@/shared/ui/ui';
import { veKhongMoDuoc } from '@/shared/ui/useDichDen';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { dinhDangNgay, dinhDangTien, hienThiBienSo } from '@/shared/utils/format';
import { khoang, mau } from '@/shared/theme';

/**
 * Trả phí quá hạn (giống PhiQuaHanPage.tsx của web, thanh toán giả lập). Xe đang chờ ở cổng ra vì quá hạn:
 * trả xong thì barrier tự mở. Phải trả hết phí quá hạn mới mua gói mới được.
 */
export default function PhiQuaHanScreen() {
  const { services } = useAuth();
  const xeId = Number(useLocalSearchParams<{ xeId: string }>().xeId);
  const xe = useTaiDuLieu(async () => (await services.xe.layDanhSach()).find((x) => x.xeId === xeId) ?? null, [services, xeId]);
  const no = useTaiDuLieu(() => services.xe.layPhiQuaHan(xeId), [services, xeId]);
  const [dangTra, setDangTra] = useState(false);
  const [daTra, setDaTra] = useState<PhiQuaHan | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  // Xe không còn thuộc tài khoản (mở từ thông báo cũ): về hộp thư, báo không mở được
  useEffect(() => {
    if (xe.duLieu === null && !xe.dangTai && !xe.loi) veKhongMoDuoc();
  }, [xe.duLieu, xe.dangTai, xe.loi]);

  async function tra() {
    if (dangTra) return;
    setDangTra(true); setLoi(null);
    try { setDaTra(await services.xe.traPhiQuaHan(xeId)); await no.taiLai(); }
    catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setDangTra(false); }
  }

  const tieuDe = xe.duLieu ? `Phí quá hạn · ${hienThiBienSo(xe.duLieu.bienSo)}` : 'Trả phí quá hạn';
  return (
    <ManHinh vien={[]}>
      <Stack.Screen options={{ title: tieuDe }} />
      {no.dangTai && !no.duLieu && !daTra && <ActivityIndicator color={mau.chinh} style={{ paddingVertical: khoang.xl }} />}
      {no.loi && !no.duLieu && (
        <>
          <ThongBao loai="loi">{no.loi}</ThongBao>
          <Nut kieu="phu" nhan="Thử lại" onPress={() => void no.taiLai()} />
        </>
      )}

      {daTra && (
        <>
          <ThongBao loai="ok">{`Đã thanh toán ${dinhDangTien(daTra.soTienConNo)} cho ${daTra.soNgayConNo} ngày quá hạn. Nếu xe đang chờ ở cổng ra, cổng sẽ tự mở.`}</ThongBao>
          {xe.duLieu?.laChuXe && (
            <Nut nhan="Mua gói mới cho xe này" onPress={() => router.replace({ pathname: '/mua-goi/[xeId]', params: { xeId: String(xeId) } })} />
          )}
        </>
      )}

      {no.duLieu ? (
        <The style={{ gap: khoang.m }}>
          <View style={kieuChung.dong}><Text style={kieuChung.nhan}>Gói hết hạn lúc</Text><Text style={kieuChung.giaTri}>{dinhDangNgay(no.duLieu.hetHanLuc)}</Text></View>
          <View style={kieuChung.dong}><Text style={kieuChung.nhan}>Số ngày quá hạn</Text><Text style={kieuChung.giaTri}>{no.duLieu.soNgayConNo} ngày</Text></View>
          <View style={kieuChung.dong}>
            <Text style={kieuChung.nhan}>Số tiền</Text>
            <Text style={[kieuChung.giaTri, { color: mau.loi, fontSize: 24, fontWeight: '800' }]}>{dinhDangTien(no.duLieu.soTienConNo)}</Text>
          </View>
          <Text style={kieuChung.moNho}>Quá hạn dưới 1 ngày vẫn tính tròn 1 ngày. Phải trả hết phí quá hạn mới mua gói mới hoặc ra bãi được.</Text>
          {loi && <ThongBao loai="loi">{loi}</ThongBao>}
          <Nut kieu="loi" nhan={dangTra ? 'Đang xử lý…' : 'Thanh toán (giả lập)'} onPress={() => void tra()} dangGui={dangTra} />
        </The>
      ) : (
        !daTra && !no.dangTai && !no.loi && (
          <>
            <ThongBao loai="tin">Xe này không còn phí quá hạn (khoản phí đã được thanh toán hoặc gói đã gia hạn).</ThongBao>
            <View style={kieuChung.hangNut}>
              <LienKet nhan="Mở Ra vào" onPress={() => router.replace('/ra-vao')} />
              <LienKet nhan="Xe của tôi" onPress={() => router.navigate('/xe')} />
            </View>
          </>
        )
      )}
    </ManHinh>
  );
}
