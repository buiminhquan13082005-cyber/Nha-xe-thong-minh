// Chép từ tenTrangThaiGoi / goiHuyDuoc trong nha_de_xe/frontend/src/modules/goi-cho/pages/MuaGoiPage.tsx, sửa ở web thì nhớ sửa ở đây.
// Khác web: đọc ngày bằng docNgay() (giờ VN) và nhận bayGio từ ngoài để test được.
import { docNgay } from '@/shared/utils/ngayGio';
import type { DangKyCho } from './models';

const ms = (s: string) => docNgay(s)?.getTime() ?? 0;

/** Trạng thái một dòng lịch sử gói: huỷ (bởi ai, lý do), hết hạn, chưa bắt đầu, đang dùng. */
export function tenTrangThaiGoi(d: DangKyCho, bayGio = Date.now()): string {
  if (d.trangThai === 'HUY') return d.huyBoiAdmin ? `Admin huỷ: ${d.lyDoHuy ?? 'không ghi lý do'}` : `Bạn đã huỷ${d.lyDoHuy ? ` (${d.lyDoHuy})` : ''}`;
  if (ms(d.ngayKetThuc) <= bayGio) return 'Hết hạn';
  if (ms(d.ngayBatDau) > bayGio) return 'Chưa bắt đầu';
  return 'Đang dùng';
}

/** Chỉ gói CUỐI CÙNG còn hiệu lực mới huỷ được (lịch sử server trả đã sắp mới nhất lên đầu); huỷ gói giữa sẽ làm hở ngày. */
export function goiHuyDuoc(lichSu: DangKyCho[] | null | undefined, bayGio = Date.now()): DangKyCho | null {
  return lichSu?.find((d) => d.trangThai === 'CON_HAN' && ms(d.ngayKetThuc) > bayGio) ?? null;
}
