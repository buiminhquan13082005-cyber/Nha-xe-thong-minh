import { conLai } from '@/shared/utils/format';
import { docNgay } from '@/shared/utils/ngayGio';
import type { XeDuocDung } from './models';

/** Gói sắp hết hạn: còn tối đa 72 giờ (cùng ngưỡng backend dùng để nhắc gia hạn và lọc SAP_HET ở trang Admin). */
export const NGUONG_SAP_HET_MS = 72 * 3_600_000;

export type MucGoi = 'CON_HAN' | 'SAP_HET' | 'HET_HAN' | 'CHUA_CO';

export interface TrangThaiGoi {
  muc: MucGoi;
  /** Tên gói để hiện ("Gói 30 ngày"), hoặc câu thay thế giống thẻ xe của web. */
  tenGoi: string;
  /** "Còn 12 ngày 3 giờ", "Quá hạn 2 ngày", "Chưa mua gói". */
  thoiGian: string;
}

/**
 * Trạng thái gói của một xe để hiện ở Trang chủ. bayGio: thời điểm máy chủ (bayGio của API) để đồng hồ điện thoại
 * lệch cũng không đổi kết quả. Hàm thuần, có test (trangThaiGoi.test.ts).
 */
export function trangThaiGoi(xe: Pick<XeDuocDung, 'hetHanLuc' | 'conHan' | 'goiHienTai'>, bayGio: number): TrangThaiGoi {
  const het = docNgay(xe.hetHanLuc);
  if (!het) return { muc: 'CHUA_CO', tenGoi: 'Chưa có', thoiGian: 'Chưa mua gói' };
  const ms = het.getTime() - bayGio;
  // Giống web: có hạn mà goiHienTai null nghĩa là gói đã mua nhưng chưa tới ngày bắt đầu
  const tenGoi = xe.goiHienTai ?? (xe.conHan ? 'Gói chưa bắt đầu' : 'Gói đã hết');
  if (ms <= 0 || !xe.conHan) return { muc: 'HET_HAN', tenGoi, thoiGian: conLai(xe.hetHanLuc, bayGio) };
  return { muc: ms <= NGUONG_SAP_HET_MS ? 'SAP_HET' : 'CON_HAN', tenGoi, thoiGian: conLai(xe.hetHanLuc, bayGio) };
}
