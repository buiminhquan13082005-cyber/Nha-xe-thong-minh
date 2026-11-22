import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import type { DieuHuongCuaToi, KhuCho, XeRaKhu } from '../models';
import { GiaDieuHuongService } from '../services/dieuHuongGia';
import { DemNguocGiuCho } from './DemNguocGiuCho';
import { ManHinhDanDuong, ThoiGianDaDo } from './ManHinhDanDuong';
import { ManHinhDuongRa, type DuongRaDangXem } from './ManHinhDuongRa';

/** Đang dẫn đường: hỏi lại mỗi 3 giây (dự phòng khi tín hiệu SignalR phát ở bản API khác). Không dẫn: 15 giây. */
const CHU_KY_DAN = 3_000, CHU_KY_NGHI = 15_000;
/** Kết quả cũ hơn chừng này thì không tự bật màn hình (ví dụ vừa đăng nhập lại). */
const MOI_TRONG_MS = 30 * 60_000;

const daXem = (khoa: string) => { try { return sessionStorage.getItem(`dh:${khoa}`) === '1'; } catch { return false; } };
const ghiDaXem = (khoa: string) => { try { sessionStorage.setItem(`dh:${khoa}`, '1'); } catch { /* chế độ riêng tư: bỏ qua */ } };

const SU_KIEN_MO = 'nx:mo-dan-duong';
/** Trang khác (Tìm xe, khi bấm thông báo "Mời vào khu …") yêu cầu bật màn hình chỉ đường. */
export function moManHinhDanDuong() { window.dispatchEvent(new Event(SU_KIEN_MO)); }

const SU_KIEN_MO_RA = 'nx:mo-duong-ra';
/**
 * Mở màn "Đường ra cổng". tuKhuId có: đường từ khu đó (người dùng bấm "Chỉ đường ra cổng" ở Tìm xe).
 * Không có: xe vừa được camera RA của khu thấy (mở từ thông báo).
 */
export function moManHinhDuongRa(tuKhuId?: number, bienSo?: string) {
  window.dispatchEvent(new CustomEvent(SU_KIEN_MO_RA, { detail: { tuKhuId, bienSo } }));
}

const raDangXem = (x: XeRaKhu): DuongRaDangXem =>
  ({ tuDong: true, luotGuiId: x.luotGuiId, bienSo: x.bienSo, tenKhu: x.tenKhu, raLuc: x.raLuc, duong: x.duong });

/** Khoá "sự kiện" để tự bật màn hình đúng một lần: phiên mới, đổi trạng thái, hoặc báo hết chỗ. */
function khoaSuKien(d: DieuHuongCuaToi): { khoa: string; luc: string } | null {
  if (d.phien) return { khoa: `${d.phien.id}:${d.phien.trangThai}`, luc: d.phien.khuThucTe?.vaoLuc ?? d.phien.batDauLuc };
  if (d.hetCho) return { khoa: `het:${d.hetCho.luc}`, luc: d.hetCho.luc };
  return null;
}

/**
 * Gắn ở Layout của người dùng: xe vừa qua cổng là màn hình chỉ đường tự bật, ở bất kỳ trang nào.
 * Nghe SignalR (/hub/thong-bao) để cập nhật ngay; hỏi lại định kỳ để không lỡ tín hiệu.
 */
