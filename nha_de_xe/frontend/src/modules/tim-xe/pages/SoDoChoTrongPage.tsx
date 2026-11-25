import { useState } from 'react';
import { DangTai, ThongBao } from '@/shared/ui/ui';
import { SoChay } from '@/shared/ui/SoChay';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { useApp } from '@/app/AppContext';
import { BanDoBai } from '../components/BanDoBai';
import { MucChoKhu } from '../components/MucChoKhu';
import { TheKhu } from '../components/TheKhu';
import type { DuongDiBanDo, KhuCho } from '../models';
import { TEN_MUC } from '../models';
import { khuOToTrenSoDo, khuXeMayTrenSoDo, LOAI_O_TO, LOAI_XE_MAY } from '../soDoBai';

type Loc = 'TAT_CA' | 'XE_MAY' | 'O_TO';
const TEN_LOC: Record<Loc, string> = { TAT_CA: 'Tất cả', XE_MAY: 'Xe máy', O_TO: 'Ô tô' };

/**
 * Sơ đồ chỗ trống (Admin và người dùng cùng xem): chấm tròn là khu xe máy (R, S, Hầm B1/B2), chấm vuông là khu ô tô (A–Q).
 * Nút lọc "Xe máy / Ô tô" chỉ hiện chấm của một loại. Khu ô tô chưa đặt sức chứa hiện màu xám.
 * Số trên chấm là chỗ còn trống (đã trừ suất đang giữ cho xe vừa qua cổng). Tự cập nhật mỗi 10 giây.
 * Người dùng: chạm chấm khu → thẻ khu → "Xem đường đi" từ Cổng vào X (chỉ để xem: không tạo phiên, không giữ suất).
 * Admin: chạm chấm chỉ xem thông tin khu, không có nút chỉ đường.
 */
