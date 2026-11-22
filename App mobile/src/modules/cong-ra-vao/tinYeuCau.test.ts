import type { LuotGui } from './models';
import { tinYeuCauDaKetThuc } from './tinYeuCau';

const luot = (p: Partial<LuotGui>): LuotGui => ({
  id: 1, xeId: 2, bienSo: '29A12345', thoiGianVao: '2026-11-19T08:00:00', thoiGianRa: null, trangThai: 'DANG_GUI', ...p,
});

describe('tinYeuCauDaKetThuc (giống web)', () => {
  it('xe đã ra', () => {
    expect(tinYeuCauDaKetThuc(luot({ trangThai: 'DA_RA', thoiGianRa: '2026-11-19T21:30:00' })))
      .toEqual({ loai: 'tin', noiDung: 'Yêu cầu xác nhận của xe 29A-123.45 đã xong: xe đã ra bãi lúc 19/11/2026 21:30.' });
  });
  it('nghi mất xe', () => {
    expect(tinYeuCauDaKetThuc(luot({ trangThai: 'NGHI_MAT' })).loai).toBe('canh');
  });
  it('hết hạn: ghi giờ hết hạn theo giờ VN', () => {
    expect(tinYeuCauDaKetThuc(luot({ yeuCauKetQua: 'HET_HAN', yeuCauHetHanLuc: '2026-11-19T21:31:00.000' })).noiDung)
      .toBe('Yêu cầu xác nhận của xe 29A-123.45 đã hết hạn lúc 21:31, cổng không mở. Admin đang xử lý.');
  });
  it('trường hợp khác: ghi trạng thái hiện tại', () => {
    expect(tinYeuCauDaKetThuc(luot({ trangThai: 'CHO_THANH_TOAN' })).noiDung).toMatch(/Chờ thanh toán\.$/);
  });
});
