// Hàm thuần của sơ đồ bãi, chép từ nha_de_xe/frontend/src/modules/tim-xe/components/BanDoBai.tsx và DemNguocGiuCho.tsx,
// ManHinhDanDuong.tsx (ThoiGianDaDo). Sửa ở web thì nhớ sửa ở đây. Có test (banDo.test.ts).
import { docNgay } from '@/shared/utils/ngayGio';
import { KICH_THUOC_ANH } from './soDoXeMay';

const { rong: W, cao: H } = KICH_THUOC_ANH;

/** Vị trí đặt mũi tên chỉ hướng dọc đường (cách nhau `buoc` đơn vị ảnh), kèm góc quay theo hướng đi. */
export function viTriMuiTen(diem: { x: number; y: number }[], buoc = 46) {
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

/** Toạ độ "x,y x,y …" của đường đi theo hệ toạ độ ảnh gốc (viewBox của SVG). */
export const chuoiToaDo = (diem: { x: number; y: number }[]) =>
  diem.map((d) => `${(d.x * W).toFixed(1)},${(d.y * H).toFixed(1)}`).join(' ');

/** Số giây giữ chỗ còn lại theo GIỜ SERVER (hetHanLuc − bayGio của cùng một lần tải), không âm. */
export function giayGiuChoCon(hetHanLuc: string, bayGio: string): number {
  const het = docNgay(hetHanLuc)?.getTime(), bay = docNgay(bayGio)?.getTime();
  if (het === undefined || bay === undefined) return 0;
  return Math.max(0, Math.round((het - bay) / 1000));
}

/** "4:05" hoặc "hết giờ giữ". */
export const dinhDangGiuCho = (giay: number) =>
  (giay > 0 ? `${Math.floor(giay / 60)}:${String(giay % 60).padStart(2, '0')}` : 'hết giờ giữ');

/** "vừa đỗ" / "25 phút" / "1 giờ 05 phút". Chỉ để hiển thị, KHÔNG tính tiền (dự án chỉ có gói tháng / năm). */
export function thoiGianDaDo(tu: string, bayGio = Date.now()): string {
  const moc = docNgay(tu)?.getTime();
  if (moc === undefined) return '';
  const phut = Math.max(0, Math.floor((bayGio - moc) / 60_000));
  return phut < 1 ? 'vừa đỗ' : phut < 60 ? `${phut} phút` : `${Math.floor(phut / 60)} giờ ${String(phut % 60).padStart(2, '0')} phút`;
}

// ---- Chép từ nha_de_xe/frontend/src/modules/tim-xe/hanhTrinh.ts, sửa ở web thì nhớ sửa ở đây. ----

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

/** Thời gian icon xe chạy hết đường (giây): khoảng 110 đơn vị ảnh mỗi giây, tối thiểu 2,5 giây. */
export const thoiGianChay = (h: HanhTrinh) => Math.max(2.5, h.tong / 110);
