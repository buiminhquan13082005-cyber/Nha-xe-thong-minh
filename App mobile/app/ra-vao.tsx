import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TEN_TRANG_THAI_LUOT, type LuotGui, type TrangThaiLuot } from '@/modules/cong-ra-vao/models';
import { useRaVao } from '@/modules/cong-ra-vao/RaVaoContext';
import { tinYeuCauDaKetThuc } from '@/modules/cong-ra-vao/tinYeuCau';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { IconTiep } from '@/shared/ui/icons';
import { Nhan, Nut, The, ThongBao } from '@/shared/ui/ui';
import { soId, useCuonToi, useKhiMoTuThongBao } from '@/shared/ui/useDichDen';
import { dinhDangNgay, dinhDangTien, hienThiBienSo } from '@/shared/utils/format';
import { khoang, mau } from '@/shared/theme';

const loaiNhan = (tt: TrangThaiLuot) => (tt === 'NGHI_MAT' ? 'loi' : tt === 'DA_RA' ? 'ok' : 'canh') as 'loi' | 'ok' | 'canh';

/**
 * Ra vào (giống RaVaoPage.tsx của web): xe chờ thanh toán ở cổng ra, yêu cầu cần xác nhận (bấm để mở màn 60 giây),
 * lịch sử ra vào. Dữ liệu dùng chung với RaVaoProvider (hỏi lại mỗi 3 giây + SignalR).
 * Mở từ thông báo: ?luot=123 (&xacNhan=1 nếu là yêu cầu xác nhận ra).
 */
