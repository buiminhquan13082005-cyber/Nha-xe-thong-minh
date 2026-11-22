import { useEffect, useRef } from 'react';
import { hienThiBienSo } from '@/shared/utils/format';
import type { DuongRaBanDo, KhuCho } from '../models';
import { BanDoBai } from './BanDoBai';

const gioPhut = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

/** Nội dung màn "Đường ra cổng": tự bật khi camera RA của khu thấy xe, hoặc người dùng bấm "Chỉ đường ra cổng" ở Tìm xe. */
export interface DuongRaDangXem {
  /** true: tự bật từ GET dieu-huong/cua-toi/ra (đóng khi xe đã qua cổng ra). false: người dùng tự mở. */
  tuDong: boolean;
  luotGuiId?: number;
  bienSo?: string;
  tenKhu: string;
  /** Lúc camera RA của khu thấy xe (chỉ khi tự bật). */
  raLuc?: string;
  duong: DuongRaBanDo | null;
  loi?: string;
}

/**
 * Màn hình chỉ đường RA: từ khu xe vừa rời tới Cổng ra Y. Không dùng GPS: "Bạn đang ở đây" là đầu khu.
 * Tới cổng, camera cổng đọc biển và app hỏi người dùng xác nhận xe ra như thường.
 */
export function ManHinhDuongRa({ ra, khu, onDong }: { ra: DuongRaDangXem; khu: KhuCho[] | undefined; onDong: () => void }) {
  const nutDong = useRef<HTMLButtonElement>(null);
  const dongRef = useRef(onDong);
  dongRef.current = onDong;
  useEffect(() => {
    nutDong.current?.focus();
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dongRef.current(); };
    window.addEventListener('keydown', phim);
    return () => window.removeEventListener('keydown', phim);
  }, []);

  const d = ra.duong;
  const dau = d?.diem[0];
  return (
    <div className="man-dan-duong-che" onClick={(e) => { if (e.target === e.currentTarget) onDong(); }}>
      <section className="man-dan-duong" role="dialog" aria-modal="true" aria-label="Đường ra cổng">
        <header className="mdd-dau">
          <div>
            <div className="nhan-nho">Đường ra cổng</div>
            {ra.bienSo && <div className="bien-so nho">{hienThiBienSo(ra.bienSo)}</div>}
          </div>
          <button ref={nutDong} type="button" className="nut nut-phu nut-nho" onClick={onDong}>{ra.tuDong ? 'Thu nhỏ' : 'Đóng'}</button>
        </header>
        <div className="mdd-than">
          <div className="mdd-huong-dan" aria-live="polite">
            <div className="mdd-cau">Đi tới <strong>Cổng ra Y</strong></div>
            <div className="mo">
              {d ? `Khoảng ${d.tongMet} m từ ${ra.tenKhu}` : `Từ ${ra.tenKhu}`}
              {ra.raLuc && ` · ra khỏi khu lúc ${gioPhut(ra.raLuc)}`}
            </div>
          </div>

          {ra.loi && <div className="thong-bao thong-bao-loi" role="alert">{ra.loi}</div>}
          {!d && !ra.loi && (
            <div className="thong-bao thong-bao-canh-bao" role="status">Sơ đồ chưa có đường ra từ {ra.tenKhu}. Đi theo biển chỉ dẫn tới Cổng ra Y.</div>
          )}

          <BanDoBai khu={khu} duong={d} hienViTri={!!dau} viTri={dau} nhanCuoi={d ? 'Cổng ra Y' : undefined} />

          {d && d.diem.length > 1 && (
            <ol className="mdd-cac-buoc">
              {d.diem.filter((x) => x.ten).map((x, i) => <li key={i}>{x.ten}</li>)}
            </ol>
          )}
          <p className="mo mdd-goi-y">Tới cổng, camera đọc biển số và app sẽ hỏi bạn xác nhận cho xe ra.</p>
        </div>
      </section>
    </div>
  );
}
