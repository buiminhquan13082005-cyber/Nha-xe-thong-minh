import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BanDoBai } from '@/modules/tim-xe/components/BanDoBai';
import { moManHinhDanDuong, moManHinhDuongRa } from '@/modules/tim-xe/components/DieuHuongToanCuc';
import { DemNguocGiuCho, MucChoKhu } from '@/modules/tim-xe/components/KhuUi';
import { TEN_NGUON, type KhuCho, type XeTimXe } from '@/modules/tim-xe/models';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import { ChonMot } from '@/shared/ui/ChonMot';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { LienKet, Nhan, Nut, The, ThongBao } from '@/shared/ui/ui';
import { soId, useCuonToi, useKhiMoTuThongBao, veKhongMoDuoc } from '@/shared/ui/useDichDen';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { dinhDangNgay, hienThiBienSo } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';

/**
 * Tìm xe (giống TimXePage.tsx của web, xe máy, mức khu): sau khi qua cổng vào thấy "Mời vào khu X" kèm đường đi và
 * thời gian giữ chỗ; khi camera lối vào khu ghi nhận thì thấy xe đang ở khu nào, từ lúc nào. "Đã đỗ xe" là xác nhận phụ:
 * camera đã ghi khu khác thì giữ theo camera và báo quản lý. Tải lại khi có thông báo và mỗi 10 giây.
 * Mở từ thông báo: ?xe=45 (xe đang đỗ ở khu nào), ?danDuong=<lượt gửi> (mở màn hình chỉ đường)
 * hoặc ?duongRa=<lượt gửi> (xe vừa ra khỏi khu: mở màn hình đường ra cổng).
 */
