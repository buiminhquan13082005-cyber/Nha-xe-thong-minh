// Chép từ tinYeuCauDaKetThuc trong nha_de_xe/frontend/src/modules/cong-ra-vao/pages/RaVaoPage.tsx, sửa ở web thì nhớ sửa ở đây.
// Khác web: đọc giờ bằng docNgay() (giờ VN) thay cho new Date().toLocaleTimeString.
import { dinhDangNgay, hienThiBienSo } from '@/shared/utils/format';
import { docNgay } from '@/shared/utils/ngayGio';
import { TEN_TRANG_THAI_LUOT, type LuotGui } from './models';

export const THONG_DIEP_HET_GIO = 'Đã hết 60 giây, cổng không mở. Liên hệ quản lý bãi.';

/** "21:30" theo giờ Việt Nam. */
function gioPhut(s: string | null | undefined): string | null {
  const d = docNgay(s);
  if (!d) return null;
  const vn = new Date(d.getTime() + 7 * 3_600_000);
  return `${String(vn.getUTCHours()).padStart(2, '0')}:${String(vn.getUTCMinutes()).padStart(2, '0')}`;
}

/** Mở yêu cầu xác nhận nhưng yêu cầu không còn chờ: nói rõ trạng thái hiện tại, KHÔNG có nút làm tiếp. */
export function tinYeuCauDaKetThuc(l: LuotGui): { loai: 'tin' | 'canh'; noiDung: string } {
  const bien = hienThiBienSo(l.bienSo);
  const gio = gioPhut(l.yeuCauHetHanLuc);
  if (l.trangThai === 'DA_RA') return { loai: 'tin', noiDung: `Yêu cầu xác nhận của xe ${bien} đã xong: xe đã ra bãi lúc ${dinhDangNgay(l.thoiGianRa)}.` };
  if (l.trangThai === 'NGHI_MAT') return { loai: 'canh', noiDung: `Xe ${bien} đã được báo "Không phải tôi". Cổng không mở, Admin đang kiểm tra.` };
  if (l.yeuCauKetQua === 'HET_HAN')
    return { loai: 'canh', noiDung: `Yêu cầu xác nhận của xe ${bien} đã hết hạn${gio ? ` lúc ${gio}` : ''}, cổng không mở. Admin đang xử lý.` };
  return { loai: 'tin', noiDung: `Yêu cầu xác nhận của xe ${bien} đã kết thúc. Trạng thái hiện tại: ${TEN_TRANG_THAI_LUOT[l.trangThai]}.` };
}
