import { StyleSheet, Text, View } from 'react-native';
import type { XeDuocDung } from '@/modules/goi-cho/models';
import { loaiNhanDuyet, tenTrangThaiDuyet } from '@/modules/goi-cho/tenTrangThai';
import { trangThaiGoi, type MucGoi } from '@/modules/goi-cho/trangThaiGoi';
import { Nhan } from '@/shared/ui/ui';
import { dinhDangTien, hienThiBienSo } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';

const MAU_MUC: Record<MucGoi, string> = { CON_HAN: mau.ok, SAP_HET: mau.canh, HET_HAN: mau.loi, CHUA_CO: mau.loi };

/**
 * Nội dung thẻ "Gói của xe": tên gói, thời gian còn lại. Còn ≤ 72 giờ thì nền vàng "Sắp hết hạn", hết / chưa có thì chữ đỏ,
 * còn nợ phí quá hạn thì dòng đỏ (giống XeThe của web). Xe chưa duyệt chỉ hiện nhãn trạng thái duyệt.
 */
export function DanhSachGoiXe({ ds, bayGio }: { ds: XeDuocDung[]; bayGio: number }) {
  if (ds.length === 0) return <Text style={s.mo}>Bạn chưa thêm xe nào. Vào tab Xe để thêm xe.</Text>;
  return (
    <View style={{ gap: khoang.m }}>
      {ds.map((xe, i) => {
        const daDuyet = xe.trangThaiDuyet === 'DA_DUYET';
        const tt = trangThaiGoi(xe, bayGio);
        const sapHet = daDuyet && tt.muc === 'SAP_HET';
        return (
          <View key={xe.xeId} style={[s.dong, i > 0 && s.vach, sapHet && s.sapHet]}>
            <View style={s.dauDong}>
              <Text style={s.bienSo}>{hienThiBienSo(xe.bienSo)}</Text>
              {sapHet ? <Nhan chu="Sắp hết hạn" loai="canh" />
                : !daDuyet ? <Nhan chu={tenTrangThaiDuyet[xe.trangThaiDuyet]} loai={loaiNhanDuyet(xe.trangThaiDuyet)} /> : null}
            </View>
            {!xe.laChuXe && xe.tenChuXe && <Text style={s.mo}>Xe của {xe.tenChuXe} (chia sẻ trong nhóm)</Text>}
            {daDuyet ? (
              <View style={s.hang}>
                <Text style={s.tenGoi}>{tt.tenGoi}</Text>
                <Text style={[s.thoiGian, { color: MAU_MUC[tt.muc] }]}>{tt.thoiGian}</Text>
              </View>
            ) : (
              <Text style={s.mo}>{xe.trangThaiDuyet === 'CHO_DUYET' ? 'Admin duyệt xong mới mua gói được.' : 'Xem chi tiết ở tab Xe.'}</Text>
            )}
            {xe.soNgayNo > 0 && (
              <Text style={s.no}>Quá hạn {xe.soNgayNo} ngày, còn nợ {dinhDangTien(xe.soTienNo)}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  mo: { fontSize: chu.thuong, color: mau.mo },
  dong: { gap: 6 },
  vach: { borderTopWidth: 1, borderTopColor: mau.vien, paddingTop: khoang.m },
  sapHet: { backgroundColor: mau.canhNen, borderRadius: bo.vua, padding: khoang.m, borderTopWidth: 0 },
  dauDong: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: khoang.s, flexWrap: 'wrap' },
  bienSo: { fontSize: 18, fontWeight: '800', color: mau.chu, letterSpacing: 0.5 },
  hang: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: khoang.s, flexWrap: 'wrap' },
  tenGoi: { fontSize: chu.thuong, color: mau.chu, fontWeight: '600', flexShrink: 1 },
  thoiGian: { fontSize: chu.thuong, fontWeight: '700' },
  no: { fontSize: chu.nho, color: mau.loi, fontWeight: '600' },
});
