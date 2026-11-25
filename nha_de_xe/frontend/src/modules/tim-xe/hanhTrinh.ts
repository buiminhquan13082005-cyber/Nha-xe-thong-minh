import { KICH_THUOC_ANH } from './soDoBai';

const { rong: W, cao: H } = KICH_THUOC_ANH;

/** Hành trình dọc đường đi, theo toạ độ ảnh gốc (đơn vị của viewBox). */
export interface HanhTrinh {
  /** Tổng chiều dài đường (đơn vị ảnh). */
  tong: number;
  /** Các điểm (bỏ điểm trùng nhau) và vị trí của từng điểm trên đường, từ 0 (Cổng vào) đến 1 (khu đích), tăng dần. */
  diem: { x: number; y: number; moc: number }[];
}

/**
 * Tính hành trình từ danh sách điểm (x, y từ 0 đến 1). Dùng cho icon xe chạy dọc đường và hiệu ứng vẽ dần đường đi.
 * Ít hơn 2 điểm khác nhau thì trả null (không có gì để chạy).
 */
export function tinhHanhTrinh(diem: { x: number; y: number }[]): HanhTrinh | null {
  const pts: { x: number; y: number }[] = [];
  for (const d of diem) {
    const p = { x: d.x * W, y: d.y * H };
    const truoc = pts[pts.length - 1];
    if (!truoc || Math.hypot(p.x - truoc.x, p.y - truoc.y) > 0.01) pts.push(p);
  }
  if (pts.length < 2) return null;
  const doanDai = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const tong = doanDai.reduce((a, b) => a + b, 0);
  let daDi = 0;
  return {
    tong,
    diem: pts.map((p, i) => {
      if (i > 0) daDi += doanDai[i - 1];
      return { ...p, moc: i === pts.length - 1 ? 1 : daDi / tong };
    }),
  };
}

/** Đường SVG "M x y L x y …" của hành trình (cho animateMotion). */
export const duongSvg = (h: HanhTrinh) =>
  h.diem.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** Thời gian icon xe chạy hết đường (giây): khoảng 110 đơn vị ảnh mỗi giây, tối thiểu 2,5 giây. */
export const thoiGianChay = (h: HanhTrinh) => Math.max(2.5, h.tong / 110);
