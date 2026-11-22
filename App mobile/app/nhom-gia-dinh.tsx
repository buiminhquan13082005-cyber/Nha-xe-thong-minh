import { useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { kieuChung, ManHinh } from '@/shared/ui/ManHinh';
import { ONhap } from '@/shared/ui/ONhap';
import { LienKet, Nhan, Nut, The, ThongBao } from '@/shared/ui/ui';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { dinhDangNgay } from '@/shared/utils/format';
import { chu, khoang, mau } from '@/shared/theme';

const TEN_YEU_CAU: Record<string, string> = { CHO_DUYET: 'Chờ chủ nhóm duyệt', DONG_Y: 'Đã đồng ý', TU_CHOI: 'Đã từ chối' };

/** Hỏi lại trước thao tác khó hoàn tác (thay cho window.confirm của web). */
function hoiTruoc(tieuDe: string, noiDung: string, nutDongY: string, lam: () => void) {
  Alert.alert(tieuDe, noiDung, [{ text: 'Thôi', style: 'cancel' }, { text: nutDongY, style: 'destructive', onPress: lam }]);
}

/**
 * Nhóm gia đình (giống NhomGiaDinhPage.tsx của web): chưa có nhóm thì tạo nhóm / xin vào bằng mã mời;
 * chủ nhóm thấy mã mời (chia sẻ qua Zalo, tin nhắn… bằng Share), đổi mã, duyệt yêu cầu, xoá thành viên, giải tán;
 * thành viên rời nhóm. Mỗi tài khoản thuộc tối đa một nhóm.
 */
export default function NhomGiaDinhScreen() {
  const { services, phien } = useAuth();
  const api = services.nhomGiaDinh;
  const ds = useTaiDuLieu(() => api.xem(), [api]);
  const [ten, setTen] = useState('');
  const [ma, setMa] = useState('');
  const [ban, setBan] = useState(false);
  const [loi, setLoi] = useState('');
  const [tin, setTin] = useState('');
  const [dangKeo, setDangKeo] = useState(false);

  async function lam(viec: () => Promise<unknown>, thanhCong?: string) {
    if (ban) return;
    setBan(true); setLoi(''); setTin('');
    try { await viec(); await ds.taiLai(); if (thanhCong) setTin(thanhCong); }
    catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setBan(false); }
  }

  async function keo() { setDangKeo(true); await ds.taiLai(); setDangKeo(false); }

  async function chiaSeMa(maMoi: string, tenNhom: string, het: string | null) {
    try {
      await Share.share({
        message: `Mời bạn vào nhóm gia đình "${tenNhom}" trên app Nhà xe thông minh. Mã mời: ${maMoi}${het ? ` (hết hạn ${dinhDangNgay(het)})` : ''}. Vào Tài khoản → Nhóm gia đình → Tham gia bằng mã mời.`,
      });
    } catch { setLoi('Không mở được khung chia sẻ của điện thoại.'); }
  }

  const nhom = ds.duLieu?.nhom;
  const laChu = !!nhom && nhom.chuNhomId === phien?.id;

  return (
    <ManHinh vien={[]} dangKeo={dangKeo} onKeo={() => void keo()}>
      <Text style={kieuChung.mo}>Mỗi tài khoản thuộc tối đa một nhóm. Chỉ thành viên đã được duyệt mới dùng được xe có bật chia sẻ nhóm.</Text>
      {loi ? <ThongBao loai="loi">{loi}</ThongBao> : null}
      {tin ? <ThongBao loai="ok">{tin}</ThongBao> : null}
      {ds.loi && !ds.duLieu && <Nut kieu="phu" nhan="Thử lại" onPress={() => void ds.taiLai()} />}
      {ds.loi && !ds.duLieu && <ThongBao loai="loi">{ds.loi}</ThongBao>}
      {ds.dangTai && !ds.duLieu && <ActivityIndicator color={mau.chinh} style={{ paddingVertical: khoang.xl }} />}

      {ds.duLieu && !nhom && (
        <>
          <The style={{ gap: khoang.m }}>
            <Text style={kieuChung.tieuDeMuc}>Tạo nhóm mới</Text>
            <ONhap nhan="Tên nhóm" value={ten} onChangeText={setTen} maxLength={100} placeholder="VD: Nhà An" />
            <Nut nhan="Tạo nhóm" dangGui={ban} tat={ten.trim().length < 2}
              onPress={() => void lam(() => api.tao(ten.trim()), 'Đã tạo nhóm. Chia sẻ mã mời cho người nhà để họ xin vào nhóm.')} />
          </The>
          <The style={{ gap: khoang.m }}>
            <Text style={kieuChung.tieuDeMuc}>Tham gia bằng mã mời</Text>
            <ONhap nhan="Mã mời" value={ma} onChangeText={(v) => setMa(v.toUpperCase())} maxLength={10}
              autoCapitalize="characters" autoCorrect={false} placeholder="6 – 10 ký tự" />
            <Nut nhan="Gửi yêu cầu" dangGui={ban} tat={ma.trim().length < 6}
              onPress={() => void lam(() => api.xinThamGia(ma.trim()), 'Đã gửi yêu cầu. Chờ chủ nhóm duyệt.')} />
          </The>
          <The style={{ gap: khoang.s }}>
            <Text style={kieuChung.tieuDeMuc}>Yêu cầu của tôi</Text>
            {ds.duLieu.yeuCauCuaToi.length === 0
              ? <Text style={kieuChung.mo}>Chưa có yêu cầu.</Text>
              : ds.duLieu.yeuCauCuaToi.map((y) => (
                <Text key={y.id} style={kieuChung.mo}>Nhóm #{y.nhomId}: {TEN_YEU_CAU[y.trangThai] ?? y.trangThai}</Text>
              ))}
          </The>
        </>
      )}

      {nhom && (
        <>
          <The style={{ gap: khoang.m }}>
            <Text style={s.tenNhom}>{nhom.ten}</Text>
            <Text style={kieuChung.mo}>{nhom.thanhVien.length} thành viên · Bạn là {laChu ? 'chủ nhóm' : 'thành viên'}</Text>
            {laChu && nhom.maMoi && (
              <View style={s.oMa}>
                <Text style={kieuChung.nhan}>Mã mời</Text>
                <Text style={s.ma} selectable>{nhom.maMoi}</Text>
                <Text style={kieuChung.moNho}>Hết hạn: {dinhDangNgay(nhom.maHetHanLuc)}</Text>
                <View style={kieuChung.hangNut}>
                  <Nut nhan="Chia sẻ mã mời" onPress={() => void chiaSeMa(nhom.maMoi!, nhom.ten, nhom.maHetHanLuc)} style={kieuChung.nutGian} />
                  <Nut kieu="phu" nhan="Tạo mã mới" tat={ban} style={kieuChung.nutGian}
                    onPress={() => void lam(() => api.doiMa(), 'Đã tạo mã mời mới. Mã cũ không dùng được nữa.')} />
                </View>
              </View>
            )}
            {nhom.thanhVien.map((v) => (
              <View key={v.taiKhoanId} style={[kieuChung.dong, kieuChung.vach, { alignItems: 'center' }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.tv}>Tài khoản #{v.taiKhoanId}{v.taiKhoanId === phien?.id ? ' (bạn)' : ''}</Text>
                  <Nhan chu={v.vaiTro === 'CHU' ? 'Chủ nhóm' : 'Thành viên'} loai={v.vaiTro === 'CHU' ? 'tin' : 'mo'} />
                </View>
                {laChu && v.taiKhoanId !== phien?.id && (
                  <Nut kieu="phu" nhan="Xoá" tat={ban}
                    onPress={() => hoiTruoc('Xoá thành viên?', 'Họ sẽ mất quyền dùng xe chia sẻ trong nhóm.', 'Xoá',
                      () => void lam(() => api.xoaThanhVien(v.taiKhoanId), 'Đã xoá thành viên khỏi nhóm.'))} />
                )}
              </View>
            ))}
            <LienKet nhan="Xem xe được chia sẻ" onPress={() => router.navigate('/xe')} />
          </The>

          {laChu && (
            <The style={{ gap: khoang.m }}>
              <Text style={kieuChung.tieuDeMuc}>Chờ duyệt</Text>
              {nhom.yeuCau.length === 0 ? <Text style={kieuChung.mo}>Không có yêu cầu mới.</Text> : nhom.yeuCau.map((y) => (
                <View key={y.id} style={{ gap: khoang.s }}>
                  <Text style={s.tv}>Tài khoản #{y.taiKhoanId} · gửi lúc {dinhDangNgay(y.taoLuc)}</Text>
                  <View style={kieuChung.hangNut}>
                    <Nut nhan="Đồng ý" tat={ban} style={kieuChung.nutGian} onPress={() => void lam(() => api.xuLy(y.id, true), 'Đã thêm thành viên vào nhóm.')} />
                    <Nut kieu="phu" nhan="Từ chối" tat={ban} style={kieuChung.nutGian} onPress={() => void lam(() => api.xuLy(y.id, false))} />
                  </View>
                </View>
              ))}
            </The>
          )}

          <Nut kieu="loi" nhan={laChu ? 'Giải tán nhóm' : 'Rời nhóm'} tat={ban}
            onPress={() => hoiTruoc(
              laChu ? 'Giải tán nhóm?' : 'Rời nhóm?',
              laChu ? 'Tất cả thành viên sẽ mất quyền dùng chung xe.' : 'Bạn sẽ mất quyền dùng chung xe của nhóm.',
              laChu ? 'Giải tán' : 'Rời nhóm',
              () => void lam(() => (laChu ? api.giaiTan() : api.roi()), laChu ? 'Đã giải tán nhóm.' : 'Bạn đã rời nhóm.'),
            )} />
        </>
      )}
    </ManHinh>
  );
}

const s = StyleSheet.create({
  tenNhom: { fontSize: chu.lon, fontWeight: '800', color: mau.chu },
  oMa: { backgroundColor: mau.the2, borderRadius: 10, padding: khoang.m, gap: 4 },
  ma: { fontSize: 28, fontWeight: '900', letterSpacing: 4, color: mau.chinhChu },
  tv: { fontSize: chu.thuong, color: mau.chu, fontWeight: '600' },
});
