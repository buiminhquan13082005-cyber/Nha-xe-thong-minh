// Chép và chỉnh từ nha_de_xe/frontend/src/modules/tim-xe/components/DieuHuongToanCuc.tsx, sửa ở web thì nhớ sửa ở đây.
// Khác web: sessionStorage → bộ nhớ trong phiên chạy app; window event → hàm đăng ký người nghe; AppState thay document.hidden.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/shared/auth/AuthContext';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import { docNgay } from '@/shared/utils/ngayGio';
import { bo, bong, chu, khoang, mau } from '@/shared/theme';
import type { DieuHuongCuaToi, KhuCho, XeRaKhu } from '../models';
import { DemNguocGiuCho, ThoiGianDaDo } from './KhuUi';
import { ManHinhDanDuong } from './ManHinhDanDuong';
import { ManHinhDuongRa, type DuongRaDangXem } from './ManHinhDuongRa';
import { thongDiepLoi } from '@/shared/api/loiApi';

/** Đang dẫn đường: hỏi lại mỗi 3 giây (dự phòng khi tín hiệu SignalR phát ở bản API khác). Không dẫn: 15 giây. */
const CHU_KY_DAN = 3_000, CHU_KY_NGHI = 15_000;
/** Kết quả cũ hơn chừng này thì không tự bật màn hình (ví dụ vừa đăng nhập lại). */
const MOI_TRONG_MS = 30 * 60_000;
/** Chiều cao thanh tab dưới (để thanh dẫn đường nằm ngay trên). */
const CAO_THANH_TAB = 56;

// "Đã tự bật cho sự kiện này chưa": nhớ trong phiên chạy app (web dùng sessionStorage)
const daXemTrongPhien = new Set<string>();

const nguoiMo = new Set<() => void>();
/** Màn khác (Tìm xe, khi bấm thông báo "Mời vào khu …") yêu cầu bật màn hình chỉ đường. */
export function moManHinhDanDuong() { nguoiMo.forEach((f) => f()); }

const nguoiMoRa = new Set<(tuKhuId?: number, bienSo?: string) => void>();
/**
 * Mở màn "Đường ra cổng". tuKhuId có: đường từ khu đó (người dùng bấm "Chỉ đường ra cổng" ở Tìm xe).
 * Không có: xe vừa được camera RA của khu thấy (mở từ thông báo).
 */
export function moManHinhDuongRa(tuKhuId?: number, bienSo?: string) { nguoiMoRa.forEach((f) => f(tuKhuId, bienSo)); }

const raDangXem = (x: XeRaKhu): DuongRaDangXem =>
  ({ tuDong: true, luotGuiId: x.luotGuiId, bienSo: x.bienSo, tenKhu: x.tenKhu, raLuc: x.raLuc, duong: x.duong });

/** Khoá "sự kiện" để tự bật màn hình đúng một lần: phiên mới, đổi trạng thái, hoặc báo hết chỗ. */
function khoaSuKien(d: DieuHuongCuaToi): { khoa: string; luc: string } | null {
  if (d.phien) return { khoa: `${d.phien.id}:${d.phien.trangThai}`, luc: d.phien.khuThucTe?.vaoLuc ?? d.phien.batDauLuc };
  if (d.hetCho) return { khoa: `het:${d.hetCho.luc}`, luc: d.hetCho.luc };
  return null;
}

/**
 * Gắn ở gốc app (đã đăng nhập): xe vừa qua cổng là màn hình chỉ đường tự bật, ở bất kỳ màn nào.
 * Nghe SignalR (KHU, VAO, RA, DIEU_HUONG) để cập nhật ngay; hỏi lại định kỳ để không lỡ tín hiệu.
 */
