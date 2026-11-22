import { StyleSheet, Text, View } from 'react-native';
import { TEN_TRANG_THAI_LUOT, type TrangThaiLuot } from '@/modules/cong-ra-vao/models';
import { IconODo } from '@/shared/ui/icons';
import { Nhan } from '@/shared/ui/ui';
import { dinhDangNgay, hienThiBienSo } from '@/shared/utils/format';
import { chu, khoang, mau } from '@/shared/theme';
import type { XeTrongBaiTrangChu } from '../ghepXeTrongBai';

/** Màu nhãn trạng thái lượt: nghi mất đỏ, chờ thanh toán / chờ xác nhận vàng. */
const loaiNhanLuot = (tt: TrangThaiLuot) => (tt === 'NGHI_MAT' ? 'loi' : 'canh') as 'loi' | 'canh';

/** Nội dung thẻ "Xe đang trong bãi": biển số, giờ vào, khu (+ nhãn nếu lượt gửi đang ở trạng thái đặc biệt). */
export function DanhSachXeTrongBai({ ds, loiTrangThai }: { ds: XeTrongBaiTrangChu[]; loiTrangThai: boolean }) {
  if (ds.length === 0) {
    return (
      <View style={s.rong}>
        <IconODo mau={mau.chuGoiY} />
        <Text style={s.mo}>Không có xe nào đang trong bãi.</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: khoang.m }}>
      {ds.map((x, i) => (
        <View key={x.xeId} style={[s.dong, i > 0 && s.vach]}>
          <View style={s.dauDong}>
            <Text style={s.bienSo}>{hienThiBienSo(x.bienSo)}</Text>
            {x.trangThaiLuot && <Nhan chu={TEN_TRANG_THAI_LUOT[x.trangThaiLuot]} loai={loaiNhanLuot(x.trangThaiLuot)} />}
          </View>
          <View style={s.hang}>
            <Text style={s.nhan}>Giờ vào</Text>
            <Text style={s.giaTri}>{dinhDangNgay(x.thoiGianVao)}</Text>
          </View>
          <View style={s.hang}>
            <Text style={s.nhan}>Khu</Text>
            <Text style={s.giaTri}>{x.khu ? `Khu ${x.khu}` : 'Chưa rõ khu'}</Text>
          </View>
        </View>
      ))}
      {loiTrangThai && <Text style={s.ghiChu}>Không tải được trạng thái lượt gửi. Kéo xuống để tải lại.</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  rong: { alignItems: 'center', gap: khoang.s, paddingVertical: khoang.s },
  mo: { fontSize: chu.thuong, color: mau.mo, textAlign: 'center' },
  dong: { gap: 6 },
  vach: { borderTopWidth: 1, borderTopColor: mau.vien, paddingTop: khoang.m },
  dauDong: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: khoang.s, flexWrap: 'wrap' },
  bienSo: { fontSize: 20, fontWeight: '800', color: mau.chu, letterSpacing: 0.5 },
  hang: { flexDirection: 'row', justifyContent: 'space-between', gap: khoang.s },
  nhan: { fontSize: chu.nho, color: mau.mo },
  giaTri: { fontSize: chu.thuong, color: mau.chu, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  ghiChu: { fontSize: 12, color: mau.loi },
});
