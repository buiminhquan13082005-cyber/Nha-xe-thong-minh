import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Nut, ThongBao } from '@/shared/ui/ui';
import { bo, chu, khoang, mau } from '@/shared/theme';
import { ANH_TOI_DA_MB, type AnhDaChon } from '../utils/anhGiayDangKy';
import { chonAnhGiayDangKy, type NguonAnh } from '../utils/chonAnh';

/** Ô chọn ảnh giấy đăng ký (thay cho <input type="file"> của web): chụp hoặc chọn từ thư viện, có xem trước. */
export function ChonAnh({ anh, onChon }: { anh: AnhDaChon | null; onChon: (a: AnhDaChon | null) => void }) {
  const [dangChon, setDangChon] = useState<NguonAnh | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  async function chon(nguon: NguonAnh) {
    setLoi(null); setDangChon(nguon);
    const kq = await chonAnhGiayDangKy(nguon);
    setDangChon(null);
    if ('anh' in kq) onChon(kq.anh);
    else if ('loi' in kq) setLoi(kq.loi);
  }

  return (
    <View style={{ gap: khoang.s }}>
      <View style={s.hang}>
        <Nut kieu="phu" nhan="Chụp ảnh" onPress={() => void chon('camera')} dangGui={dangChon === 'camera'} tat={dangChon !== null} style={s.nut} />
        <Nut kieu="phu" nhan="Chọn từ thư viện" onPress={() => void chon('thu-vien')} dangGui={dangChon === 'thu-vien'} tat={dangChon !== null} style={s.nut} />
      </View>
      <Text style={s.mo}>JPG hoặc PNG, tối đa {ANH_TOI_DA_MB} MB. Chụp rõ biển số và tên chủ xe. Ảnh được thu nhỏ trước khi gửi.</Text>
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
      {anh && <Image source={{ uri: anh.uri }} style={s.xemTruoc} resizeMode="contain" accessibilityLabel="Xem trước ảnh giấy đăng ký" />}
    </View>
  );
}

const s = StyleSheet.create({
  hang: { flexDirection: 'row', gap: khoang.s, flexWrap: 'wrap' },
  nut: { flex: 1, minWidth: 140 },
  mo: { fontSize: chu.nho, color: mau.mo },
  xemTruoc: { width: '100%', height: 180, borderRadius: bo.vua, backgroundColor: mau.the2 },
});
