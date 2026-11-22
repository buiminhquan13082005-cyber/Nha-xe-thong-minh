import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { API_URL, canhBaoDiaChi } from '@/shared/api/cauHinh';
import type { TrangThaiMayChu } from '@/shared/api/heThongService';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { Nut, The, ThongBao } from '@/shared/ui/ui';
import { chu, khoang, mau } from '@/shared/theme';

type KetQua =
  | { loai: 'dang-kiem-tra' }
  | { loai: 'ok'; may: TrangThaiMayChu; ms: number }
  | { loai: 'loi'; thongDiep: string };

/** Dò lỗi mạng (màn của Bước 0, mở từ chân màn Đăng nhập): gọi GET /api/health, hiện địa chỉ API và bản API đã trả lời. */
export default function KiemTraKetNoiScreen() {
  const { services, dangNap, phien } = useAuth();
  const canhBao = canhBaoDiaChi(API_URL);
  const [kq, setKq] = useState<KetQua>({ loai: 'dang-kiem-tra' });

  const kiemTra = useCallback(async () => {
    if (!API_URL) { setKq({ loai: 'loi', thongDiep: canhBaoDiaChi(API_URL) ?? '' }); return; }
    setKq({ loai: 'dang-kiem-tra' });
    const batDau = Date.now();
    try {
      const may = await services.heThong.kiemTraKetNoi();
      setKq({ loai: 'ok', may, ms: Date.now() - batDau });
    } catch (e) {
      setKq({ loai: 'loi', thongDiep: thongDiepLoi(e) });
    }
  }, [services]);

  useEffect(() => { void kiemTra(); }, [kiemTra]);

  return (
    <ScrollView style={s.manHinh} contentContainerStyle={s.noiDung}>
      <The style={{ gap: khoang.m }}>
        <View>
          <Text style={s.nhan}>Địa chỉ API</Text>
          <Text style={s.giaTri} selectable>{API_URL ?? '(chưa đặt)'}</Text>
        </View>
        {canhBao && API_URL && <ThongBao loai="canh">{canhBao}</ThongBao>}

        {kq.loai === 'dang-kiem-tra' && <ThongBao loai="tin">Đang kết nối…</ThongBao>}
        {kq.loai === 'ok' && (
          <ThongBao loai="ok">
            {`Kết nối API: ${kq.may.trangThai}\nBản API trả lời: ${kq.may.instance}\nThời gian: ${kq.ms} ms`}
          </ThongBao>
        )}
        {kq.loai === 'loi' && <ThongBao loai="loi">{kq.thongDiep}</ThongBao>}

        <Nut nhan="Thử lại" onPress={() => void kiemTra()} dangGui={kq.loai === 'dang-kiem-tra'} />
      </The>

      <The>
        <Text style={s.nhan}>Phiên đăng nhập đã lưu (SecureStore)</Text>
        <Text style={s.giaTri}>{dangNap ? 'Đang đọc…' : phien ? `${phien.hoTen} (${phien.vaiTro})` : 'Chưa có'}</Text>
      </The>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  manHinh: { flex: 1, backgroundColor: mau.nen },
  noiDung: { padding: khoang.l, gap: khoang.l },
  nhan: { fontSize: chu.nho, color: mau.mo, marginBottom: 2 },
  giaTri: { fontSize: chu.vua, color: mau.chu, fontWeight: '600' },
});