export default function RaVaoScreen() {
  const { duLieu, nhanLuc, loi, dangTai, taiLai, danhDauDaMo } = useRaVao();
  const [dangKeo, setDangKeo] = useState(false);
  const dich = useCuonToi();
  const thamSo = useLocalSearchParams<{ luot?: string; xacNhan?: string; mo?: string }>();
  const [tinMo, setTinMo] = useState<{ loai: 'tin' | 'canh'; noiDung: string } | null>(null);

  async function keo() { setDangKeo(true); await taiLai(); setDangKeo(false); }

  const choTra = duLieu?.lichSu.filter((l) => l.trangThai === 'CHO_THANH_TOAN') ?? [];

  // Mở từ thông báo: chỉ quyết định trên dữ liệu tải SAU lúc mở màn (dữ liệu dùng chung có thể đã cũ tới 3 giây,
  // từ trước khi yêu cầu xác nhận được tạo → báo nhầm "đã kết thúc")
  const luotMo = soId(thamSo.luot);
  const [moLuc, setMoLuc] = useState(0);
  useEffect(() => {
    if (luotMo === null) return;
    setMoLuc(Date.now());
    void taiLai();
  }, [luotMo, thamSo.mo, taiLai]);
  useKhiMoTuThongBao(luotMo ? `${luotMo}-${thamSo.xacNhan ?? ''}-${thamSo.mo ?? ''}` : null, !!duLieu && moLuc > 0 && nhanLuc >= moLuc, () => {
    if (!duLieu || luotMo === null) return;
    setTinMo(null);
    const yc = duLieu.dangCho.find((y) => y.luotGuiId === luotMo);
    if (yc) { moXacNhan(yc.id); return; }
    const l = duLieu.lichSu.find((x) => x.id === luotMo);
    if (!l) { setTinMo({ loai: 'tin', noiDung: 'Lượt gửi này đã cũ, không còn trong 30 lượt gần nhất.' }); return; }
    if (l.trangThai === 'CHO_THANH_TOAN') { dich.toi(`tra-luot-${l.id}`); return; }
    dich.toi(`luot-${l.id}`);
    if (thamSo.xacNhan) setTinMo(tinYeuCauDaKetThuc(l));
  });

  function moXacNhan(yeuCauId: number) {
    danhDauDaMo(yeuCauId);
    router.push({ pathname: '/xac-nhan-ra/[id]', params: { id: String(yeuCauId) } });
  }

  return (
    <ManHinh vien={[]} cuonRef={dich.cuonRef} dangKeo={dangKeo} onKeo={() => void keo()}>
      {loi && !duLieu && (
        <>
          <ThongBao loai="loi">{loi}</ThongBao>
          <Nut kieu="phu" nhan="Thử lại" onPress={() => void taiLai()} />
        </>
      )}
      {!duLieu && !loi && dangTai && <ActivityIndicator color={mau.chinh} style={{ paddingVertical: khoang.xl }} />}
      {tinMo && <ThongBao loai={tinMo.loai}>{tinMo.noiDung}</ThongBao>}

      {duLieu && (
        <>
          {choTra.map((l) => (
            <View key={l.id} onLayout={dich.ghiViTri(`tra-luot-${l.id}`)}>
              <ChoThanhToan l={l} sang={dich.dangSang === `tra-luot-${l.id}`} />
            </View>
          ))}

          <Text style={kieuChung.tieuDeMuc}>Cần bạn xác nhận</Text>
          {duLieu.dangCho.length === 0
            ? <Text style={kieuChung.mo}>Không có xe nào của bạn đang ở cổng ra.</Text>
            : duLieu.dangCho.map((y) => (
              <Pressable key={y.id} accessibilityRole="button" onPress={() => moXacNhan(y.id)}>
                <The style={{ gap: khoang.s, borderColor: mau.chinh }}>
                  <Text style={kieuChung.moNho}>Xe đang ở cổng ra</Text>
                  <View style={kieuChung.dong}>
                    <Text style={kieuChung.bienSo}>{hienThiBienSo(y.bienSo)}</Text>
                    <IconTiep mau={mau.mo} />
                  </View>
                  <Text style={kieuChung.mo}>
                    {y.nguoiDungXeDongY === null ? 'Bấm để xác nhận có phải bạn đang lấy xe.'
                      : `Đã được ${y.nguoiDungXeTraLoi ?? 'người dùng xe'} ${y.nguoiDungXeDongY ? 'xác nhận' : 'báo không phải mình'}.`}
                  </Text>
                </The>
              </Pressable>
            ))}

          <Text style={kieuChung.tieuDeMuc}>Lịch sử ra vào</Text>
          {duLieu.lichSu.length === 0 ? <Text style={kieuChung.mo}>Chưa có lượt gửi nào.</Text> : (
            <View onLayout={dich.ghiViTri('bang-lich-su')}>
            <The style={{ gap: khoang.m }}>
              {duLieu.lichSu.map((l, i) => (
                <View key={l.id} onLayout={dich.ghiViTri(`luot-${l.id}`, 'bang-lich-su')}
                  style={[s.dong, i > 0 && kieuChung.vach, dich.dangSang === `luot-${l.id}` && s.sang]}>
                  <View style={kieuChung.dong}>
                    <Text style={[kieuChung.bienSo, { fontSize: 17 }]}>{hienThiBienSo(l.bienSo)}</Text>
                    <Nhan chu={TEN_TRANG_THAI_LUOT[l.trangThai]} loai={loaiNhan(l.trangThai)} />
                  </View>
                  <View style={kieuChung.dong}><Text style={kieuChung.nhan}>Vào lúc</Text><Text style={kieuChung.giaTri}>{dinhDangNgay(l.thoiGianVao)}</Text></View>
                  <View style={kieuChung.dong}><Text style={kieuChung.nhan}>Ra lúc</Text><Text style={kieuChung.giaTri}>{dinhDangNgay(l.thoiGianRa)}</Text></View>
                </View>
              ))}
            </The>
            </View>
          )}
        </>
      )}
    </ManHinh>
  );
}

function ChoThanhToan({ l, sang }: { l: LuotGui; sang: boolean }) {
  return (
    <The style={[{ gap: khoang.m, borderColor: mau.canh }, sang && kieuChung.toSang]}>
      <View style={kieuChung.dong}>
        <View>
          <Text style={kieuChung.moNho}>Xe đang chờ ở cổng ra</Text>
          <Text style={kieuChung.bienSo}>{hienThiBienSo(l.bienSo)}</Text>
        </View>
        <Nhan chu="Chờ thanh toán" loai="canh" />
      </View>
      <Text style={kieuChung.mo}>{`Gói đã quá hạn${l.phiQuaHan ? `, còn nợ ${dinhDangTien(l.phiQuaHan)}` : ''}. Trả phí trên app, cổng sẽ tự mở.`}</Text>
      <Nut nhan="Trả phí quá hạn" onPress={() => router.push({ pathname: '/phi-qua-han/[xeId]', params: { xeId: String(l.xeId) } })} />
    </The>
  );
}

const s = StyleSheet.create({
  dong: { gap: 4 },
  sang: { backgroundColor: mau.loiNen, borderRadius: 8, padding: 6 },
});
