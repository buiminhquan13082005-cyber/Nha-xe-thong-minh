import type { LuotGui } from '@/modules/cong-ra-vao/models';
import type { XeTimXe } from '@/modules/tim-xe/models';
import { ghepXeTrongBai } from './ghepXeTrongBai';

const xe = (xeId: number, trongBai: boolean, thoiGianVao: string | null, khu: string | null = null): XeTimXe => ({
  xeId, bienSo: `29A${xeId}2345`, loaiXe: 'XE_MAY', trongBai, thoiGianVao, khuId: null, khu,
  vaoKhuLuc: null, nguonKhu: null, moiVao: null, duong: null, hoTroDinhVi: true,
});

const luot = (id: number, xeId: number, trangThai: LuotGui['trangThai'], thoiGianVao: string, thoiGianRa: string | null = null): LuotGui => ({
  id, xeId, bienSo: `29A${xeId}2345`, thoiGianVao, thoiGianRa, trangThai,
});

describe('ghepXeTrongBai', () => {
  it('chỉ lấy xe đang trong bãi, xe vào gần nhất lên đầu', () => {
    const kq = ghepXeTrongBai(
      [xe(1, true, '2026-11-19T08:00:00', 'R'), xe(2, false, null), xe(3, true, '2026-11-19T09:30:00', 'S')],
      [],
    );
    expect(kq.map((x) => x.xeId)).toEqual([3, 1]);
    expect(kq[0]).toEqual({ xeId: 3, bienSo: '29A32345', thoiGianVao: '2026-11-19T09:30:00', khu: 'S', trangThaiLuot: null });
  });

  it('lượt đang mở ở trạng thái đặc biệt thì gắn nhãn; "Đang gửi" thì không', () => {
    const kq = ghepXeTrongBai(
      [xe(1, true, '2026-11-19T08:00:00'), xe(2, true, '2026-11-19T07:00:00')],
      [luot(10, 1, 'CHO_THANH_TOAN', '2026-11-19T08:00:00'), luot(11, 2, 'DANG_GUI', '2026-11-19T07:00:00')],
    );
    expect(kq.find((x) => x.xeId === 1)?.trangThaiLuot).toBe('CHO_THANH_TOAN');
    expect(kq.find((x) => x.xeId === 2)?.trangThaiLuot).toBeNull();
  });

  it('bỏ qua lượt đã ra, lấy lượt đang mở mới nhất của cùng xe', () => {
    const kq = ghepXeTrongBai(
      [xe(1, true, '2026-11-19T08:00:00')],
      [
        luot(9, 1, 'DA_RA', '2026-11-18T08:00:00', '2026-11-18T18:00:00'),
        luot(10, 1, 'NGHI_MAT', '2026-11-17T08:00:00'),
        luot(11, 1, 'CHO_XAC_NHAN', '2026-11-19T08:00:00'),
      ],
    );
    expect(kq[0].trangThaiLuot).toBe('CHO_XAC_NHAN');
  });

  it('API ra-vao lỗi (lichSu null): vẫn hiện xe, không có nhãn', () => {
    const kq = ghepXeTrongBai([xe(1, true, '2026-11-19T08:00:00', 'R')], null);
    expect(kq).toHaveLength(1);
    expect(kq[0].trangThaiLuot).toBeNull();
  });

  it('tim-xe thiếu giờ vào thì lấy giờ vào của lượt gửi', () => {
    const kq = ghepXeTrongBai([xe(1, true, null)], [luot(10, 1, 'DANG_GUI', '2026-11-19T06:15:00')]);
    expect(kq[0].thoiGianVao).toBe('2026-11-19T06:15:00');
  });
});