export function DieuHuongToanCuc() {
  const { services } = useApp();
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

  const taiRa = useCallback(async () => {
    const lan = ++lanGoiRa.current;
    try {
      const x = (await services.dieuHuong.layDuongRaCuaToi()).xeRaKhu;
      if (lan !== lanGoiRa.current) return x;
      setXeRa(x);
      // Đã qua cổng ra (hoặc quá 15 phút): đóng màn tự bật. Màn người dùng tự mở thì để họ tự đóng.
      setRa((r) => (r?.tuDong ? (x ? raDangXem(x) : null) : r));
      if (x) {
        if (luotDaTaiKhu.current !== x.luotGuiId) {
          luotDaTaiKhu.current = x.luotGuiId;
          services.timXe.laySoXeKhu().then((s) => setKhu(s.khu)).catch(() => { luotDaTaiKhu.current = null; });
        }
        const khoa = `ra:${x.luotGuiId}:${x.raLuc}`;
        if (!daXem(khoa)) {
          ghiDaXem(khoa);
          if (Date.now() - new Date(x.raLuc).getTime() < MOI_TRONG_MS) setRa(raDangXem(x));
        }
      }
      return x;
    } catch { return null; /* chưa có API hoặc lỗi mạng: thử lại ở chu kỳ sau */ }
  }, [services]);

  const tai = useCallback(async () => {
    const lan = ++lanGoi.current;
    try {
      const d = await services.dieuHuong.layCuaToi();
      if (lan !== lanGoi.current) return;
      setDu(d);
      if (d.phien || d.hetCho) services.timXe.laySoXeKhu().then((s) => setKhu(s.khu)).catch(() => { /* giữ số cũ */ });
      const sk = khoaSuKien(d);
      if (sk && !daXem(sk.khoa)) {
        ghiDaXem(sk.khoa);
        if (Date.now() - new Date(sk.luc).getTime() < MOI_TRONG_MS) setMo(true);
      }
    } catch { /* chưa có API hoặc lỗi mạng: thử lại ở chu kỳ sau */ }
  }, [services, setRa]);

  const dangDan = du?.phien?.trangThai === 'DANG_DAN';
  const dangRa = !!xeRa;
  useEffect(() => {
    void tai(); void taiRa();
    const id = window.setInterval(() => { if (!document.hidden) { void tai(); void taiRa(); } }, dangDan || dangRa ? CHU_KY_DAN : CHU_KY_NGHI);
    return () => window.clearInterval(id);
  }, [tai, taiRa, dangDan, dangRa]);
  useNgheThongBao((s) => { if (['KHU', 'VAO', 'RA', 'DIEU_HUONG'].includes(s.loai)) { void tai(); void taiRa(); } });
  useEffect(() => {
    const mo = async (e: Event) => {
      const { tuKhuId, bienSo } = (e as CustomEvent<{ tuKhuId?: number; bienSo?: string }>).detail ?? {};
      if (tuKhuId === undefined) {
        const x = await taiRa();
        if (x) setRa(raDangXem(x));
        return;
      }
      const ds = await services.timXe.laySoXeKhu().then((s) => s.khu).catch(() => undefined);
      if (ds) setKhu(ds);
      const tenKhu = ds?.find((k) => k.id === tuKhuId)?.ten ?? 'khu của bạn';
      try { setRa({ tuDong: false, bienSo, tenKhu, duong: await services.dieuHuong.layDuongRa(tuKhuId) }); }
      catch (err) { setRa({ tuDong: false, bienSo, tenKhu, duong: null, loi: (err as Error).message }); }
    };
    window.addEventListener(SU_KIEN_MO_RA, mo);
    return () => window.removeEventListener(SU_KIEN_MO_RA, mo);
  }, [services, taiRa, setRa]);
  useEffect(() => {
    const mo = () => { void tai().then(() => setMo(true)); };
    window.addEventListener(SU_KIEN_MO, mo);
    return () => window.removeEventListener(SU_KIEN_MO, mo);
  }, [tai]);

  async function doiKhu(khuId: number) {
    await services.dieuHuong.doiKhuDich(khuId);
    await tai();
  }

  const p = du?.phien;
  const daDo = p && (p.trangThai === 'DA_TOI' || p.trangThai === 'TOI_KHU_KHAC') && p.khuThucTe;
  const khoaThanh = p ? `thanh:${p.id}:${p.trangThai}` : null;
  const hienThanh = !mo && !ra && !xeRa && p && (dangDan || daDo) && anThanh !== khoaThanh;
  const khoaThanhRa = xeRa ? `ra:${xeRa.luotGuiId}:${xeRa.raLuc}` : null;
  const hienThanhRa = !mo && !ra && xeRa && anThanhRa !== khoaThanhRa;
  const giaLap = services.dieuHuong instanceof GiaDieuHuongService ? services.dieuHuong.giaLap : null;

  return (
    <>
      {hienThanh && (
        <div className={`thanh-dan-duong ${dangDan ? '' : 'thanh-da-do'}`} role="status">
          {dangDan && p ? (
            <>
              <span className="thanh-icon" aria-hidden="true">➜</span>
              <span>Đang dẫn đường tới <strong>{p.khuDich.ten}</strong> · giữ chỗ {du && <DemNguocGiuCho hetHanLuc={p.hetHanLuc} bayGio={du.bayGio} />}</span>
              <button type="button" className="nut nut-nho" onClick={() => setMo(true)}>Mở bản đồ</button>
            </>
          ) : daDo ? (
            <>
              <span className="thanh-icon" aria-hidden="true">P</span>
              <span>Đang đỗ xe tại <strong>{daDo.ten}</strong> · <ThoiGianDaDo tu={daDo.vaoLuc} /></span>
              <button type="button" className="nut nut-phu nut-nho" onClick={() => setMo(true)}>Xem</button>
              <button type="button" className="nut-x" aria-label="Ẩn" onClick={() => setAnThanh(khoaThanh)}>✕</button>
            </>
          ) : null}
        </div>
      )}

      {hienThanhRa && xeRa && (
        <div className="thanh-dan-duong" role="status">
          <span className="thanh-icon" aria-hidden="true">➜</span>
          <span>Xe vừa ra khỏi <strong>{xeRa.tenKhu}</strong> · đi tới Cổng ra Y</span>
          <button type="button" className="nut nut-nho" onClick={() => setRa(raDangXem(xeRa))}>Xem đường ra</button>
          <button type="button" className="nut-x" aria-label="Ẩn" onClick={() => setAnThanhRa(khoaThanhRa)}>✕</button>
        </div>
      )}

      {ra && <ManHinhDuongRa ra={ra} khu={khu} onDong={() => setRa(null)} />}

      {mo && !ra && du && (du.phien || du.hetCho) && (
        <ManHinhDanDuong du={du} khu={khu} onDong={() => setMo(false)} onDoiKhu={doiKhu} />
      )}

      {giaLap && <BangGiaLap giaLap={giaLap} sauKhi={async () => { await tai(); await taiRa(); setMo(true); }} />}
    </>
  );
}

