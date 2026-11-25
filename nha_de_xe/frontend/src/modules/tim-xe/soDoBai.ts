import type { KhuCho } from './models';

/**
 * Khu trên ảnh "Phương án bố trí bãi đỗ xe" (so-do-bai.png): 3 khu XE MÁY (R, S, Hầm) và 17 khu Ô TÔ (A–Q, mỗi dãy chữ là một khu).
 * Toạ độ x, y tính theo % chiều rộng / chiều cao ảnh, nên ảnh co giãn vẫn đúng chỗ. Muốn dời chấm thì sửa ở đây,
 * và sửa nút cùng mã trong backend/src/Modules/BaiXe/Application/BanDo/do-thi-ban-do.json để đường đi khớp chấm.
 * Hầm B1/B2 là MỘT khu: camera đặt ở lối xuống chung, không biết xe xuống tầng nào.
 * Ô tô định vị mức khu như xe máy (camera hướng vào / hướng ra của khu); chưa định vị tới từng ô.
 */
export type MaXeMay = 'R' | 'S' | 'HAM';
export type MaOTo = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q';
export type MaSoDo = MaXeMay | MaOTo;
export type LoaiTrenSoDo = 'XE_MAY' | 'O_TO';

export interface KhuTrenSoDo { ma: MaSoDo; loai: LoaiTrenSoDo; nhan: string; ten: string; x: number; y: number }

/** id loại xe trong bảng loai_xe (nha-xe.sql): 1 = ô tô, 2 = xe máy. */
export const LOAI_O_TO = 1;
export const LOAI_XE_MAY = 2;

export const KHU_XE_MAY_TREN_SO_DO: readonly KhuTrenSoDo[] = [
  { ma: 'R', loai: 'XE_MAY', nhan: 'R', ten: 'R – Xe máy', x: 47.6, y: 27.2 },
  { ma: 'S', loai: 'XE_MAY', nhan: 'S', ten: 'S – Xe máy', x: 85, y: 27.8 },
  { ma: 'HAM', loai: 'XE_MAY', nhan: 'Hầm', ten: 'Hầm để xe máy B1/B2', x: 66.9, y: 62 },
];

/** Giữa các vạch đỗ của từng dãy chữ trên ảnh (cùng toạ độ với nút KHU_A… trong do-thi-ban-do.json). */
const O_TO: readonly [MaOTo, number, number][] = [
  ['A', 8.8, 27.3],
  ['B', 15.8, 27.3],
  ['C', 10, 45.9],
  ['D', 15.8, 45.9],
  ['E', 18.3, 57],
  ['F', 29.3, 43.2],
  ['G', 50.7, 43.2],
  ['H', 65.6, 43.2],
  ['I', 74.8, 43.8],
  ['J', 30, 55.3],
  ['K', 45.4, 55.3],
  ['L', 26.4, 67.3],
  ['M', 37.1, 67.3],
  ['N', 46.3, 67.3],
  ['O', 72.5, 61],
  ['P', 64.1, 76.8],
  ['Q', 72.1, 76.8],
];

export const KHU_O_TO_TREN_SO_DO: readonly KhuTrenSoDo[] =
  O_TO.map(([ma, x, y]) => ({ ma, loai: 'O_TO' as const, nhan: ma, ten: `${ma} – Ô tô`, x, y }));

export const KHU_TREN_SO_DO: readonly KhuTrenSoDo[] = [...KHU_XE_MAY_TREN_SO_DO, ...KHU_O_TO_TREN_SO_DO];

const MA_XE_MAY: readonly string[] = KHU_XE_MAY_TREN_SO_DO.map((c) => c.ma);
const MA_O_TO: readonly string[] = KHU_O_TO_TREN_SO_DO.map((c) => c.ma);

/** Kích thước gốc của so-do-bai.png: lớp SVG vẽ đường dùng cùng tỉ lệ nên khớp ảnh ở mọi cỡ màn hình. */
export const KICH_THUOC_ANH = { rong: 683, cao: 342 } as const;

