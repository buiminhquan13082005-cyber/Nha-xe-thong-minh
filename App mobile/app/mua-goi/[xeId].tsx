import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChoConBanThe } from '@/modules/goi-cho/components/ChoConBanThe';
import { goiHuyDuoc, tenTrangThaiGoi } from '@/modules/goi-cho/lichSuGoi';
import type { DangKyCho, KetQuaMuaGoi, XemHuyGoi } from '@/modules/goi-cho/models';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { LoiApi } from '@/shared/models';
import { ChonMot } from '@/shared/ui/ChonMot';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { Nut, The, ThongBao } from '@/shared/ui/ui';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { dinhDangNgay, dinhDangTien, hienThiBienSo, tenLoaiXe } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';

/**
 * Mua / gia hạn gói và huỷ gói trước hạn (giống MuaGoiPage.tsx của web). Luật giữ đúng như web:
 * chỉ xe ĐÃ DUYỆT mới mua được; còn nợ phí quá hạn thì server báo CON_NO_QUA_HAN (có nút trả phí ngay);
 * Admin vừa đổi giá thì server báo 409 GIA_DA_DOI: tải lại bảng giá, giữ gói đang chọn, hiện giá cũ gạch ngang để hỏi lại.
 * xeId = "0" (mở không kèm xe): chọn xe đã duyệt đầu tiên.
 */