export default function TimXeScreen() {
  const { services } = useAuth();
  const tx = useTaiDuLieu(() => services.timXe.layTimXe(), [services], 10_000);
  useNgheThongBao((s) => { if (['VAO', 'RA', 'KHU'].includes(s.loai)) void tx.taiNgam(); });
  const trongBai = tx.duLieu?.xe.filter((x) => x.trongBai) ?? [];
  const ngoaiBai = tx.duLieu?.xe.filter((x) => !x.trongBai) ?? [];
  const [dangKeo, setDangKeo] = useState(false);
  const dich = useCuonToi();

  const thamSo = useLocalSearchParams<{ xe?: string; danDuong?: string; duongRa?: string; mo?: string }>();
  const [tinMo, setTinMo] = useState<{ loai: 'tin' | 'canh' | 'loi'; noiDung: string; soDo?: boolean } | null>(null);
  const khoaMo = thamSo.danDuong ? `dd-${thamSo.danDuong}-${thamSo.mo ?? ''}`
    : thamSo.duongRa ? `ra-${thamSo.duongRa}-${thamSo.mo ?? ''}`
    : thamSo.xe ? `xe-${thamSo.xe}-${thamSo.mo ?? ''}` : null;
  useKhiMoTuThongBao(khoaMo, !!tx.duLieu, () => {
    setTinMo(null);
    const luot = soId(thamSo.danDuong);
    if (luot !== null) { void moDanDuong(luot); return; }
    const luotRa = soId(thamSo.duongRa);
    if (luotRa !== null) { void moDuongRa(luotRa); return; }
    const xeId = soId(thamSo.xe);
    if (xeId === null) return;
    const x = tx.duLieu?.xe.find((v) => v.xeId === xeId);
    if (!x) { veKhongMoDuoc(); return; }
    if (!x.trongBai) { setTinMo({ loai: 'tin', noiDung: `Xe ${hienThiBienSo(x.bienSo)} đã ra khỏi bãi.` }); return; }
    dich.toi(`xe-${xeId}`);
  });

  /** Phiên của đúng lượt gửi đó còn dẫn đường thì mở bản đồ; đã tới / hết giờ / xe đã ra thì nói rõ, không mở. */
  async function moDanDuong(luot: number) {
    try {
      const p = (await services.dieuHuong.layCuaToi()).phien;
      if (p && p.luotGuiId === luot) {
        dich.toi(`xe-${p.xeId}`);
        if (p.trangThai === 'DANG_DAN') { moManHinhDanDuong(); return; }
        setTinMo(p.trangThai === 'HET_HAN'
          ? { loai: 'canh', noiDung: `Phiên chỉ đường tới ${p.khuDich.ten} đã hết giờ giữ chỗ. Xem Sơ đồ chỗ trống để chọn khu còn chỗ.`, soDo: true }
          : p.khuThucTe
            ? { loai: 'tin', noiDung: `Phiên chỉ đường đã kết thúc: xe ${hienThiBienSo(p.bienSo)} đã tới ${p.khuThucTe.ten}.` }
            : { loai: 'tin', noiDung: 'Phiên chỉ đường đã kết thúc.', soDo: true });
        return;
      }
      setTinMo({ loai: 'tin', noiDung: 'Phiên chỉ đường này đã kết thúc (xe đã ra khỏi bãi hoặc đã có lượt gửi mới).', soDo: true });
    } catch (e) { setTinMo({ loai: 'loi', noiDung: thongDiepLoi(e) }); }
  }

  /** Xe của lượt gửi đó vẫn đang đi ra (chưa qua cổng, trong 15 phút) thì mở đường ra; không thì nói rõ. */
  async function moDuongRa(luot: number) {
    try {
      const x = (await services.dieuHuong.layDuongRaCuaToi()).xeRaKhu;
      if (x && x.luotGuiId === luot) { moManHinhDuongRa(); return; }
      setTinMo({ loai: 'tin', noiDung: 'Xe đã qua cổng ra hoặc thông báo đã cũ. Muốn xem lại đường ra, bấm "Chỉ đường ra cổng" ở xe đang trong bãi.' });
    } catch (e) { setTinMo({ loai: 'loi', noiDung: thongDiepLoi(e) }); }
  }

  async function keo() { setDangKeo(true); await tx.taiLai(); setDangKeo(false); }

  return (
    <ManHinh
      tieuDe="Tìm xe" cuonRef={dich.cuonRef} dangKeo={dangKeo} onKeo={() => void keo()}
      phai={<Nut kieu="phu" nhan="Sơ đồ chỗ trống" onPress={() => router.push('/so-do')} />}
    >
      {tinMo && (
        <View style={{ gap: khoang.s }}>
          <ThongBao loai={tinMo.loai}>{tinMo.noiDung}</ThongBao>
          {tinMo.soDo && <LienKet nhan="Mở Sơ đồ chỗ trống" onPress={() => router.push('/so-do')} />}
        </View>
      )}
      {tx.loi && !tx.duLieu && (
        <>
          <ThongBao loai="loi">{tx.loi}</ThongBao>
          <Nut kieu="phu" nhan="Thử lại" onPress={() => void tx.taiLai()} />
        </>
      )}
      {tx.dangTai && !tx.duLieu && <ActivityIndicator color={mau.chinh} style={{ paddingVertical: khoang.xl }} />}
      {tx.duLieu && (
        <>
          {trongBai.length === 0
            ? <Text style={kieuChung.mo}>Không có xe nào của bạn đang ở trong bãi.</Text>
            : trongBai.map((x) => (
              <View key={x.xeId} onLayout={dich.ghiViTri(`xe-${x.xeId}`)}>
                <TheTimXe x={x} bayGio={tx.duLieu!.bayGio} khu={tx.duLieu!.khuXeMay} khiXong={() => void tx.taiNgam()}
                  sang={dich.dangSang === `xe-${x.xeId}`} />
              </View>
            ))}

          <Text style={kieuChung.tieuDeMuc}>Mức chỗ các khu xe máy</Text>
          <MucChoKhu khu={tx.duLieu.khuXeMay} />

          {ngoaiBai.length > 0 && (
            <>
              <Text style={kieuChung.tieuDeMuc}>Xe đang ở ngoài bãi</Text>
              <View style={s.chips}>
                {ngoaiBai.map((x) => <View key={x.xeId} style={s.chip}><Text style={s.chipChu}>{hienThiBienSo(x.bienSo)}</Text></View>)}
              </View>
            </>
          )}
        </>
      )}
    </ManHinh>
  );
}

