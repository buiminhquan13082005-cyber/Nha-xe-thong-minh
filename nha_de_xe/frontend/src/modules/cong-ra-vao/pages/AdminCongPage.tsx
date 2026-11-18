import { useEffect, useRef, useState } from 'react';
import { DangTai, ThongBao } from '@/shared/ui/ui';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import { useApp } from '@/app/AppContext';
import { dinhDangNgay, hienThiBienSo } from '@/shared/utils/format';
import type { ChiDan } from '@/modules/tim-xe/models';
import type { KetQuaCong, LuotCanXuLy, YeuCauXacNhan } from '../models';
import { TEN_TRANG_THAI_LUOT } from '../models';
import { DemNguoc } from '../components/DemNguoc';

const TEN_LOAI_BIEN: Record<string, string> = { XE_MAY: 'biển xe máy', O_TO: 'biển ô tô', KHONG_RO: 'chưa rõ loại biển' };

/**
 * Màn hình cổng (Admin), theo luồng v10:
 * - Xe vào: AI đọc biển (ngưỡng 0,85; lệch ≤ 1 ký tự với đúng một xe thì khớp gần đúng), đúng loại xe, có gói thì mở.
 *   Xe máy được mời vào khu gần cổng nhất còn chỗ, giữ suất 5 phút. AI lỗi / quá 3 giây: chuyển nhập tay.
 * - Xe ra: gửi xác nhận 60 giây tới mọi người được dùng xe, ai trả lời trước thì tính. Còn phí quá hạn thì chờ thanh toán.
 *   Hết 60 giây, "Không phải tôi", app lỗi: Admin kiểm tra rồi mở tay, bắt buộc lý do (UC-A10).
 * Tải lại khi có thông báo và mỗi 2 giây.
 */