/** Cổng vào X (mũi tên vào bãi bên trái ảnh), tỉ lệ 0..1. "Bạn đang ở đây" khi vừa qua cổng. */
export const CONG_VAO_X = { x: 0.035, y: 0.41 } as const;

/** Loại của khu theo loaiXeId (1 ô tô, còn lại xe máy). */
export const loaiCuaKhu = (k: Pick<KhuCho, 'loaiXeId'>): LoaiTrenSoDo => (k.loaiXeId === LOAI_O_TO ? 'O_TO' : 'XE_MAY');

/**
 * Khu trong DB ứng với chấm nào trên ảnh. Ưu tiên cột ma_so_do (backend trả maSoDo); khi chưa có thì suy theo tên:
 * xe máy "Khu R" / "R" → R, "Khu S" → S, tên có chữ "hầm" → HAM; ô tô "Khu A" / "A" / "Khu C (ô tô)" → A, C…
 * Mã phải đúng loại xe của khu (khu xe máy mang mã A không lên chấm ô tô). Khu không có trên ảnh → null.
 */
export function maSoDoCua(k: KhuCho): MaSoDo | null {
  const oTo = loaiCuaKhu(k) === 'O_TO';
  const hopLe = oTo ? MA_O_TO : MA_XE_MAY;
  const ma = k.maSoDo?.trim().toUpperCase();
  if (ma) return hopLe.includes(ma) ? (ma as MaSoDo) : null;
  const ten = k.ten.trim();
  if (oTo) {
    const chu = /^(?:khu\s+)?([a-q])(?:\s*[-–]?\s*\(?\s*ô\s*tô\s*\)?)?$/i.exec(ten)?.[1].toUpperCase();
    return chu ? (chu as MaOTo) : null;
  }
  const chu = /^(?:khu\s+)?([rs])(?:\s*[-–]\s*xe\s*máy)?$/i.exec(ten)?.[1].toUpperCase();
  if (chu === 'R' || chu === 'S') return chu;
  return /hầm/i.test(ten) ? 'HAM' : null;
}

/** Chỉ mã xe máy (R, S, HAM); khu ô tô → null. Dùng cho dữ liệu giả của màn hình chỉ đường. */
export function maXeMayCua(k: KhuCho): MaXeMay | null {
  const ma = maSoDoCua(k);
  return ma && MA_XE_MAY.includes(ma) ? (ma as MaXeMay) : null;
}

/** Ghép danh sách khu từ API với các chấm trên ảnh (mỗi chấm lấy khu ĐANG DÙNG đầu tiên khớp; khu tạm tắt không lên ảnh). */
export function ghepKhuTrenSoDo(ds: KhuCho[] | undefined): Map<MaSoDo, KhuCho> {
  const m = new Map<MaSoDo, KhuCho>();
  ds?.forEach((k) => {
    if (k.dangDung === false) return;
    const ma = maSoDoCua(k);
    if (ma && !m.has(ma)) m.set(ma, k);
  });
  return m;
}

/** Các khu có trên bản đồ theo thứ tự chấm (xe máy R, S, Hầm rồi ô tô A–Q). loai: chỉ lấy một loại xe. */
export function khuTrenSoDo(ds: KhuCho[] | undefined, loai?: LoaiTrenSoDo): KhuCho[] {
  const m = ghepKhuTrenSoDo(ds);
  return KHU_TREN_SO_DO.filter((c) => !loai || c.loai === loai).map((c) => m.get(c.ma)).filter((k): k is KhuCho => !!k);
}

export const khuXeMayTrenSoDo = (ds: KhuCho[] | undefined) => khuTrenSoDo(ds, 'XE_MAY');
export const khuOToTrenSoDo = (ds: KhuCho[] | undefined) => khuTrenSoDo(ds, 'O_TO');
