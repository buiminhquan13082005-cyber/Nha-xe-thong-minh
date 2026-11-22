import { useEffect, useRef, useState } from 'react';

const giamChuyenDong = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Số tự "đếm" từ giá trị cũ sang giá trị mới (khoảng 0,6 giây) khi số liệu đổi, và nảy nhẹ một nhịp.
 * Lần hiện đầu tiên không chạy. Người dùng bật "giảm chuyển động" thì đổi ngay.
 */
export function SoChay({ gia, dinhDang = (n) => String(n), className }: {
  gia: number;
  dinhDang?: (n: number) => string;
  className?: string;
}) {
  const [hien, setHien] = useState(gia);
  const [lanDoi, setLanDoi] = useState(0);
  const tu = useRef(gia);
  /** Số đang hiện trên màn (đổi giữa chừng thì chạy tiếp từ đây, không nhảy). */
  const dangHien = useRef(gia);

  useEffect(() => {
    if (tu.current === gia) return;
    tu.current = gia;
    const batDau = dangHien.current;
    setLanDoi((n) => n + 1);
    if (giamChuyenDong()) { dangHien.current = gia; setHien(gia); return; }
    const t0 = performance.now();
    let id = 0;
    const buoc = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      const muot = 1 - (1 - p) ** 3;
      dangHien.current = Math.round(batDau + (gia - batDau) * muot);
      setHien(dangHien.current);
      if (p < 1) id = requestAnimationFrame(buoc);
    };
    id = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(id);
  }, [gia]);

  // key đổi mỗi lần số đổi → chạy lại hiệu ứng nảy (CSS .so-nay)
  return <span key={lanDoi} className={`${className ?? ''} ${lanDoi ? 'so-nay' : ''}`.trim()}>{dinhDang(hien)}</span>;
}
