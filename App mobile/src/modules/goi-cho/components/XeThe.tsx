// Chép và chỉnh từ nha_de_xe/frontend/src/modules/goi-cho/components/XeThe.tsx, sửa ở web thì nhớ sửa ở đây.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { Nhan, Nut, The, ThongBao } from '@/shared/ui/ui';
import { dinhDangNgay, dinhDangTien, hienThiBienSo, tenLoaiXe } from '@/shared/utils/format';
import { bo, chu, khoang, mau } from '@/shared/theme';
import type { XeDuocDung } from '../models';
import { loaiNhanDuyet, tenTrangThaiDuyet } from '../tenTrangThai';
import { kiemTraAnh, type AnhDaChon } from '../utils/anhGiayDangKy';
import { AnhGiayDangKy } from './AnhGiayDangKy';
import { ChonAnh } from './ChonAnh';

/** Thẻ một xe: trạng thái duyệt, gói, hạn, trong bãi, nợ phí, lý do từ chối / gỡ / huỷ gói; nút trả phí, mua / gia hạn gói. */
export function XeThe({ xe, onDoi, toSang = false }: { xe: XeDuocDung; onDoi?: () => Promise<void> | void; toSang?: boolean }) {
  const daDuyet = xe.trangThaiDuyet === 'DA_DUYET';
  const canAnh = xe.laChuXe && (xe.trangThaiDuyet === 'TU_CHOI' || (xe.trangThaiDuyet === 'CHO_DUYET' && !xe.coAnhGiayDangKy));
  const [xemAnh, setXemAnh] = useState(false);
  const [phienBanAnh, setPhienBanAnh] = useState(0);

  return (
    <The style={[{ gap: khoang.m }, toSang && s.toSang]}>
      <View style={s.dau}>
        <View style={{ flex: 1 }}>
          <Text style={s.bienSo}>{hienThiBienSo(xe.bienSo)}</Text>
          <Text style={s.mo}>{tenLoaiXe(xe.loaiXe)}{!xe.laChuXe && ` · Xe của ${xe.tenChuXe} (chia sẻ trong nhóm)`}</Text>
        </View>
        <Nhan chu={tenTrangThaiDuyet[xe.trangThaiDuyet]} loai={loaiNhanDuyet(xe.trangThaiDuyet)} />
      </View>

      <View style={s.bang}>
        <Dong nhan="Gói hiện tại" giaTri={xe.goiHienTai ?? (xe.conHan ? 'Gói chưa bắt đầu' : 'Chưa có')} />
        <Dong nhan="Hết hạn" giaTri={`${dinhDangNgay(xe.hetHanLuc)}${xe.hetHanLuc && !xe.conHan ? ' (đã hết)' : ''}`} loi={!!xe.hetHanLuc && !xe.conHan} />
        <Dong nhan="Trong bãi" giaTri={xe.dangTrongBai ? 'Đang gửi' : 'Không'} />
      </View>

      {xe.soNgayNo > 0 && <ThongBao loai="loi">{`Quá hạn ${xe.soNgayNo} ngày, còn nợ ${dinhDangTien(xe.soTienNo)}`}</ThongBao>}
      {xe.trangThaiDuyet === 'CHO_DUYET' && xe.coAnhGiayDangKy && <Text style={s.mo}>Admin duyệt xong mới mua gói được.</Text>}
      {xe.trangThaiDuyet === 'TU_CHOI' && (
        <ThongBao loai="loi">{`Admin từ chối duyệt. Lý do: ${xe.lyDoTuChoi ?? 'không ghi'}. Tải ảnh mới để gửi lại.`}</ThongBao>
      )}
      {xe.trangThaiDuyet === 'CHO_DUYET' && !xe.coAnhGiayDangKy && (
        <ThongBao loai="canh">Xe chưa có ảnh giấy đăng ký nên Admin chưa duyệt được.</ThongBao>
      )}
      {canAnh && (
        <TaiAnhLai xeId={xe.xeId} guiLai={xe.trangThaiDuyet === 'TU_CHOI'}
          onXong={async () => { setPhienBanAnh((n) => n + 1); await onDoi?.(); }} />
      )}
      {xe.goiBiHuyLyDo && xe.trangThaiDuyet !== 'BI_GO' && (
        <ThongBao loai="loi">{`Gói ${xe.goiBiHuyTen} bị Admin huỷ ngày ${dinhDangNgay(xe.goiBiHuyLuc)}. Lý do: ${xe.goiBiHuyLyDo}`}</ThongBao>
      )}
      {xe.trangThaiDuyet === 'BI_GO' && <ThongBao loai="loi">{`Xe bị Admin gỡ khỏi hệ thống. Lý do: ${xe.lyDoGo ?? 'không ghi'}`}</ThongBao>}

      {xe.laChuXe && xe.coAnhGiayDangKy && (
        <>
          <Nut kieu="phu" nhan={xemAnh ? 'Ẩn ảnh giấy đăng ký' : 'Xem ảnh giấy đăng ký'} onPress={() => setXemAnh((v) => !v)} />
          {xemAnh && <AnhGiayDangKy xeId={xe.xeId} phienBan={phienBanAnh} />}
        </>
      )}

      {(xe.soNgayNo > 0 || (daDuyet && xe.laChuXe)) && (
        <View style={s.hangNut}>
          {xe.soNgayNo > 0 && (
            <Nut kieu="loi" nhan="Trả phí quá hạn" style={s.nut}
              onPress={() => router.push({ pathname: '/phi-qua-han/[xeId]', params: { xeId: String(xe.xeId) } })} />
          )}
          {daDuyet && xe.laChuXe && (
            <Nut nhan={xe.conHan ? 'Gia hạn gói' : 'Mua gói'} style={s.nut}
              onPress={() => router.push({ pathname: '/mua-goi/[xeId]', params: { xeId: String(xe.xeId) } })} />
          )}
        </View>
      )}
    </The>
  );
}

