import { useState } from 'react';
import { DangTai, ThongBao } from '@/shared/ui/ui';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import { useApp } from '@/app/AppContext';
import { dinhDangNgay, hienThiBienSo } from '@/shared/utils/format';
import type { KhuCho } from '../models';
import { MucChoKhu } from '../components/MucChoKhu';

/**
 * Đối soát khu xe máy (Admin): mức chỗ từng khu, xe quá 15 phút chưa có khu, xe đang ghi trong khu.
 * Admin gán / gỡ từng xe một (không có thao tác hàng loạt), mỗi lần đều ghi lịch sử vị trí với nguồn ADMIN.
 */
export function AdminDoiSoatPage() {
  const { services } = useApp();
  const ds = useTaiDuLieu(() => services.timXe.layDoiSoat(), [], 10_000);
  useNgheThongBao(() => void ds.taiLai());
  const [loi, setLoi] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState<number | null>(null);

  async function gan(luotGuiId: number, khuId: number | null, bienSo: string, khu: KhuCho[]) {
    setLoi(null); setOk(null); setDangGui(luotGuiId);
    try {
      await services.timXe.ganKhu(luotGuiId, khuId);
      setOk(khuId ? `Đã gán ${hienThiBienSo(bienSo)} vào ${khu.find((k) => k.id === khuId)?.ten}.` : `Đã gỡ ${hienThiBienSo(bienSo)} khỏi khu.`);
      await ds.taiLai();
    } catch (e) { setLoi((e as Error).message); }
    finally { setDangGui(null); }
  }

  const d = ds.duLieu;
  const tenKhu = (id: number) => d?.khu.find((k) => k.id === id)?.ten ?? `Khu #${id}`;
  return (
    <>
      <div className="tieu-de-trang">
        <h1>Đối soát khu xe máy</h1>
        <button className="nut nut-phu nut-nho" onClick={() => ds.taiLai()} disabled={ds.dangTai}>Tải lại</button>
      </div>
      {ds.loi && <ThongBao loai="loi">{ds.loi}</ThongBao>}
      {ds.dangTai && !d && <DangTai />}
      {ok && <ThongBao loai="ok">{ok}</ThongBao>}
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
      {d && (
        <>
          <MucChoKhu khu={d.khu} chiTiet />

          <h2>Chưa định vị quá 15 phút ({d.chuaDinhVi.length})</h2>
          {d.chuaDinhVi.length === 0 ? <p className="mo">Không có xe nào.</p> : (
            <div className="bang-cuon">
              <table className="bang">
                <thead><tr><th>Biển số</th><th>Vào bãi</th><th>Đã</th><th>Được mời vào</th><th>Gán khu</th></tr></thead>
                <tbody>
                  {d.chuaDinhVi.map((x) => (
                    <tr key={x.luotGuiId}>
                      <td className="bien-so nho">{hienThiBienSo(x.bienSo)}</td>
                      <td>{dinhDangNgay(x.thoiGianVao)}</td>
                      <td>{x.soPhut} phút</td>
                      <td>{x.moiVaoKhu ?? '—'}</td>
                      <td><ChonKhu khu={d.khu} dangGui={dangGui === x.luotGuiId} nhan="Gán" khiChon={(k) => gan(x.luotGuiId, k, x.bienSo, d.khu)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2>Xe đang ghi trong khu ({d.trongKhu.length})</h2>
          {d.trongKhu.length === 0 ? <p className="mo">Chưa có xe nào được ghi khu.</p> : (
            <div className="bang-cuon">
              <table className="bang">
                <thead><tr><th>Biển số</th><th>Khu</th><th>Từ lúc</th><th>Chuyển khu</th><th></th></tr></thead>
                <tbody>
                  {d.trongKhu.map((x) => (
                    <tr key={x.luotGuiId}>
                      <td className="bien-so nho">{hienThiBienSo(x.bienSo)}</td>
                      <td>{tenKhu(x.khuId)}</td>
                      <td>{dinhDangNgay(x.luc)}</td>
                      <td><ChonKhu khu={d.khu.filter((k) => k.id !== x.khuId)} dangGui={dangGui === x.luotGuiId} nhan="Chuyển" khiChon={(k) => gan(x.luotGuiId, k, x.bienSo, d.khu)} /></td>
                      <td><button className="nut nut-phu nut-nho" disabled={dangGui === x.luotGuiId}
                                  onClick={() => { if (confirm(`Gỡ ${hienThiBienSo(x.bienSo)} khỏi ${tenKhu(x.khuId)}?`)) void gan(x.luotGuiId, null, x.bienSo, d.khu); }}>Gỡ khỏi khu</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ChonKhu({ khu, dangGui, nhan, khiChon }: { khu: KhuCho[]; dangGui: boolean; nhan: string; khiChon: (khuId: number) => void }) {
  const [chon, setChon] = useState(khu[0]?.id ?? 0);
  if (khu.length === 0) return <span className="mo">—</span>;
  return (
    <span className="o-ly-do">
      <select value={chon} onChange={(e) => setChon(Number(e.target.value))} aria-label="Chọn khu">
        {khu.map((k) => <option key={k.id} value={k.id}>{k.ten} (còn {k.conLai})</option>)}
      </select>
      <button className="nut nut-nho" disabled={dangGui || !chon} onClick={() => khiChon(chon)}>{nhan}</button>
    </span>
  );
}