/** Chỉ có khi chạy dữ liệu giả: bấm để giả lập camera cổng, camera khu, hết giờ... */
function BangGiaLap({ giaLap, sauKhi }: { giaLap: GiaDieuHuongService['giaLap']; sauKhi: () => Promise<void> }) {
  const [mo, setMo] = useState(false);
  const nut = (ten: string, f: () => Promise<void>) => (
    <button type="button" className="nut nut-phu nut-nho" onClick={async () => { await f(); await sauKhi(); }}>{ten}</button>
  );
  return (
    <div className={`bang-gia-lap ${mo ? 'mo' : ''}`}>
      <button type="button" className="bang-gia-lap-dau" onClick={() => setMo((m) => !m)} aria-expanded={mo}>Giả lập (dữ liệu giả) {mo ? '▾' : '▸'}</button>
      {mo && (
        <div className="bang-gia-lap-than">
          {nut('1. Xe máy vào Cổng X', () => giaLap.vaoCong())}
          {nut('Camera VÀO khu đích thấy xe', giaLap.toiDung)}
          {nut('Camera VÀO khu khác (còn chỗ)', giaLap.toiKhuKhac)}
          {nut('Tới khu đã đầy (bị chặn)', giaLap.toiKhuDay)}
          {nut('Còn 20 giây giữ chỗ', giaLap.sapHetGio)}
          {nut('Hết 5 phút giữ chỗ', giaLap.hetHan)}
          {nut('Camera RA của khu thấy xe', giaLap.raKhoiKhu)}
          {nut('Xe ra Cổng Y', giaLap.raCong)}
          {nut('Vào cổng khi mọi khu đầy', () => giaLap.vaoCong(true))}
          {nut('Xoá phiên', giaLap.xoa)}
        </div>
      )}
    </div>
  );
}
