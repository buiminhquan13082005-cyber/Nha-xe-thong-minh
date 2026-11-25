import type { ReactNode } from 'react';
import anhSoDo from '@/assets/so-do-bai.png';
import { SoChay } from '@/shared/ui/SoChay';
import { duongSvg, thoiGianChay, tinhHanhTrinh } from '../hanhTrinh';
import type { DuongDiBanDo, KhuCho } from '../models';
import { TEN_MUC } from '../models';
import { CONG_VAO_X, ghepKhuTrenSoDo, KHU_TREN_SO_DO, KICH_THUOC_ANH, LOAI_O_TO, LOAI_XE_MAY } from '../soDoBai';

const { rong: W, cao: H } = KICH_THUOC_ANH;

/** Vị trí đặt mũi tên chỉ hướng dọc đường (cách nhau `buoc` đơn vị ảnh), kèm góc quay theo hướng đi. */
function viTriMuiTen(diem: { x: number; y: number }[], buoc = 46) {
  const kq: { x: number; y: number; goc: number }[] = [];
  let du = buoc / 2;
  for (let i = 1; i < diem.length; i++) {
    const ax = diem[i - 1].x * W, ay = diem[i - 1].y * H, bx = diem[i].x * W, by = diem[i].y * H;
    const dai = Math.hypot(bx - ax, by - ay);
    const goc = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    for (let t = du; t < dai; t += buoc) kq.push({ x: ax + ((bx - ax) * t) / dai, y: ay + ((by - ay) * t) / dai, goc });
    du = (du - dai) % buoc;
    if (du < 0) du += buoc;
  }
  return kq;
}

/**
 * Ảnh "Phương án bố trí bãi đỗ xe" + chấm khu xe máy (R, S, Hầm; chấm tròn) và khu ô tô (A–Q; chấm vuông)
 * + đường đi vẽ bằng SVG đè lên ảnh. SVG dùng viewBox đúng kích thước gốc của ảnh nên co giãn cùng ảnh, nét vẽ không méo.
 * onChamKhu có thì chấm là nút bấm được (người dùng); không có thì chỉ xem (Admin).
 * loaiXeId có (1 ô tô, 2 xe máy): chỉ hiện chấm khu của loại xe đó, icon chạy trên đường là ô tô hay xe máy.
 */
