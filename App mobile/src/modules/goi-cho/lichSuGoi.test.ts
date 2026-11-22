import { docNgay } from '@/shared/utils/ngayGio';
import { goiHuyDuoc, tenTrangThaiGoi } from './lichSuGoi';
import type { DangKyCho } from './models';

const bayGio = docNgay('2026-11-19T10:00:00')!.getTime();
const dk = (p: Partial<DangKyCho>): DangKyCho => ({
  id: 1, tenGoi: 'Gói 30 ngày', ngayBatDau: '2026-11-01T00:00:00', ngayKetThuc: '2026-12-01T00:00:00', soTien: 150000,
  trangThai: 'CON_HAN', muaLuc: '2026-11-01T00:00:00', lyDoHuy: null, gopY: null, huyLuc: null, huyBoiAdmin: false, ...p,
});

describe('tenTrangThaiGoi', () => {
  it('đang dùng / chưa bắt đầu / hết hạn', () => {
    expect(tenTrangThaiGoi(dk({}), bayGio)).toBe('Đang dùng');
    expect(tenTrangThaiGoi(dk({ ngayBatDau: '2026-12-01T00:00:00', ngayKetThuc: '2026-12-31T00:00:00' }), bayGio)).toBe('Chưa bắt đầu');
    expect(tenTrangThaiGoi(dk({ ngayKetThuc: '2026-11-19T09:59:00' }), bayGio)).toBe('Hết hạn');
  });
  it('huỷ bởi Admin / bởi chủ xe', () => {
    expect(tenTrangThaiGoi(dk({ trangThai: 'HUY', huyBoiAdmin: true, lyDoHuy: 'quá hạn thanh toán' }), bayGio)).toBe('Admin huỷ: quá hạn thanh toán');
    expect(tenTrangThaiGoi(dk({ trangThai: 'HUY', huyBoiAdmin: true }), bayGio)).toBe('Admin huỷ: không ghi lý do');
    expect(tenTrangThaiGoi(dk({ trangThai: 'HUY', lyDoHuy: 'Chuyển nhà' }), bayGio)).toBe('Bạn đã huỷ (Chuyển nhà)');
    expect(tenTrangThaiGoi(dk({ trangThai: 'HUY' }), bayGio)).toBe('Bạn đã huỷ');
  });
});

describe('goiHuyDuoc', () => {
  it('lấy gói còn hạn mới nhất (đầu danh sách)', () => {
    const ds = [dk({ id: 3, ngayBatDau: '2026-12-01T00:00:00', ngayKetThuc: '2026-12-31T00:00:00' }), dk({ id: 2 })];
    expect(goiHuyDuoc(ds, bayGio)?.id).toBe(3);
  });
  it('bỏ qua gói đã huỷ / đã hết', () => {
    const ds = [dk({ id: 3, trangThai: 'HUY' }), dk({ id: 2, ngayKetThuc: '2026-11-10T00:00:00' })];
    expect(goiHuyDuoc(ds, bayGio)).toBeNull();
    expect(goiHuyDuoc(null, bayGio)).toBeNull();
  });
});
