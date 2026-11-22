import type { LuotGui, TrangThaiLuot } from '@/modules/cong-ra-vao/models';
import type { XeTimXe } from '@/modules/tim-xe/models';
import { docNgay } from '@/shared/utils/ngayGio';

export interface XeTrongBaiTrangChu {
  xeId: number;
  bienSo: string;
  thoiGianVao: string | null;
  khu: string | null;
  /** Trạng thái lượt gửi đang mở nếu KHÁC "Đang gửi" (chờ xác nhận ra, chờ thanh toán, nghi mất xe); null: bình thường. */
  trangThaiLuot: TrangThaiLuot | null;
}

const moc = (s: string | null) => docNgay(s)?.getTime() ?? 0;

/**
 * Thẻ "Xe đang trong bãi" của Trang chủ: lấy các xe trongBai từ GET /api/tim-xe (biển số, giờ vào, khu),
 * gắn trạng thái lượt gửi đang mở (chưa có giờ ra) của cùng xe từ GET /api/ra-vao. lichSu null (API lỗi): bỏ qua nhãn.
 * Xe vào bãi gần nhất lên đầu. Hàm thuần, có test.
 */
export function ghepXeTrongBai(xe: XeTimXe[], lichSu: LuotGui[] | null): XeTrongBaiTrangChu[] {
  return xe
    .filter((x) => x.trongBai)
    .map((x) => {
      const luot = (lichSu ?? [])
        .filter((l) => l.xeId === x.xeId && l.thoiGianRa === null && l.trangThai !== 'DA_RA')
        .sort((a, b) => moc(b.thoiGianVao) - moc(a.thoiGianVao))[0];
      return {
        xeId: x.xeId,
        bienSo: x.bienSo,
        thoiGianVao: x.thoiGianVao ?? luot?.thoiGianVao ?? null,
        khu: x.khu,
        trangThaiLuot: luot && luot.trangThai !== 'DANG_GUI' ? luot.trangThai : null,
      };
    })
    .sort((a, b) => moc(b.thoiGianVao) - moc(a.thoiGianVao));
}