export function BanDoBai({ khu, duong, khuDichId, khuChonId, hienViTri = false, viTri = CONG_VAO_X, nhanCuoi, onChamKhu, loaiXeId, children }: {
  khu: KhuCho[] | undefined;
  /** Đường vẽ trên sơ đồ (đường vào khu hoặc đường ra cổng): chỉ cần các điểm. */
  duong?: Pick<DuongDiBanDo, 'diem'> | null;
  khuDichId?: number | null;
  khuChonId?: number | null;
  /** Ghim "Bạn đang ở đây" tại Cổng vào X (vừa qua cổng, chưa có GPS). */
  hienViTri?: boolean;
  /** Chỗ đặt ghim "Bạn đang ở đây" (tỉ lệ 0..1). Mặc định Cổng vào X; đường ra: đầu khu xe vừa rời. */
  viTri?: { x: number; y: number };
  /** Nhãn ghim ở điểm cuối đường (ví dụ "Cổng ra Y"), khi điểm đến không phải một khu. */
  nhanCuoi?: string;
  onChamKhu?: (k: KhuCho) => void;
  /** Chỉ hiện chấm của một loại xe (xe đang được dẫn đường / xe trong thẻ Tìm xe). Không có: hiện cả hai loại. */
  loaiXeId?: number | null;
  children?: ReactNode;
}) {
  const theoMa = ghepKhuTrenSoDo(khu);
  const chiLoai = loaiXeId == null ? null : loaiXeId === LOAI_O_TO ? 'O_TO' : 'XE_MAY';
  const cham = KHU_TREN_SO_DO.filter((c) => !chiLoai || c.loai === chiLoai);
  // Icon chạy trên đường: theo loại xe được truyền, không có thì theo loại của khu đích
  const xeOTo = (loaiXeId ?? khu?.find((k) => k.id === khuDichId)?.loaiXeId ?? LOAI_XE_MAY) === LOAI_O_TO;
  const diem = duong?.diem ?? [];
  const toaDo = diem.map((d) => `${(d.x * W).toFixed(1)},${(d.y * H).toFixed(1)}`).join(' ');
  const hanhTrinh = tinhHanhTrinh(diem);
  const cuoi = diem.length > 1 ? diem[diem.length - 1] : null;

  return (
    <div className="ban-do-bai">
      <img src={anhSoDo} alt="Sơ đồ bố trí bãi đỗ xe" draggable={false} />
      {/* key theo toạ độ: đổi khu đích thì tạo lại SVG, đồng hồ của animateMotion chạy lại từ 0 (xe xuất phát từ cổng) */}
      <svg key={toaDo} className="ban-do-lop" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {diem.length > 1 && (
          // key theo toạ độ: đổi khu đích thì vẽ lại từ đầu (đường "mọc" dần từ Cổng vào X)
          <g key={toaDo}>
            <polyline points={toaDo} className="duong-vien" pathLength={1} />
            <g className="duong-hien-sau">
              <polyline points={toaDo} className="duong-net" />
              {viTriMuiTen(diem).map((m, i) => (
                <path key={i} d="M -3.5 -4 L 3 0 L -3.5 4" className="mui-ten-duong" transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) rotate(${m.goc.toFixed(0)})`} />
              ))}
            </g>
            {hanhTrinh && (
              // Icon xe (xe máy hoặc ô tô) chạy dọc đường từ cổng tới khu, dừng ở đích một nhịp rồi chạy lại
              <g className="xe-chay">
                <animateMotion dur={`${thoiGianChay(hanhTrinh).toFixed(2)}s`} repeatCount="indefinite" path={duongSvg(hanhTrinh)}
                  keyPoints="0;1;1" keyTimes="0;0.82;1" calcMode="linear" begin="0.9s" fill="freeze" />
                <circle r="8.5" className="xe-chay-nen" />
                {xeOTo ? (
                  <>
                    <path d="M -5 1.8 L -5 -0.6 L -3.2 -1.2 L -1.8 -3.6 L 2 -3.6 L 3.4 -1.2 L 5 -0.6 L 5 1.8 Z" className="xe-chay-net" />
                    <circle cx="-2.8" cy="2.4" r="1.4" className="xe-chay-net" />
                    <circle cx="2.8" cy="2.4" r="1.4" className="xe-chay-net" />
                  </>
                ) : (
                  <>
                    <circle cx="-3.4" cy="2.2" r="2" className="xe-chay-net" />
                    <circle cx="3.4" cy="2.2" r="2" className="xe-chay-net" />
                    <path d="M -3.4 2.2 L -1 -1.2 L 2.2 -1.2 L 3.4 2.2 M 2.2 -1.2 L 1.4 -3.6 L 3.2 -3.6" className="xe-chay-net" />
                  </>
                )}
              </g>
            )}
          </g>
        )}
        {hienViTri && (
          <g transform={`translate(${viTri.x * W} ${viTri.y * H})`}>
            <circle r="9" className="vi-tri-song" />
            <circle r="5" className="vi-tri-cham" />
          </g>
        )}
      </svg>

      {hienViTri && (
        <div className="nhan-ghim nhan-o-day" style={{ left: `${viTri.x * 100}%`, top: `${viTri.y * 100}%` }}>Bạn đang ở đây</div>
      )}
      {nhanCuoi && cuoi && (
        <>
          <div className="diem-cuoi-duong" style={{ left: `${cuoi.x * 100}%`, top: `${cuoi.y * 100}%` }} aria-hidden="true" />
          <div className="nhan-ghim nhan-dich" style={{ left: `${cuoi.x * 100}%`, top: `${cuoi.y * 100}%` }}>{nhanCuoi}</div>
        </>
      )}

      {cham.map((c) => {
        const k = theoMa.get(c.ma);
        // Khu chưa đặt sức chứa (khu ô tô mới thêm ở V017): xám, như chưa có số liệu
        const coSo = !!k && k.sucChua > 0;
        const moTa = !k ? `${c.ten}: chưa có số liệu`
          : !coSo ? `${c.ten}: chưa đặt sức chứa`
          : `${c.ten}: còn ${k.conLai}/${k.sucChua} chỗ (${TEN_MUC[k.muc]})`;
        const laDich = !!k && k.id === khuDichId;
        const lop = `diem-khu ${c.loai === 'O_TO' ? 'diem-o-to' : 'diem-xe-may'} muc-${coSo ? k.muc : 'CHUA'} ${laDich ? 'diem-dich' : ''} ${k && k.id === khuChonId ? 'diem-chon' : ''}`;
        const noiDung = <><b>{c.nhan}</b>{coSo && <SoChay gia={k.conLai} />}</>;
        const viTri = { left: `${c.x}%`, top: `${c.y}%` };
        return (
          <div key={`${c.loai}-${c.ma}`}>
            {laDich && <div className="nhan-ghim nhan-dich" style={viTri}>Điểm đến</div>}
            {onChamKhu && k
              ? <button type="button" className={`${lop} cham-duoc`} style={viTri} title={moTa} aria-label={`${moTa}. Chạm để xem`}
                        aria-pressed={k.id === khuChonId} onClick={() => onChamKhu(k)}>{noiDung}</button>
              : <div className={lop} style={viTri} title={moTa} role="img" aria-label={moTa}>{noiDung}</div>}
          </div>
        );
      })}
      {children}
    </div>
  );
}