export function DieuHuongToanCuc() {
  const { services } = useAuth();
  const insets = useSafeAreaInsets();
  const [du, setDu] = useState<DieuHuongCuaToi | null>(null);
  const [khu, setKhu] = useState<KhuCho[] | undefined>();
  const [mo, setMo] = useState(false);
  const [anThanh, setAnThanh] = useState<string | null>(null);
  const lanGoi = useRef(0);
  /** Xe của tôi vừa ra khỏi khu (camera RA của khu), và màn "Đường ra cổng" đang mở (null: đóng). */
  const [xeRa, setXeRa] = useState<XeRaKhu | null>(null);
  const [ra, setRaThat] = useState<DuongRaDangXem | null>(null);
  const lanGoiRa = useRef(0);
  /** Lượt gửi đã tải số chỗ khu cho màn đường ra (chỉ tải một lần mỗi lượt, không tải lại mỗi 3 giây). */
  const luotDaTaiKhu = useRef<number | null>(null);
  /** Thanh "Xe vừa ra khỏi khu" bị ẩn (riêng với thanh dẫn đường / đang đỗ). */
  const [anThanhRa, setAnThanhRa] = useState<string | null>(null);
  /** Mở màn đường ra thì đóng hẳn màn dẫn đường (không để nó hiện lại khi đóng màn đường ra). */
  const setRa = useCallback((r: DuongRaDangXem | null | ((c: DuongRaDangXem | null) => DuongRaDangXem | null)) => {
    setRaThat((c) => {
      const moi = typeof r === 'function' ? r(c) : r;
      if (moi) setMo(false);
      return moi;
    });
  }, []);
  // Màn xác nhận xe ra 60 giây được ưu tiên: đang mở thì không che bằng thanh / màn chỉ đường (mở lại khi đóng)
  const dangXacNhanRa = usePathname().startsWith('/xac-nhan-ra');

  const tai = useCallback(async () => {
    const lan = ++lanGoi.current;
    try {
      const d = await services.dieuHuong.layCuaToi();
      if (lan !== lanGoi.current) return;
      setDu(d);
      if (d.phien || d.hetCho) services.timXe.laySoXeKhu().then((s) => setKhu(s.khu)).catch(() => { /* giữ số cũ */ });
      const sk = khoaSuKien(d);
      if (sk && !daXemTrongPhien.has(sk.khoa)) {
        daXemTrongPhien.add(sk.khoa);
        // So hai mốc cùng của server (bayGio), không dùng đồng hồ điện thoại (có thể lệch / sai múi giờ)
        const luc = docNgay(sk.luc)?.getTime() ?? 0;
        const bayGio = docNgay(d.bayGio)?.getTime() ?? Date.now();
        if (bayGio - luc < MOI_TRONG_MS) setMo(true);
      }
    } catch { /* lỗi mạng: thử lại ở chu kỳ sau */ }
  }, [services]);

  const taiRa = useCallback(async (): Promise<XeRaKhu | null> => {
    const lan = ++lanGoiRa.current;
    try {
      const d = await services.dieuHuong.layDuongRaCuaToi();
      const x = d.xeRaKhu;
      if (lan !== lanGoiRa.current) return x;
      setXeRa(x);
      // Đã qua cổng ra (hoặc quá 15 phút): đóng màn tự bật. Màn người dùng tự mở thì để họ tự đóng.
      setRa((r) => (r?.tuDong ? (x ? raDangXem(x) : null) : r));
      if (x) {
        if (luotDaTaiKhu.current !== x.luotGuiId) {
          luotDaTaiKhu.current = x.luotGuiId;
          services.timXe.laySoXeKhu().then((so) => setKhu(so.khu)).catch(() => { luotDaTaiKhu.current = null; });
        }
        const khoa = `ra:${x.luotGuiId}:${x.raLuc}`;
        if (!daXemTrongPhien.has(khoa)) {
          daXemTrongPhien.add(khoa);
          const luc = docNgay(x.raLuc)?.getTime() ?? 0;
          const bayGio = docNgay(d.bayGio)?.getTime() ?? Date.now();
          if (bayGio - luc < MOI_TRONG_MS) setRa(raDangXem(x));
        }
      }
      return x;
    } catch { return null; /* lỗi mạng: thử lại ở chu kỳ sau */ }
  }, [services, setRa]);

  const dangDan = du?.phien?.trangThai === 'DANG_DAN';
  const dangRa = !!xeRa;
  useEffect(() => {
    void tai(); void taiRa();
    const id = setInterval(() => {
      if (AppState.currentState === 'active') { void tai(); void taiRa(); }
    }, dangDan || dangRa ? CHU_KY_DAN : CHU_KY_NGHI);
    const sub = AppState.addEventListener('change', (tt) => { if (tt === 'active') { void tai(); void taiRa(); } });
    return () => { clearInterval(id); sub.remove(); };
  }, [tai, taiRa, dangDan, dangRa]);
  useNgheThongBao((s) => { if (['KHU', 'VAO', 'RA', 'DIEU_HUONG'].includes(s.loai)) { void tai(); void taiRa(); } });
  useEffect(() => {
    const f = async (tuKhuId?: number, bienSo?: string) => {
      if (tuKhuId === undefined) {
        const x = await taiRa();
        if (x) setRa(raDangXem(x));
        return;
      }
      const ds = await services.timXe.laySoXeKhu().then((so) => so.khu).catch(() => undefined);
      if (ds) setKhu(ds);
      const tenKhu = ds?.find((k) => k.id === tuKhuId)?.ten ?? 'khu của bạn';
      try { setRa({ tuDong: false, bienSo, tenKhu, duong: await services.dieuHuong.layDuongRa(tuKhuId) }); }
      catch (e) { setRa({ tuDong: false, bienSo, tenKhu, duong: null, loi: thongDiepLoi(e) }); }
    };
    nguoiMoRa.add(f);
    return () => { nguoiMoRa.delete(f); };
  }, [services, taiRa, setRa]);
  useEffect(() => {
    const f = () => { void tai().then(() => setMo(true)); };
    nguoiMo.add(f);
    return () => { nguoiMo.delete(f); };
  }, [tai]);

  async function doiKhu(khuId: number) {
    await services.dieuHuong.doiKhuDich(khuId);
    await tai();
  }

  const p = du?.phien;
  const daDo = p && (p.trangThai === 'DA_TOI' || p.trangThai === 'TOI_KHU_KHAC') && p.khuThucTe;
  const khoaThanh = p ? `thanh:${p.id}:${p.trangThai}` : null;
  const hienThanh = !mo && !ra && !xeRa && !dangXacNhanRa && p && (dangDan || daDo) && anThanh !== khoaThanh;
  const khoaThanhRa = xeRa ? `ra:${xeRa.luotGuiId}:${xeRa.raLuc}` : null;
  const hienThanhRa = !mo && !ra && !dangXacNhanRa && xeRa && anThanhRa !== khoaThanhRa;

  return (
    <>
      {hienThanh && (
        <View style={[s.thanh, dangDan ? s.thanhDan : s.thanhDaDo, { bottom: insets.bottom + CAO_THANH_TAB + khoang.s }]} accessibilityRole="summary">
          {dangDan && p ? (
            <>
              <Text style={s.icon}>➜</Text>
              <Text style={s.chu} numberOfLines={2}>
                Đang dẫn đường tới <Text style={{ fontWeight: '800' }}>{p.khuDich.ten}</Text> · giữ chỗ {du && <DemNguocGiuCho hetHanLuc={p.hetHanLuc} bayGio={du.bayGio} />}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => setMo(true)} style={s.nutNho}><Text style={s.nutNhoChu}>Mở bản đồ</Text></Pressable>
            </>
          ) : daDo ? (
            <>
              <Text style={s.icon}>P</Text>
              <Text style={s.chu} numberOfLines={2}>
                Đang đỗ xe tại <Text style={{ fontWeight: '800' }}>{daDo.ten}</Text> · <ThoiGianDaDo tu={daDo.vaoLuc} />
              </Text>
              <Pressable accessibilityRole="button" onPress={() => setMo(true)} style={s.nutNho}><Text style={s.nutNhoChu}>Xem</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Ẩn" onPress={() => setAnThanh(khoaThanh)} hitSlop={10} style={s.nutX}>
                <Text style={s.nutXChu}>✕</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      )}

      {hienThanhRa && xeRa && (
        <View style={[s.thanh, s.thanhDan, { bottom: insets.bottom + CAO_THANH_TAB + khoang.s }]} accessibilityRole="summary">
          <Text style={s.icon}>➜</Text>
          <Text style={s.chu} numberOfLines={2}>
            Xe vừa ra khỏi <Text style={{ fontWeight: '800' }}>{xeRa.tenKhu}</Text> · đi tới Cổng ra Y
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setRa(raDangXem(xeRa))} style={s.nutNho}><Text style={s.nutNhoChu}>Xem đường ra</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Ẩn" onPress={() => setAnThanhRa(khoaThanhRa)} hitSlop={10} style={s.nutX}>
            <Text style={s.nutXChu}>✕</Text>
          </Pressable>
        </View>
      )}

      {ra && !dangXacNhanRa && <ManHinhDuongRa ra={ra} khu={khu} onDong={() => setRa(null)} />}

      {mo && !ra && !dangXacNhanRa && du && (du.phien || du.hetCho) && (
        <ManHinhDanDuong du={du} khu={khu} onDong={() => setMo(false)} onDoiKhu={doiKhu} />
      )}
    </>
  );
}

const s = StyleSheet.create({
  thanh: {
    position: 'absolute', left: khoang.m, right: khoang.m, flexDirection: 'row', alignItems: 'center', gap: khoang.s,
    paddingVertical: khoang.s, paddingHorizontal: khoang.m, borderRadius: bo.lon, ...bong, elevation: 10,
  },
  thanhDan: { backgroundColor: '#1f6fd1' },
  thanhDaDo: { backgroundColor: mau.chu },
  icon: { color: '#ffffff', fontSize: chu.vua, fontWeight: '900' },
  chu: { flex: 1, color: '#ffffff', fontSize: chu.nho },
  nutNho: { backgroundColor: '#ffffff', borderRadius: bo.vua, paddingHorizontal: khoang.m, minHeight: 36, justifyContent: 'center' },
  nutNhoChu: { color: mau.chu, fontWeight: '700', fontSize: chu.nho },
  nutX: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
  nutXChu: { color: '#ffffff', fontSize: 16 },
});