export default function MuaGoiScreen() {
  const { services } = useAuth();
  const thamSo = useLocalSearchParams<{ xeId: string }>();
  const [xeYeuCau, setXeYeuCau] = useState<number | null>(Number(thamSo.xeId) > 0 ? Number(thamSo.xeId) : null);
  const dsXe = useTaiDuLieu(() => services.xe.layDanhSach(), [services]);
  const bangGia = useTaiDuLieu(() => services.goiCho.layBangGia(), [services]);

  const dsDuyet = useMemo(() => dsXe.duLieu?.filter((x) => x.trangThaiDuyet === 'DA_DUYET') ?? [], [dsXe.duLieu]);
  // xe yêu cầu không mua được (chưa duyệt, bị gỡ, không còn thuộc tài khoản): KHÔNG tự chọn xe khác, báo rõ để không mua nhầm
  const xeDuocChon = useMemo(
    () => (xeYeuCau !== null ? dsDuyet.find((x) => x.xeId === xeYeuCau) ?? null : dsDuyet[0] ?? null),
    [dsDuyet, xeYeuCau]);
  const xeKhongMuaDuoc = xeYeuCau !== null && !!dsXe.duLieu && !xeDuocChon;

  const lichSu = useTaiDuLieu(
    () => (xeDuocChon ? services.xe.layLichSuGoi(xeDuocChon.xeId) : Promise.resolve([] as DangKyCho[])),
    [services, xeDuocChon?.xeId]);

  const [goiId, setGoiId] = useState<number | null>(null);
  const [dangMua, setDangMua] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaMuaGoi | null>(null);
  const [loi, setLoi] = useState<LoiApi | null>(null);
  const [giaCu, setGiaCu] = useState<Record<number, number>>({}); // giá cũ của gói vừa bị Admin đổi giá

  const [huy, setHuy] = useState<{ dk: DangKyCho; xem: XemHuyGoi } | null>(null);
  const [dangHuy, setDangHuy] = useState(false);
  const [lyDoHuy, setLyDoHuy] = useState('');
  const [gopY, setGopY] = useState('');
  const [dsLyDo, setDsLyDo] = useState<string[]>([]);
  const [thongBaoHuy, setThongBaoHuy] = useState<{ loai: 'ok' | 'loi'; noiDung: string } | null>(null);
  useEffect(() => { services.xe.layLyDoHuy().then(setDsLyDo).catch(() => setDsLyDo([])); }, [services]);

  useEffect(() => { setGoiId(null); setKetQua(null); setLoi(null); setHuy(null); setThongBaoHuy(null); setGiaCu({}); }, [xeDuocChon?.xeId]);

  const [dangKeo, setDangKeo] = useState(false);
  async function keo() {
    setDangKeo(true);
    await Promise.allSettled([dsXe.taiLai(), bangGia.taiLai(), lichSu.taiLai()]);
    setDangKeo(false);
  }

  const khung = (noiDung: ReactNode) => (
    <ManHinh vien={[]} dangKeo={dangKeo} onKeo={() => void keo()}>
      <Stack.Screen options={{ title: 'Mua / gia hạn gói' }} />
      {noiDung}
    </ManHinh>
  );

  if (dsXe.dangTai && !dsXe.duLieu) return khung(<ActivityIndicator color={mau.chinh} style={{ paddingVertical: khoang.xl }} />);
  if (dsXe.loi && !dsXe.duLieu) return khung(<><ThongBao loai="loi">{dsXe.loi}</ThongBao><Nut kieu="phu" nhan="Thử lại" onPress={() => void dsXe.taiLai()} /></>);
  if (xeKhongMuaDuoc) {
    const xe = dsXe.duLieu?.find((x) => x.xeId === xeYeuCau);
    return khung(
      <>
        <ThongBao loai="loi">
          {xe ? `Xe ${hienThiBienSo(xe.bienSo)} hiện không mua gói được (chưa được duyệt hoặc đã bị gỡ).`
            : 'Xe này hiện không mua gói được (không còn thuộc tài khoản của bạn hoặc đã bị gỡ).'}
        </ThongBao>
        {dsDuyet.length > 0 ? (
          <ChonMot nhan="Chọn xe khác" giaTri={-1} onChon={(v) => setXeYeuCau(v)}
            luaChon={dsDuyet.map((x) => ({ giaTri: x.xeId, ten: hienThiBienSo(x.bienSo) }))} />
        ) : <Nut kieu="phu" nhan="Mở Xe của tôi" onPress={() => router.navigate('/xe')} />}
      </>,
    );
  }
  if (!xeDuocChon) {
    return khung(
      <>
        <ThongBao loai="tin">Chưa có xe đã duyệt. Vào Xe của tôi để đăng ký xe.</ThongBao>
        <Nut kieu="phu" nhan="Mở Xe của tôi" onPress={() => router.navigate('/xe')} />
      </>,
    );
  }

  const xe = xeDuocChon;
  const cho = bangGia.duLieu?.choConBan.find((c) => c.loaiXeId === xe.loaiXeId);
  const goiCuaLoai = bangGia.duLieu?.goi.filter((g) => g.loaiXeId === xe.loaiXeId) ?? [];
  const goi = goiCuaLoai.find((g) => g.id === goiId) ?? null;
  // Xe đã giữ suất (gói còn hạn hoặc đang trong bãi) thì mua là gia hạn, không tốn thêm chỗ (giống sp_mua_goi).
  const giuSuat = xe.conHan || xe.dangTrongBai;
  const hetCho = !giuSuat && cho?.soChoConBan === 0;
  const batDauDuKien = xe.conHan && xe.hetHanLuc ? xe.hetHanLuc : null;
  // Đang tải lịch sử (vừa đổi xe / đang làm mới): chưa cho huỷ, tránh huỷ nhầm gói của xe trước
  const goiHuy = lichSu.dangTai ? null : goiHuyDuoc(lichSu.duLieu);

  async function moHuy(dk: DangKyCho) {
    setThongBaoHuy(null); setLyDoHuy(''); setGopY('');
    try { setHuy({ dk, xem: await services.xe.xemHuyGoi(dk.id) }); }
    catch (e) { setThongBaoHuy({ loai: 'loi', noiDung: thongDiepLoi(e) }); }
  }

  async function xacNhanHuy() {
    if (!huy || dangHuy) return;
    setDangHuy(true);
    try {
      const kq = await services.xe.huyGoi(huy.dk.id, lyDoHuy, gopY.trim());
      setThongBaoHuy({ loai: 'ok', noiDung: `Đã huỷ gói ${kq.tenGoi}, hoàn lại ${dinhDangTien(kq.soTienHoan)}. Suất đã trả lại cho bãi. Cảm ơn bạn đã góp ý.` });
      setHuy(null);
      await Promise.all([dsXe.taiLai(), bangGia.taiLai(), lichSu.taiLai()]);
    } catch (e) {
      setThongBaoHuy({ loai: 'loi', noiDung: thongDiepLoi(e) });
      setHuy(null);
    } finally { setDangHuy(false); }
  }

  async function mua() {
    if (!goi || dangMua) return;
    setDangMua(true); setLoi(null); setKetQua(null);
    try {
      // gửi kèm giá đang hiện trên màn hình: Admin vừa đổi giá thì server báo GIA_DA_DOI, không trừ tiền
      setKetQua(await services.goiCho.muaGoi(xe.xeId, goi.id, goi.gia));
      setGoiId(null); setGiaCu({});
      await Promise.all([dsXe.taiLai(), bangGia.taiLai(), lichSu.taiLai()]);
    } catch (e) {
      const l = e instanceof LoiApi ? e : new LoiApi(0, 'LOI', thongDiepLoi(e));
      setLoi(l);
      if (l.ma === 'GIA_DA_DOI') {
        // tải lại bảng giá, giữ nguyên gói đang chọn để khách xem giá mới rồi bấm thanh toán lại
        setGiaCu({ [goi.id]: goi.gia });
        await bangGia.taiLai();
      }
    } finally { setDangMua(false); }
  }

  return khung(
    <>
      <The style={{ gap: khoang.m }}>
        {dsDuyet.length > 1 && (
          <ChonMot nhan="Chọn xe" giaTri={xe.xeId} onChon={(v) => setXeYeuCau(v)}
            luaChon={dsDuyet.map((x) => ({ giaTri: x.xeId, ten: `${hienThiBienSo(x.bienSo)}${!x.laChuXe ? ` · xe của ${x.tenChuXe}` : ''}` }))} />
        )}
        <Text style={kieuChung.bienSo}>{hienThiBienSo(xe.bienSo)} <Text style={kieuChung.moNho}>· {tenLoaiXe(xe.loaiXe)}</Text></Text>
        <View style={kieuChung.dong}><Text style={kieuChung.nhan}>Gói hiện tại</Text><Text style={kieuChung.giaTri}>{xe.goiHienTai ?? 'Chưa có'}</Text></View>
        <View style={kieuChung.dong}><Text style={kieuChung.nhan}>Hết hạn</Text><Text style={kieuChung.giaTri}>{dinhDangNgay(xe.hetHanLuc)}</Text></View>
        <View style={kieuChung.dong}><Text style={kieuChung.nhan}>Trạng thái</Text><Text style={kieuChung.giaTri}>{giuSuat ? 'Đang giữ suất' : 'Chưa giữ suất'}</Text></View>
        {!xe.laChuXe && <ThongBao loai="canh">Đây là xe được chia sẻ. Theo quy định, chỉ chủ xe mới được mua gói.</ThongBao>}
      </The>

      {cho && <ChoConBanThe c={cho} />}
      {hetCho && <ThongBao loai="loi">Loại xe này đã hết chỗ. Xe chưa giữ suất nên chưa mua được gói mới.</ThongBao>}

      <Text style={kieuChung.tieuDeMuc}>Chọn gói</Text>
      {bangGia.loi && !bangGia.duLieu && <ThongBao loai="loi">{bangGia.loi}</ThongBao>}
      {bangGia.duLieu && goiCuaLoai.length === 0 && <Text style={kieuChung.mo}>Chưa có gói nào đang bán cho loại xe này.</Text>}
      <View style={s.luoiGoi}>
        {goiCuaLoai.map((g) => {
          const chon = goiId === g.id;
          return (
            <Pressable key={g.id} accessibilityRole="radio" accessibilityState={{ selected: chon }}
              onPress={() => { setGoiId(g.id); setKetQua(null); setLoi(null); setGiaCu({}); }}
              style={[s.goi, chon && s.goiChon]}>
              <Text style={s.goiTen}>{g.ten}</Text>
              {giaCu[g.id] !== undefined && giaCu[g.id] !== g.gia && <Text style={s.giaCu}>{dinhDangTien(giaCu[g.id])}</Text>}
              <Text style={s.goiGia}>{dinhDangTien(g.gia)}</Text>
              <Text style={kieuChung.moNho}>{g.soNgay} ngày</Text>
            </Pressable>
          );
        })}
      </View>

      {goi && (
        <The style={{ gap: khoang.m, borderColor: mau.chinh }}>
          <Text style={kieuChung.tieuDeMuc}>Xác nhận thanh toán</Text>
          <Text style={kieuChung.mo}>
            {batDauDuKien
              ? `Gia hạn ${goi.ten}, nối tiếp sau ngày hết hạn ${dinhDangNgay(batDauDuKien)}. Không tốn thêm chỗ.`
              : `Mua mới ${goi.ten}, bắt đầu ngay khi thanh toán.`}
          </Text>
          <Text style={kieuChung.mo}>Số tiền: <Text style={{ fontWeight: '800', color: mau.chu }}>{dinhDangTien(goi.gia)}</Text> (thanh toán giả lập)</Text>
          <View style={kieuChung.hangNut}>
            <Nut nhan={dangMua ? 'Đang xử lý…' : 'Thanh toán'} onPress={() => void mua()} dangGui={dangMua} tat={!xe.laChuXe} style={kieuChung.nutGian} />
            <Nut kieu="phu" nhan="Huỷ" onPress={() => setGoiId(null)} tat={dangMua} style={kieuChung.nutGian} />
          </View>
        </The>
      )}

      {ketQua && (
        <ThongBao loai="ok">
          {`${ketQua.laGiaHan ? 'Gia hạn' : 'Mua gói'} thành công: hiệu lực từ ${dinhDangNgay(ketQua.ngayBatDau)} đến ${dinhDangNgay(ketQua.ngayKetThuc)}, đã trả ${dinhDangTien(ketQua.soTien)}.`}
        </ThongBao>
      )}
      {loi && (
        <View style={{ gap: khoang.s }}>
          <ThongBao loai={loi.ma === 'GIA_DA_DOI' ? 'canh' : 'loi'}>
            {`${loi.message}${loi.ma === 'GIA_DA_DOI' ? ' Bảng giá bên trên đã cập nhật, xem giá mới rồi bấm Thanh toán lại.' : ''}`}
          </ThongBao>
          {loi.ma === 'CON_NO_QUA_HAN' && (
            <Nut kieu="loi" nhan="Trả phí quá hạn ngay"
              onPress={() => router.push({ pathname: '/phi-qua-han/[xeId]', params: { xeId: String(xe.xeId) } })} />
          )}
        </View>
      )}

      <Text style={kieuChung.tieuDeMuc}>Lịch sử gói của xe</Text>
      {thongBaoHuy && <ThongBao loai={thongBaoHuy.loai}>{thongBaoHuy.noiDung}</ThongBao>}
      {huy && (
        <The style={{ gap: khoang.m, borderColor: mau.loi }}>
          <Text style={kieuChung.tieuDeMuc}>Huỷ gói {huy.xem.tenGoi} trước hạn?</Text>
          <Text style={kieuChung.mo}>
            {huy.xem.chuaBatDau
              ? `Gói chưa bắt đầu nên được hoàn toàn bộ ${dinhDangTien(huy.xem.soTienHoan)}.`
              : `Còn ${huy.xem.soNgayConLai} ngày chưa dùng, được hoàn ${dinhDangTien(huy.xem.soTienHoan)} (tính theo ngày, làm tròn xuống).`}
          </Text>
          {!huy.xem.chuaBatDau && xe.dangTrongBai && (
            <ThongBao loai="canh">Xe đang trong bãi: phải đưa xe ra trước mới huỷ được gói đang dùng.</ThongBao>
          )}
          <ChonMot nhan="Lý do huỷ (không bắt buộc)" giaTri={lyDoHuy} onChon={setLyDoHuy}
            luaChon={[{ giaTri: '', ten: 'Không chọn' }, ...dsLyDo.map((l) => ({ giaTri: l, ten: l }))]} />
          <View style={{ gap: khoang.s }}>
            <Text style={s.nhanO}>Góp ý cho nhà xe (không bắt buộc)</Text>
            <TextInput value={gopY} onChangeText={setGopY} maxLength={500} multiline numberOfLines={3}
              placeholder="VD: nên có gói 3 tháng, lối vào khu B hơi tối…" placeholderTextColor={mau.chuGoiY} style={s.oGopY} />
            <Text style={kieuChung.moNho}>{gopY.length}/500 · Admin sẽ đọc được góp ý này</Text>
          </View>
          <View style={kieuChung.hangNut}>
            <Nut kieu="loi" nhan={dangHuy ? 'Đang huỷ…' : 'Xác nhận huỷ gói'} onPress={() => void xacNhanHuy()} dangGui={dangHuy} style={kieuChung.nutGian} />
            <Nut kieu="phu" nhan="Không huỷ" onPress={() => setHuy(null)} tat={dangHuy} style={kieuChung.nutGian} />
          </View>
        </The>
      )}
      {lichSu.loi && !lichSu.duLieu && <ThongBao loai="loi">{lichSu.loi}</ThongBao>}
      {lichSu.duLieu && lichSu.duLieu.length === 0 && <Text style={kieuChung.mo}>Xe chưa mua gói nào.</Text>}
      {lichSu.duLieu && lichSu.duLieu.length > 0 && (
        <The style={{ gap: khoang.m }}>
          {lichSu.duLieu.map((d, i) => (
            <View key={d.id} style={[{ gap: 4 }, i > 0 && kieuChung.vach]}>
              <View style={kieuChung.dong}>
                <Text style={{ fontSize: chu.thuong, fontWeight: '700', color: mau.chu, flexShrink: 1 }}>{d.tenGoi}</Text>
                <Text style={kieuChung.giaTri}>{dinhDangTien(d.soTien)}</Text>
              </View>
              <Text style={kieuChung.moNho}>{dinhDangNgay(d.ngayBatDau)} → {dinhDangNgay(d.ngayKetThuc)}</Text>
              <Text style={kieuChung.moNho}>{tenTrangThaiGoi(d)}</Text>
              {xe.laChuXe && goiHuy?.id === d.id && !huy && (
                <Nut kieu="phu" nhan="Huỷ gói" onPress={() => void moHuy(d)} style={{ alignSelf: 'flex-start', minHeight: 40 }} />
              )}
            </View>
          ))}
        </The>
      )}
    </>,
  );
}

const s = StyleSheet.create({
  luoiGoi: { flexDirection: 'row', flexWrap: 'wrap', gap: khoang.s },
  goi: { flexGrow: 1, flexBasis: 140, padding: khoang.l, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.vien, backgroundColor: mau.the, gap: 4 },
  goiChon: { borderColor: mau.chinh, borderWidth: 2, backgroundColor: mau.loiNen },
  goiTen: { fontSize: chu.thuong, fontWeight: '700', color: mau.chu },
  goiGia: { fontSize: chu.lon, fontWeight: '800', color: mau.chinhChu },
  giaCu: { fontSize: chu.nho, color: mau.mo, textDecorationLine: 'line-through' },
  nhanO: { fontSize: chu.nho, fontWeight: '600', color: mau.nhanO },
  oGopY: {
    minHeight: 84, padding: khoang.m, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.vien,
    backgroundColor: mau.the, fontSize: 16, color: mau.chu, textAlignVertical: 'top',
  },
});