function Dong({ nhan, giaTri, loi = false }: { nhan: string; giaTri: string; loi?: boolean }) {
  return (
    <View style={s.dong}>
      <Text style={s.nhan}>{nhan}</Text>
      <Text style={[s.giaTri, loi && { color: mau.loi }]}>{giaTri}</Text>
    </View>
  );
}

/** Tải ảnh cho xe chưa có ảnh, hoặc gửi lại xe bị từ chối. */
function TaiAnhLai({ xeId, guiLai, onXong }: { xeId: number; guiLai: boolean; onXong?: () => Promise<void> | void }) {
  const { services } = useAuth();
  const [anh, setAnh] = useState<AnhDaChon | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  async function gui() {
    const l = kiemTraAnh(anh); if (l) { setLoi(l); return; }
    setDangGui(true); setLoi(null);
    try { await services.xe.taiAnhGiayDangKy(xeId, anh!); setAnh(null); await onXong?.(); }
    catch (e) { setLoi(thongDiepLoi(e)); }
    finally { setDangGui(false); }
  }
  return (
    <View style={s.taiLai}>
      <ChonAnh anh={anh} onChon={setAnh} />
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
      <Nut nhan={dangGui ? 'Đang gửi…' : guiLai ? 'Gửi lại để duyệt' : 'Tải ảnh lên'} onPress={() => void gui()} dangGui={dangGui} tat={!anh} />
    </View>
  );
}

const s = StyleSheet.create({
  toSang: { borderColor: mau.chinh, borderWidth: 2 },
  dau: { flexDirection: 'row', alignItems: 'flex-start', gap: khoang.s },
  bienSo: { fontSize: 22, fontWeight: '800', color: mau.chu, letterSpacing: 0.5 },
  mo: { fontSize: chu.nho, color: mau.mo },
  bang: { gap: 6 },
  dong: { flexDirection: 'row', justifyContent: 'space-between', gap: khoang.s },
  nhan: { fontSize: chu.nho, color: mau.mo },
  giaTri: { fontSize: chu.thuong, color: mau.chu, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  hangNut: { flexDirection: 'row', flexWrap: 'wrap', gap: khoang.s },
  nut: { flex: 1, minWidth: 140 },
  taiLai: { gap: khoang.s, padding: khoang.m, borderRadius: bo.vua, backgroundColor: mau.the2 },
});