function TheTimXe({ x, bayGio, khu, khiXong, sang }: { x: XeTimXe; bayGio: string; khu: KhuCho[]; khiXong: () => void; sang: boolean }) {
  const { services } = useAuth();
  const macDinh = x.khuId ?? x.moiVao?.khuId ?? khu[0]?.id ?? 0;
  const [khuChon, setKhuChon] = useState(macDinh);
  const [moChon, setMoChon] = useState(false);
  /** Xe chưa rõ khu: chọn khu đang đỗ để xem đường ra cổng. */
  const [chonRa, setChonRa] = useState(false);
  const [kq, setKq] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);

  async function daDo() {
    if (dangGui) return;
    setLoi(null); setKq(null); setDangGui(true);
    try { setKq(await services.timXe.daDoXe(x.xeId, khuChon)); setMoChon(false); khiXong(); }
    catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setDangGui(false); }
  }

  const dangGiu = x.moiVao?.trangThai === 'DANG_GIU' && !x.khuId;
  return (
    <The style={[{ gap: khoang.m }, sang && kieuChung.toSang]}>
      <View style={kieuChung.dong}>
        <View style={{ flex: 1 }}>
          <Text style={kieuChung.bienSo}>{hienThiBienSo(x.bienSo)}</Text>
          <Text style={kieuChung.moNho}>Vào bãi {dinhDangNgay(x.thoiGianVao)}</Text>
        </View>
        {!x.hoTroDinhVi ? <Nhan chu="Ô tô" loai="mo" />
          : x.khuId ? <Nhan chu="Đã định vị" loai="ok" />
          : dangGiu ? <Nhan chu="Đang giữ chỗ" loai="canh" />
          : <Nhan chu="Chưa rõ khu" loai="loi" />}
      </View>

      {!x.hoTroDinhVi && <Text style={kieuChung.mo}>Định vị trong khu ô tô chưa hỗ trợ ở phiên bản này.</Text>}

      {x.hoTroDinhVi && x.khuId && (
        <View style={s.viTri}>
          <Text style={s.nhanNho}>XE CỦA BẠN Ở</Text>
          <Text style={s.viTriKhu}>{x.khu}</Text>
          <Text style={kieuChung.moNho}>Từ {dinhDangNgay(x.vaoKhuLuc)}{x.nguonKhu ? `, ghi nhận bởi ${TEN_NGUON[x.nguonKhu]}` : ''}</Text>
        </View>
      )}

      {x.hoTroDinhVi && dangGiu && x.moiVao && (
        <View style={s.viTri}>
          <Text style={s.nhanNho}>MỜI VÀO</Text>
          <Text style={s.viTriKhu}>{x.moiVao.khu}</Text>
          <Text style={kieuChung.moNho}>Chỗ được giữ thêm <DemNguocGiuCho hetHanLuc={x.moiVao.hetHanLuc} bayGio={bayGio} /></Text>
        </View>
      )}

      {x.hoTroDinhVi && !x.khuId && !dangGiu && (
        <Text style={kieuChung.mo}>{'Chưa có camera lối vào khu nào ghi nhận xe. Đỗ xong, bấm "Đã đỗ xe" và chọn khu.'}</Text>
      )}

      {x.duong && (
        <BanDoBai khu={khu} khuDichId={x.duong.khuId} hienViTri={!x.khuId}
          duong={x.khuId ? null : x.duong} />
      )}

      {x.hoTroDinhVi && (
        moChon ? (
          <View style={{ gap: khoang.s }}>
            <ChonMot nhan="Bạn đã đỗ ở khu nào?" giaTri={khuChon} onChon={setKhuChon} luaChon={khu.map((k) => ({ giaTri: k.id, ten: k.ten }))} />
            <View style={kieuChung.hangNut}>
              <Nut nhan="Xác nhận" onPress={() => void daDo()} dangGui={dangGui} tat={!khuChon} style={kieuChung.nutGian} />
              <Nut kieu="phu" nhan="Thôi" onPress={() => setMoChon(false)} tat={dangGui} style={kieuChung.nutGian} />
            </View>
          </View>
        ) : chonRa ? (
          <View style={{ gap: khoang.s }}>
            <ChonMot nhan="Xe đang đỗ ở khu nào?" giaTri={khuChon} onChon={setKhuChon} luaChon={khu.map((k) => ({ giaTri: k.id, ten: k.ten }))} />
            <View style={kieuChung.hangNut}>
              <Nut nhan="Xem đường ra" onPress={() => { moManHinhDuongRa(khuChon, x.bienSo); setChonRa(false); }} tat={!khuChon} style={kieuChung.nutGian} />
              <Nut kieu="phu" nhan="Thôi" onPress={() => setChonRa(false)} style={kieuChung.nutGian} />
            </View>
          </View>
        ) : (
          <View style={kieuChung.hangNut}>
            <Nut kieu="phu" nhan="Đã đỗ xe" onPress={() => { setKhuChon(macDinh); setChonRa(false); setMoChon(true); }} style={kieuChung.nutGian} />
            <Nut kieu="phu" nhan="Chỉ đường ra cổng" style={kieuChung.nutGian} onPress={() => {
              if (x.khuId) moManHinhDuongRa(x.khuId, x.bienSo);
              else { setKhuChon(macDinh); setChonRa(true); }
            }} />
          </View>
        )
      )}
      {kq && <ThongBao loai="ok">{kq}</ThongBao>}
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
    </The>
  );
}

const s = StyleSheet.create({
  viTri: { backgroundColor: mau.the2, borderRadius: bo.vua, padding: khoang.m, gap: 2 },
  nhanNho: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: mau.chinhChu },
  viTriKhu: { fontSize: chu.rat_lon, fontWeight: '800', color: mau.chu },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: khoang.s },
  chip: { backgroundColor: mau.the2, borderRadius: 99, paddingHorizontal: khoang.m, paddingVertical: 6 },
  chipChu: { fontSize: chu.nho, fontWeight: '700', color: mau.chu },
});
