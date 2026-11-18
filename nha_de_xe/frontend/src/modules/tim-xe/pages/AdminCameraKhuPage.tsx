import { useEffect, useState } from 'react';
import { DangTai, ThongBao } from '@/shared/ui/ui';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { useApp } from '@/app/AppContext';
import { hienThiBienSo } from '@/shared/utils/format';
import type { KetQuaCameraKhu } from '../models';

interface DongNhatKy { luc: Date; camera: string; kq: KetQuaCameraKhu }

/**
 * Camera lối vào khu (giả lập khi chưa có camera thật): chọn camera, gửi ảnh để AI đọc biển, hoặc gõ biển số.
 * Một lối vào dùng chung cho vào và ra: xe chưa ghi ở khu này là VÀO, đang ghi ở khu này là RA.
 * Cùng biển, cùng camera trong 30 giây thì bỏ qua (xe dừng trước camera).
 */
export function AdminCameraKhuPage() {
  const { services } = useApp();
  const ch = useTaiDuLieu(() => services.baiXe.layCauHinh(), []);
  const cong = useTaiDuLieu(() => services.congRaVao.layManHinhCong(), [], 10_000);
  const cameras = ch.duLieu?.camera.filter((c) => c.vaiTro === 'LOI_VAO_KHU') ?? [];
  const [cameraId, setCameraId] = useState(0);
  const [bienSo, setBienSo] = useState('');
  const [anh, setAnh] = useState<File | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [nhatKy, setNhatKy] = useState<DongNhatKy[]>([]);

  useEffect(() => { if (!cameraId && cameras.length) setCameraId(cameras[0].id); }, [cameraId, cameras]);
  const tenKhu = (khuId: number) => ch.duLieu?.khu.find((k) => k.id === khuId)?.ten ?? `Khu #${khuId}`;
  const camChon = cameras.find((c) => c.id === cameraId);

  async function gui() {
    if (!camChon) return;
    setLoi(null); setDangGui(true);
    try {
      const kq = anh ? await services.timXe.cameraKhuAnh(camChon.id, anh, bienSo) : await services.timXe.cameraKhuBienSo(camChon.id, bienSo);
      setNhatKy((n) => [{ luc: new Date(), camera: `${camChon.ten} (${tenKhu(camChon.khuId)})`, kq }, ...n].slice(0, 30));
      if (kq.ketQua === 'DA_GHI') { setBienSo(''); setAnh(null); }
      else if (kq.ungVien?.length) setBienSo(kq.ungVien[0]);
    } catch (e) { setLoi((e as Error).message); }
    finally { setDangGui(false); }
  }

  return (
    <>
      <div className="tieu-de-trang">
        <h1>Camera lối vào khu</h1>
        <span className="nhan nhan-cho">Xe máy · mức khu</span>
      </div>
      {ch.loi && <ThongBao loai="loi">{ch.loi}</ThongBao>}
      {ch.dangTai && !ch.duLieu && <DangTai />}
      {ch.duLieu && cameras.length === 0 && (
        <ThongBao loai="canh-bao">Chưa có camera nào vai trò "Lối vào khu". Thêm ở trang Quản lý bãi.</ThongBao>
      )}
      {cameras.length > 0 && (
        <section className="the">
          <div className="hang-form">
            <select value={cameraId} onChange={(e) => setCameraId(Number(e.target.value))} aria-label="Camera">
              {cameras.map((c) => <option key={c.id} value={c.id} disabled={!c.dangBat}>{c.ten} · {tenKhu(c.khuId)}{c.dangBat ? '' : ' (đang tắt)'}</option>)}
            </select>
          </div>
          <label className="mo chon-anh">Ảnh camera (JPEG/PNG, tối đa 5 MB). Để trống nếu chỉ gõ biển số.
            <input type="file" accept="image/jpeg,image/png" disabled={dangGui} onChange={(e) => setAnh(e.target.files?.[0] ?? null)} />
          </label>
          <div className="hang-form">
            <input value={bienSo} onChange={(e) => setBienSo(e.target.value)} placeholder="Biển số, VD: 29B1-123.45" />
            <button className="nut" onClick={() => void gui()} disabled={dangGui || (!anh && !bienSo.trim())}>Xe qua camera</button>
          </div>
          {cong.duLieu && (
            <div className="chip-xe">
              <span className="mo">Xe đang trong bãi:</span>
              {cong.duLieu.xe.filter((x) => x.trongBai).map((x) => (
                <button key={x.xeId} className="chip" onClick={() => setBienSo(x.bienSo)}>{hienThiBienSo(x.bienSo)}</button>
              ))}
            </div>
          )}
          {loi && <ThongBao loai="loi">{loi}</ThongBao>}
        </section>
      )}

      <h2>Kết quả gần đây</h2>
      {nhatKy.length === 0 ? <p className="mo">Chưa có xe nào qua camera trong phiên này.</p> : (
        <div className="bang-cuon">
          <table className="bang">
            <thead><tr><th>Lúc</th><th>Camera</th><th>Biển số</th><th>Hướng</th><th>Kết quả</th></tr></thead>
            <tbody>
              {nhatKy.map((d, i) => (
                <tr key={i}>
                  <td>{d.luc.toLocaleTimeString('vi-VN')}</td>
                  <td>{d.camera}</td>
                  <td className="bien-so nho">{d.kq.bienSo ? hienThiBienSo(d.kq.bienSo) : '—'}</td>
                  <td>{d.kq.huong === 'VAO' ? 'Vào khu' : d.kq.huong === 'RA' ? 'Ra khỏi khu' : '—'}</td>
                  <td className="o-ly-do-dai">
                    <span className={`nhan ${d.kq.ketQua === 'DA_GHI' ? 'nhan-ok' : d.kq.ketQua === 'BO_QUA' ? 'nhan-cho' : 'nhan-loi'}`}>
                      {d.kq.ketQua === 'DA_GHI' ? 'Đã ghi' : d.kq.ketQua === 'BO_QUA' ? 'Bỏ qua' : 'Đối soát'}
                    </span> {d.kq.thongDiep}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
