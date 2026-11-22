// Chép và chỉnh từ nha_de_xe/frontend/src/modules/goi-cho/components/ThemXeForm.tsx, sửa ở web thì nhớ sửa ở đây.
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { ChonMot } from '@/shared/ui/ChonMot';
import { ONhap } from '@/shared/ui/ONhap';
import { Nut, The, ThongBao } from '@/shared/ui/ui';
import { chu, khoang, mau } from '@/shared/theme';
import type { ChoConBan } from '../models';
import { kiemTraAnh, type AnhDaChon } from '../utils/anhGiayDangKy';
import { canhBaoChoKhach, hetCho, timChoCon } from '../utils/choCon';
import { ChonAnh } from './ChonAnh';

/** Form thêm xe: chỉ lo nhập liệu và kiểm tra sơ bộ, việc gọi API do màn cha truyền vào (SRP). */
export function ThemXeForm({ onGui, onHuy, choConBan }: {
  onGui: (loaiXeId: number, bienSo: string, chiaSe: boolean, anh: AnhDaChon) => Promise<void>;
  onHuy: () => void;
  choConBan?: ChoConBan[];
}) {
  const [loaiXeId, setLoaiXeId] = useState(2);
  const [bienSo, setBienSo] = useState('');
  const [chiaSe, setChiaSe] = useState(false);
  const [anh, setAnh] = useState<AnhDaChon | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const cho = timChoCon(choConBan, loaiXeId);
  const canhBao = canhBaoChoKhach(cho);

  async function gui() {
    if (dangGui) return;
    if (bienSo.replace(/[^0-9a-z]/gi, '').length < 7) { setLoi('Biển số phải có ít nhất 7 ký tự chữ và số.'); return; }
    const loiAnh = kiemTraAnh(anh);
    if (loiAnh) { setLoi(loiAnh); return; }
    setDangGui(true); setLoi(null);
    try { await onGui(loaiXeId, bienSo, chiaSe, anh!); }
    catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setDangGui(false); }
  }

  return (
    <The style={{ gap: khoang.l }}>
      <Text style={s.tieuDe}>Đăng ký xe mới</Text>
      <ChonMot nhan="Loại xe" giaTri={loaiXeId} onChon={setLoaiXeId}
        luaChon={[{ giaTri: 2, ten: 'Xe máy' }, { giaTri: 1, ten: 'Ô tô' }]} />
      {canhBao && <ThongBao loai={hetCho(cho) ? 'canh' : 'tin'}>{canhBao}</ThongBao>}
      <ONhap nhan="Biển số" value={bienSo} onChangeText={setBienSo} placeholder="VD: 29B1-123.45"
        autoCapitalize="characters" autoCorrect={false} maxLength={20} />
      <View style={{ gap: khoang.s }}>
        <Text style={s.nhan}>Ảnh giấy đăng ký xe (cà vẹt)</Text>
        <ChonAnh anh={anh} onChon={setAnh} />
      </View>
      <View style={s.hang}>
        <Text style={s.chu}>Chia sẻ xe cho nhóm gia đình</Text>
        <Switch value={chiaSe} onValueChange={setChiaSe} trackColor={{ true: mau.phuNgoc, false: mau.vien }} thumbColor={mau.the}
          accessibilityLabel="Chia sẻ xe cho nhóm gia đình" />
      </View>
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
      <View style={s.hangNut}>
        <Nut nhan={dangGui ? 'Đang gửi…' : 'Gửi đăng ký'} onPress={() => void gui()} dangGui={dangGui} style={s.nut} />
        <Nut kieu="phu" nhan="Huỷ" onPress={onHuy} tat={dangGui} style={s.nut} />
      </View>
    </The>
  );
}

const s = StyleSheet.create({
  tieuDe: { fontSize: chu.vua, fontWeight: '700', color: mau.chu },
  nhan: { fontSize: chu.nho, fontWeight: '600', color: mau.nhanO },
  hang: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: khoang.m },
  chu: { fontSize: chu.thuong, color: mau.chu, flex: 1 },
  hangNut: { flexDirection: 'row', gap: khoang.s },
  nut: { flex: 1 },
});
