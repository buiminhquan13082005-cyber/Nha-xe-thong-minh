import { yeuCauCanMo } from './chonYeuCau';
import type { YeuCauXacNhan } from './models';

const yc = (id: number, p: Partial<YeuCauXacNhan> = {}): YeuCauXacNhan => ({
  id, luotGuiId: id * 10, xeId: 1, bienSo: '29A12345', chuXeId: 1, tenChuXe: 'An',
  taoLuc: '2026-11-19T21:30:00', hetHanLuc: '2026-11-19T21:31:00', soGiayConLai: 50,
  nguoiDungXeDongY: null, nguoiDungXeTraLoi: null, quanLyDongY: null, quanLyTraLoi: null, ...p,
});

describe('yeuCauCanMo', () => {
  it('không có yêu cầu: null', () => {
    expect(yeuCauCanMo([], new Set())).toBeNull();
  });

  it('yêu cầu mới chưa ai trả lời: mở', () => {
    expect(yeuCauCanMo([yc(1)], new Set())?.id).toBe(1);
  });

  it('đã mở trên máy này rồi thì không tự bật lại', () => {
    expect(yeuCauCanMo([yc(1)], new Set([1]))).toBeNull();
  });

  it('đã có người trả lời, quản lý đã mở tay, hoặc hết giờ: không mở', () => {
    expect(yeuCauCanMo([yc(1, { nguoiDungXeDongY: true })], new Set())).toBeNull();
    expect(yeuCauCanMo([yc(2, { quanLyDongY: true })], new Set())).toBeNull();
    expect(yeuCauCanMo([yc(3, { soGiayConLai: 0 })], new Set())).toBeNull();
  });

  it('nhiều yêu cầu: cái sắp hết giờ nhất trước', () => {
    expect(yeuCauCanMo([yc(1, { soGiayConLai: 50 }), yc(2, { soGiayConLai: 12 }), yc(3, { soGiayConLai: 30 })], new Set())?.id).toBe(2);
  });
});