export function AdminCongPage() {
  const { services } = useApp();
  const mh = useTaiDuLieu(() => services.congRaVao.layManHinhCong(), [], 2_000);
  useNgheThongBao(() => void mh.taiLai());
  const [bienSo, setBienSo] = useState('');
  const [ketQua, setKetQua] = useState<KetQuaCong | null>(null);
  const [chiDan, setChiDan] = useState<ChiDan | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [anh, setAnh] = useState<File | null>(null);
  const [xemAnh, setXemAnh] = useState('');
  const oBienSo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!anh) { setXemAnh(''); return; }
    const url = URL.createObjectURL(anh); setXemAnh(url);
    return () => URL.revokeObjectURL(url);
  }, [anh]);

  async function quet(loai: 'vao' | 'ra') {
    setLoi(null); setKetQua(null); setChiDan(null); setDangGui(true);
    const cong = services.congRaVao;
    try {
      const kq = anh
        ? (loai === 'vao' ? await cong.xeVaoBangAnh(anh, bienSo) : await cong.xeRaBangAnh(anh, bienSo))
        : (loai === 'vao' ? await cong.xeVao(bienSo) : await cong.xeRa(bienSo));
      setKetQua(kq);
      if (kq.cheDoThuCong) oBienSo.current?.focus();
      if (kq.loai === 'VAO' && kq.choQua && kq.luotGuiId) {
        setChiDan(await services.timXe.layChiDan(kq.luotGuiId).catch(() => null));
      }
      if (kq.choQua || kq.dangChoXacNhan) { setBienSo(''); setAnh(null); }
      await mh.taiLai();
    } catch (e) { setLoi((e as Error).message); }
    finally { setDangGui(false); }
  }

  const canXuLy = mh.duLieu?.canXuLy ?? [];
  return (
    <>
      <div className="tieu-de-trang">
        <h1>Cổng ra vào</h1>
        <span className="nhan nhan-cho">Ảnh camera → AI đọc biển, hoặc gõ tay</span>
      </div>

      <section className="the">
        <h3>Xe tới cổng</h3>
        <label className="mo chon-anh">Ảnh camera (JPEG/PNG, tối đa 5 MB). Để trống nếu chỉ gõ biển số.
          <input type="file" accept="image/jpeg,image/png" disabled={dangGui}
                 onChange={(e) => { setAnh(e.target.files?.[0] ?? null); setKetQua(null); setLoi(null); }} />
        </label>
        {xemAnh && <img className="anh-bien-so" src={xemAnh} alt="Ảnh camera ở cổng" />}
        <div className="hang-form">
          <input ref={oBienSo} value={bienSo} onChange={(e) => setBienSo(e.target.value)} placeholder="Biển số, VD: 29B1-123.45" list="ds-bien-so" />
          <datalist id="ds-bien-so">
            {mh.duLieu?.xe.map((x) => <option key={x.xeId} value={x.bienSo}>{x.trongBai ? 'đang trong bãi' : 'ngoài bãi'}</option>)}
          </datalist>
          <button className="nut" onClick={() => quet('vao')} disabled={dangGui || (!anh && !bienSo.trim())}>Xe vào</button>
          <button className="nut nut-phu" onClick={() => quet('ra')} disabled={dangGui || (!anh && !bienSo.trim())}>Xe ra</button>
        </div>
        {mh.duLieu && (
          <div className="chip-xe">
            {mh.duLieu.xe.map((x) => (
              <button key={x.xeId} className={`chip ${x.trongBai ? 'chip-trong-bai' : ''}`} onClick={() => setBienSo(x.bienSo)}
                      title={x.trongBai ? 'Đang trong bãi' : 'Ngoài bãi'}>
                {hienThiBienSo(x.bienSo)}
              </button>
            ))}
          </div>
        )}
        {ketQua && <KetQuaQuet kq={ketQua} />}
        {chiDan && (
          <div className="chi-dan">
            <div className="nhan-nho">Màn hình cổng hiện</div>
            <div className="chi-dan-chu">Mời vào {chiDan.khu}</div>
            <div className="mo">Giữ chỗ tới {new Date(chiDan.hetHanLuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        )}
        {ketQua?.ungVien && ketQua.ungVien.length > 0 && (
          <div className="chip-xe">
            <span className="mo">Biển gần giống (bấm để chọn rồi gửi lại):</span>
            {ketQua.ungVien.map((b) => <button key={b} className="chip" onClick={() => setBienSo(b)}>{hienThiBienSo(b)}</button>)}
          </div>
        )}
        {loi && <ThongBao loai="loi">{loi}</ThongBao>}
      </section>

      {mh.loi && <ThongBao loai="loi">{mh.loi}</ThongBao>}
      {mh.dangTai && !mh.duLieu && <DangTai />}

      {canXuLy.length > 0 && (
        <>
          <h2>Cần Admin xử lý ({canXuLy.length})</h2>
          <div className="luoi-xe">{canXuLy.map((l) => <TheCanXuLy key={l.luotGuiId} l={l} khiXong={() => mh.taiLai()} />)}</div>
        </>
      )}

      <h2>Đang chờ xác nhận ra ({mh.duLieu?.dangCho.length ?? 0})</h2>
      {mh.duLieu && mh.duLieu.dangCho.length === 0 && <p className="mo">Không có xe nào đang chờ ở cổng ra.</p>}
      <div className="luoi-xe">
        {mh.duLieu?.dangCho.map((y) => <TheYeuCau key={y.id} y={y} khiXong={() => mh.taiLai()} />)}
      </div>

      <h2>Nhật ký cổng gần đây</h2>
      {mh.duLieu && (
        <div className="bang-cuon">
          <table className="bang">
            <thead><tr><th>Lúc</th><th>Cổng</th><th>Biển số</th><th>AI</th><th>Kết quả</th><th>Lý do</th></tr></thead>
            <tbody>
              {mh.duLieu.ganDay.map((s) => (
                <tr key={s.id}>
                  <td>{dinhDangNgay(s.thoiGian)}</td>
                  <td>{s.loai === 'VAO' ? 'Vào' : 'Ra'}</td>
                  <td className="bien-so nho">{s.bienSo ? hienThiBienSo(s.bienSo) : '—'}</td>
                  <td>{s.doTinCay == null ? '—' : s.doTinCay >= 1 ? 'gõ tay' : `${Math.round(s.doTinCay * 100)}%`}</td>
                  <td><span className={`nhan ${s.ketQua === 'CHO_QUA' ? 'nhan-ok' : 'nhan-loi'}`}>{s.ketQua === 'CHO_QUA' ? 'Cho qua' : 'Từ chối'}</span></td>
                  <td className="o-ly-do-dai">{s.lyDo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** Thêm dấu chấm cuối câu nếu thông điệp từ server chưa có. */
const cau = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

function KetQuaQuet({ kq }: { kq: KetQuaCong }) {
  const bs = (kq.bienSo ? hienThiBienSo(kq.bienSo) : 'Không rõ biển')
    + (kq.doTinCay != null && kq.doTinCay < 1 ? ` (AI ${(kq.doTinCay * 100).toFixed(0)}%)` : '');
  const phu = [kq.loaiBien && kq.loaiBien !== 'KHONG_RO' ? TEN_LOAI_BIEN[kq.loaiBien] : null,
               kq.khopGanDung ? 'khớp gần đúng (lệch 1 ký tự)' : null].filter(Boolean).join(' · ');
  if (kq.cheDoThuCong) return <ThongBao loai="canh-bao">⌨️ {cau(kq.thongDiep)} Nhập biển số rồi bấm lại.</ThongBao>;
  if (kq.choQua) return <ThongBao loai="ok">🟢 {bs}: {cau(kq.thongDiep)} Barrier mở.{phu && <><br /><span className="mo">{phu}</span></>}</ThongBao>;
  if (kq.choThanhToan) return <ThongBao loai="canh-bao">🟡 {bs}: {cau(kq.thongDiep)} Barrier chưa mở.</ThongBao>;
  if (kq.dangChoXacNhan) return <ThongBao loai="canh-bao">🟡 {bs}: {cau(kq.thongDiep)} Barrier chưa mở.</ThongBao>;
  return <ThongBao loai="loi">🔴 {bs}: {cau(kq.thongDiep)} Barrier không mở.{phu && <><br /><span className="mo">{phu}</span></>}</ThongBao>;
}

/** Ô nhập lý do + nút mở barrier thủ công (UC-A10). */
function MoTay({ luotGuiId, khiXong, nhan = 'Mở barrier thủ công' }: { luotGuiId: number; khiXong: () => void; nhan?: string }) {
  const { services } = useApp();
  const [mo, setMo] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  async function gui() {
    setLoi(null); setDangGui(true);
    try { await services.congRaVao.moTay(luotGuiId, lyDo.trim()); setMo(false); setLyDo(''); khiXong(); }
    catch (e) { setLoi((e as Error).message); }
    finally { setDangGui(false); }
  }
  return (
    <>
      {mo ? (
        <div className="hang-nut">
          <input value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Lý do (bắt buộc), VD: đã kiểm tra giấy tờ" autoFocus />
          <button className="nut" onClick={() => void gui()} disabled={dangGui || !lyDo.trim()}>Mở</button>
          <button className="nut nut-phu" onClick={() => setMo(false)}>Thôi</button>
        </div>
      ) : (
        <div className="hang-nut"><button className="nut nut-phu" onClick={() => setMo(true)}>{nhan}</button></div>
      )}
      {loi && <ThongBao loai="loi">{loi}</ThongBao>}
    </>
  );
}

/** Một xe đang chờ ở cổng ra: đếm ngược 60 giây, ai đã trả lời. Admin chỉ mở tay khi cần (app lỗi, khách nhờ). */
function TheYeuCau({ y, khiXong }: { y: YeuCauXacNhan; khiXong: () => void }) {
  return (
    <div className="the yeu-cau">
      <div className="xe-dau">
        <div>
          <div className="bien-so">{hienThiBienSo(y.bienSo)}</div>
          <div className="mo">Chủ xe: {y.tenChuXe}</div>
        </div>
        <DemNguoc soGiay={y.soGiayConLai} />
      </div>
      <p className="mo">
        {y.nguoiDungXeDongY === null ? 'Đã gửi xác nhận tới mọi người được dùng xe, chờ người trả lời đầu tiên.'
          : `${y.nguoiDungXeTraLoi ?? 'Người dùng xe'} đã ${y.nguoiDungXeDongY ? 'xác nhận' : 'báo không phải mình'}.`}
      </p>
      <MoTay luotGuiId={y.luotGuiId} khiXong={khiXong} />
    </div>
  );
}

function TheCanXuLy({ l, khiXong }: { l: LuotCanXuLy; khiXong: () => void }) {
  return (
    <div className={`the yeu-cau ${l.trangThai === 'NGHI_MAT' ? 'yeu-cau-nguy' : ''}`}>
      <div className="xe-dau">
        <div>
          <div className="bien-so">{hienThiBienSo(l.bienSo)}</div>
          <div className="mo">Vào bãi {dinhDangNgay(l.thoiGianVao)}</div>
        </div>
        <span className={`nhan ${l.trangThai === 'NGHI_MAT' ? 'nhan-loi' : 'nhan-cho'}`}>{TEN_TRANG_THAI_LUOT[l.trangThai] ?? l.trangThai}</span>
      </div>
      <p>{l.lyDo}</p>
      <MoTay luotGuiId={l.luotGuiId} khiXong={khiXong} nhan={l.trangThai === 'NGHI_MAT' ? 'Đã kiểm tra, mở barrier' : 'Mở barrier thủ công'} />
    </div>
  );
}
