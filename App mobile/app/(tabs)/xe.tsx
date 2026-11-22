import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChoConBanThe } from '@/modules/goi-cho/components/ChoConBanThe';
import { ThemXeForm } from '@/modules/goi-cho/components/ThemXeForm';
import { XeThe } from '@/modules/goi-cho/components/XeThe';
import type { AnhDaChon } from '@/modules/goi-cho/utils/anhGiayDangKy';
import { hetCho, timChoCon } from '@/modules/goi-cho/utils/choCon';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { Nut, ThongBao } from '@/shared/ui/ui';
import { soId, useCuonToi, useKhiMoTuThongBao, veKhongMoDuoc } from '@/shared/ui/useDichDen';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { chuanHoaBienSo, hienThiBienSo, tenLoaiXe } from '@/shared/utils/format';
import { khoang, mau } from '@/shared/theme';

/**
 * Xe của tôi (giống XeCuaToiPage.tsx của web): số chỗ còn bán, thêm xe (kèm ảnh giấy đăng ký), danh sách xe của mình
 * và xe được chia sẻ trong nhóm. Mở từ thông báo (?xe=45) thì cuộn tới và tô sáng thẻ xe đó.
 */
export default function XeCuaToiScreen() {
  const { services } = useAuth();
  const ds = useTaiDuLieu(() => services.xe.layDanhSach(), [services]);
  const bangGia = useTaiDuLieu(() => services.goiCho.layBangGia(), [services]);
  const [moForm, setMoForm] = useState(false);
  const [thanhCong, setThanhCong] = useState<string | null>(null);
  const [loiAnh, setLoiAnh] = useState<string | null>(null);
  const [dangKeo, setDangKeo] = useState(false);
  const dich = useCuonToi();
  const { xe: xeMo, mo } = useLocalSearchParams<{ xe?: string; mo?: string }>();

  async function themXe(loaiXeId: number, bienSo: string, chiaSe: boolean, anh: AnhDaChon) {
    const { xeId } = await services.xe.them(loaiXeId, bienSo, chiaSe);
    setMoForm(false);
    try { await services.xe.taiAnhGiayDangKy(xeId, anh); }
    catch (e) {
      // xe đã tạo nhưng ảnh lỗi: báo để khách tải lại ngay trên thẻ xe
      setThanhCong(null); setLoiAnh(`Đã tạo xe nhưng chưa tải được ảnh: ${thongDiepLoi(e)} Hãy tải lại ảnh ở thẻ xe bên dưới.`);
      await ds.taiLai(); return;
    }
    const cho = timChoCon(bangGia.duLieu?.choConBan, loaiXeId);
    const nhacHetCho = hetCho(cho) ? ` Lưu ý: ${tenLoaiXe(loaiXeId)} đang hết chỗ, duyệt xong bạn chưa mua gói được cho tới khi có chỗ trống.` : '';
    setThanhCong(`Đã gửi đăng ký xe ${hienThiBienSo(chuanHoaBienSo(bienSo))}. Xe đang chờ Admin duyệt.${nhacHetCho}`);
    await Promise.all([ds.taiLai(), bangGia.taiLai()]);
  }

  async function keo() {
    setDangKeo(true);
    await Promise.allSettled([ds.taiLai(), bangGia.taiLai()]);
    setDangKeo(false);
  }

  // Mở từ thông báo (xe bị từ chối / bị gỡ / gói bị huỷ): cuộn tới thẻ xe, không còn xe thì báo không mở được
  const idMo = soId(xeMo);
  useKhiMoTuThongBao(idMo ? `xe-${idMo}-${mo ?? ''}` : null, !!ds.duLieu, () => {
    if (idMo !== null && !dich.toi(`xe-${idMo}`)) veKhongMoDuoc();
  });

  const cuaToi = ds.duLieu?.filter((x) => x.laChuXe) ?? [];
  const chiaSe = ds.duLieu?.filter((x) => !x.laChuXe) ?? [];

  return (
    <ManHinh
      tieuDe="Xe của tôi" cuonRef={dich.cuonRef} dangKeo={dangKeo} onKeo={() => void keo()}
      phai={!moForm ? <Nut nhan="+ Thêm xe" onPress={() => { setMoForm(true); setThanhCong(null); setLoiAnh(null); }} /> : undefined}
    >
      {bangGia.duLieu && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: khoang.s }}>
          {bangGia.duLieu.choConBan.map((c) => <ChoConBanThe key={c.loaiXeId} c={c} />)}
        </View>
      )}

      {moForm && <ThemXeForm onGui={themXe} onHuy={() => setMoForm(false)} choConBan={bangGia.duLieu?.choConBan} />}
      {thanhCong && <ThongBao loai="ok">{thanhCong}</ThongBao>}
      {loiAnh && <ThongBao loai="loi">{loiAnh}</ThongBao>}
      {ds.loi && !ds.duLieu && (
        <>
          <ThongBao loai="loi">{ds.loi}</ThongBao>
          <Nut kieu="phu" nhan="Thử lại" onPress={() => void ds.taiLai()} />
        </>
      )}
      {ds.dangTai && !ds.duLieu && <ActivityIndicator color={mau.chinh} style={{ paddingVertical: khoang.xl }} />}

      {ds.duLieu && cuaToi.length === 0 && <Text style={kieuChung.mo}>Bạn chưa đăng ký xe nào. Bấm "+ Thêm xe" để bắt đầu.</Text>}
      {cuaToi.map((x) => (
        <View key={x.xeId} onLayout={dich.ghiViTri(`xe-${x.xeId}`)}>
          <XeThe xe={x} onDoi={ds.taiLai} toSang={dich.dangSang === `xe-${x.xeId}`} />
        </View>
      ))}

      {chiaSe.length > 0 && (
        <>
          <Text style={kieuChung.tieuDeMuc}>Xe được chia sẻ trong nhóm</Text>
          {chiaSe.map((x) => (
            <View key={x.xeId} onLayout={dich.ghiViTri(`xe-${x.xeId}`)}>
              <XeThe xe={x} toSang={dich.dangSang === `xe-${x.xeId}`} />
            </View>
          ))}
        </>
      )}
    </ManHinh>
  );
}