export function SoDoChoTrongPage() {
  const { services, phien } = useApp();
  const laAdmin = phien?.vaiTro === 'ADMIN';
  const ds = useTaiDuLieu(() => services.timXe.laySoXeKhu(), [], 10_000);
  const khuXeMay = khuXeMayTrenSoDo(ds.duLieu?.khu);
  const khuOTo = khuOToTrenSoDo(ds.duLieu?.khu);
  const [loc, setLoc] = useState<Loc>('TAT_CA');

  const [chonId, setChonId] = useState<number | null>(null);
  const [duong, setDuong] = useState<DuongDiBanDo | null>(null);
  const [loiDuong, setLoiDuong] = useState<string | null>(null);
  const hienCham = loc === 'XE_MAY' ? khuXeMay : loc === 'O_TO' ? khuOTo : [...khuXeMay, ...khuOTo];
  const chon = hienCham.find((k) => k.id === chonId) ?? null;

  async function xemDuong(khuId: number) {
    setLoiDuong(null);
    try { setDuong(await services.dieuHuong.layDuongDi(khuId)); }
    catch (e) { setLoiDuong((e as Error).message); }
  }

  function doiLoc(l: Loc) {
    setLoc(l);
    // chấm đang chọn / đường đang vẽ thuộc loại bị ẩn thì bỏ
    const conHien = (id: number | null | undefined) => l === 'TAT_CA' || (l === 'XE_MAY' ? khuXeMay : khuOTo).some((k) => k.id === id);
    if (!conHien(chonId)) setChonId(null);
    if (duong && !conHien(duong.denKhuId)) setDuong(null);
  }

  return (
    <>
      <div className="tieu-de-trang">
        <h1>Sơ đồ chỗ trống</h1>
        <button className="nut nut-phu nut-nho" onClick={() => ds.taiLai()} disabled={ds.dangTai}>Tải lại</button>
      </div>

      <div className="hang-tong-cho">
        <TongCho nhan="chỗ xe máy còn trống" khu={khuXeMay} daTai={!!ds.duLieu} bayGio={ds.duLieu?.bayGio} />
        <TongCho nhan="chỗ ô tô còn trống" khu={khuOTo} daTai={!!ds.duLieu} bayGio={ds.duLieu?.bayGio} />
      </div>

      <div className="loc-loai-xe" role="group" aria-label="Hiện khu của loại xe">
        {(Object.keys(TEN_LOC) as Loc[]).map((l) => (
          <button key={l} type="button" className={`nut nut-nho ${loc === l ? '' : 'nut-phu'}`} aria-pressed={loc === l} onClick={() => doiLoc(l)}>
            {TEN_LOC[l]}
          </button>
        ))}
      </div>

      <div className="chu-thich-so-do">
        <span><i className="cham muc-CON_NHIEU" /> {TEN_MUC.CON_NHIEU} (trên 20%)</span>
        <span><i className="cham muc-SAP_DAY" /> {TEN_MUC.SAP_DAY} (20% trở xuống)</span>
        <span><i className="cham muc-DAY" /> {TEN_MUC.DAY}</span>
        <span><i className="cham muc-CHUA" /> Chưa có số liệu / chưa đặt sức chứa</span>
        <span><i className="cham muc-CHUA" /> tròn: xe máy · <i className="cham cham-vuong muc-CHUA" /> vuông: ô tô</span>
      </div>
      {ds.loi && <ThongBao loai="loi">{ds.loi}</ThongBao>}

      <div className="so-do-khung">
        <BanDoBai khu={hienCham} duong={duong} khuDichId={duong?.denKhuId} khuChonId={chonId} hienViTri={!!duong}
                  loaiXeId={loc === 'O_TO' ? LOAI_O_TO : loc === 'XE_MAY' ? LOAI_XE_MAY : null}
                  onChamKhu={(k) => setChonId((c) => (c === k.id ? null : k.id))} />
        {chon
          ? <TheKhu khu={chon} cheDo={laAdmin ? 'admin' : 'xem'} dangHienDuong={duong?.denKhuId === chon.id}
                    onXemDuong={() => void xemDuong(chon.id)} onAnDuong={() => setDuong(null)} onDong={() => setChonId(null)} />
          : <p className="mo">{laAdmin ? 'Chạm vào chấm khu để xem số liệu.' : 'Chạm vào chấm khu (R, S, Hầm cho xe máy; A–Q cho ô tô) để xem chỗ trống và đường đi từ Cổng vào X.'}</p>}
        {loiDuong && <ThongBao loai="loi">{loiDuong}</ThongBao>}
        {duong && !chon && (
          <button className="nut nut-phu nut-nho" onClick={() => setDuong(null)}>Ẩn đường</button>
        )}
      </div>

      {ds.dangTai && !ds.duLieu && <DangTai />}
      {ds.duLieu && loc !== 'O_TO' && (
        <>
          <h2>Chi tiết khu xe máy</h2>
          <MucChoKhu khu={khuXeMay} chiTiet />
        </>
      )}
      {ds.duLieu && loc !== 'XE_MAY' && (
        <>
          <h2>Chi tiết khu ô tô</h2>
          <MucChoKhu khu={khuOTo} chiTiet loai="ô tô" />
        </>
      )}
    </>
  );
}

/** Ô tổng "X chỗ … còn trống" của một loại xe (chỉ cộng khu đã đặt sức chứa). */
function TongCho({ nhan, khu, daTai, bayGio }: { nhan: string; khu: KhuCho[]; daTai: boolean; bayGio?: string }) {
  const coSo = khu.filter((k) => k.sucChua > 0);
  const tongCon = coSo.reduce((s, k) => s + k.conLai, 0);
  const tongSucChua = coSo.reduce((s, k) => s + k.sucChua, 0);
  return (
    <div className="the tong-cho-xe-may" aria-live="polite">
      <span className="tong-cho-so">{daTai ? <SoChay gia={tongCon} dinhDang={(n) => n.toLocaleString('vi-VN')} /> : '–'}</span>
      <div>
        <div className="tong-cho-nhan">{nhan}</div>
        <div className="mo">
          {coSo.length > 0
            ? `trên ${tongSucChua.toLocaleString('vi-VN')} chỗ ở ${coSo.length} khu · cập nhật ${gio(bayGio)}`
            : daTai ? 'Chưa có khu nào được đặt sức chứa' : 'Đang tải…'}
        </div>
      </div>
    </div>
  );
}

function gio(iso?: string) {
  return iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
}
