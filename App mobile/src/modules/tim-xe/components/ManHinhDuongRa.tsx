// Chép và chỉnh từ nha_de_xe/frontend/src/modules/tim-xe/components/ManHinhDuongRa.tsx, sửa ở web thì nhớ sửa ở đây.
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nut, ThongBao } from '@/shared/ui/ui';
import { dinhDangNgay, hienThiBienSo } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';
import type { DuongRaBanDo, KhuCho } from '../models';
import { BanDoBai } from './BanDoBai';

/** Nội dung màn "Đường ra cổng": tự bật khi camera RA của khu thấy xe, hoặc người dùng bấm "Chỉ đường ra cổng" ở Tìm xe. */
export interface DuongRaDangXem {
  /** true: tự bật từ GET dieu-huong/cua-toi/ra (đóng khi xe đã qua cổng ra). false: người dùng tự mở. */
  tuDong: boolean;
  luotGuiId?: number;
  bienSo?: string;
  tenKhu: string;
  /** Lúc camera RA của khu thấy xe (chỉ khi tự bật). */
  raLuc?: string;
  duong: DuongRaBanDo | null;
  loi?: string;
}

/**
 * Màn hình chỉ đường RA: từ khu xe vừa rời tới Cổng ra Y. Không dùng GPS: "Bạn đang ở đây" là đầu khu.
 * Tới cổng, camera cổng đọc biển và app hỏi người dùng xác nhận xe ra như thường.
 */
export function ManHinhDuongRa({ ra, khu, onDong }: { ra: DuongRaDangXem; khu: KhuCho[] | undefined; onDong: () => void }) {
  const d = ra.duong;
  const dau = d?.diem[0];
  return (
    <Modal visible animationType="slide" onRequestClose={onDong} presentationStyle="fullScreen">
      <SafeAreaView style={s.manHinh}>
        <View style={s.dau}>
          <View style={{ flex: 1 }}>
            <Text style={s.nhanNho}>ĐƯỜNG RA CỔNG</Text>
            {ra.bienSo && <Text style={s.bienSo}>{hienThiBienSo(ra.bienSo)}</Text>}
          </View>
          <Nut kieu="phu" nhan={ra.tuDong ? 'Thu nhỏ' : 'Đóng'} onPress={onDong} />
        </View>
        <ScrollView contentContainerStyle={s.than}>
          <View style={s.huongDan} accessibilityLiveRegion="polite">
            <Text style={s.cau}>Đi tới <Text style={{ fontWeight: '800' }}>Cổng ra Y</Text></Text>
            <Text style={s.mo}>
              {d ? `Khoảng ${d.tongMet} m từ ${ra.tenKhu}` : `Từ ${ra.tenKhu}`}
              {ra.raLuc ? ` · ra khỏi khu lúc ${dinhDangNgay(ra.raLuc).split(' ')[1] ?? ''}` : ''}
            </Text>
          </View>

          {ra.loi && <ThongBao loai="loi">{ra.loi}</ThongBao>}
          {!d && !ra.loi && <ThongBao loai="canh">{`Sơ đồ chưa có đường ra từ ${ra.tenKhu}. Đi theo biển chỉ dẫn tới Cổng ra Y.`}</ThongBao>}

          <BanDoBai khu={khu} duong={d} hienViTri={!!dau} viTri={dau} nhanCuoi={d ? 'Cổng ra Y' : undefined} />

          {d && d.diem.length > 1 && (
            <View style={s.cacBuoc}>
              {d.diem.filter((x) => x.ten).map((x, i) => <Text key={i} style={s.buoc}>{i + 1}. {x.ten}</Text>)}
            </View>
          )}
          <Text style={s.mo}>Tới cổng, camera đọc biển số và app sẽ hỏi bạn xác nhận cho xe ra.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  manHinh: { flex: 1, backgroundColor: mau.nen },
  dau: { flexDirection: 'row', alignItems: 'center', gap: khoang.m, paddingHorizontal: khoang.l, paddingVertical: khoang.m, borderBottomWidth: 1, borderBottomColor: mau.vien },
  nhanNho: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: mau.chinhChu },
  bienSo: { fontSize: chu.lon, fontWeight: '800', color: mau.chu },
  than: { padding: khoang.l, gap: khoang.l, paddingBottom: khoang.xxl },
  huongDan: { gap: 4 },
  cau: { fontSize: chu.lon, color: mau.chu },
  mo: { fontSize: chu.thuong, color: mau.mo },
  cacBuoc: { gap: 4, backgroundColor: mau.the, borderRadius: bo.vua, padding: khoang.m, borderWidth: 1, borderColor: mau.vien },
  buoc: { fontSize: chu.nho, color: mau.chu },
});
