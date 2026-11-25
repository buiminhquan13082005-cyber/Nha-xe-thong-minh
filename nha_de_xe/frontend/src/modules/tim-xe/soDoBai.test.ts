import { describe, expect, it } from 'vitest';
import type { KhuCho } from './models';
import { KHU_O_TO_TREN_SO_DO, KHU_TREN_SO_DO, khuOToTrenSoDo, khuTrenSoDo, khuXeMayTrenSoDo, maSoDoCua, maXeMayCua } from './soDoBai';

const khu = (id: number, ten: string, loaiXeId: number, maSoDo: string | null = null, dangDung = true): KhuCho =>
  ({ id, ten, loaiXeId, sucChua: 10, soXe: 0, soGiu: 0, conLai: 10, muc: 'CON_NHIEU', khoangCachTuCong: null, maSoDo, dangDung });

describe('soDoBai', () => {
  it('có 17 chấm ô tô A–Q và 3 chấm xe máy, toạ độ trong ảnh', () => {
    expect(KHU_O_TO_TREN_SO_DO.map((c) => c.ma).join('')).toBe('ABCDEFGHIJKLMNOPQ');
    expect(KHU_TREN_SO_DO).toHaveLength(20);
    for (const c of KHU_TREN_SO_DO) {
      expect(c.x).toBeGreaterThan(0); expect(c.x).toBeLessThan(100);
      expect(c.y).toBeGreaterThan(0); expect(c.y).toBeLessThan(100);
    }
  });

  it('mã sơ đồ phải đúng loại xe của khu', () => {
    expect(maSoDoCua(khu(1, 'Khu A', 1, 'A'))).toBe('A');
    expect(maSoDoCua(khu(2, 'Khu R', 2, 'R'))).toBe('R');
    expect(maSoDoCua(khu(3, 'X', 2, 'A'))).toBeNull();   // khu xe máy mang mã ô tô
    expect(maSoDoCua(khu(4, 'X', 1, 'HAM'))).toBeNull(); // khu ô tô mang mã xe máy
  });

  it('chưa có mã thì suy theo tên: ô tô "Khu C (ô tô)" → C, xe máy "Khu C" mẫu cũ → không có chấm', () => {
    expect(maSoDoCua(khu(1, 'Khu B', 1))).toBe('B');
    expect(maSoDoCua(khu(2, 'Khu C (ô tô)', 1))).toBe('C');
    expect(maSoDoCua(khu(3, 'Khu C', 2))).toBeNull();
    expect(maSoDoCua(khu(4, 'Khu Z', 1))).toBeNull();
    expect(maSoDoCua(khu(5, 'Hầm xe máy B1/B2', 2))).toBe('HAM');
  });

  it('tách khu theo loại, theo thứ tự chấm, bỏ khu tạm tắt', () => {
    const ds = [khu(1, 'Khu B', 1, 'B'), khu(2, 'Khu A', 1, 'A'), khu(3, 'Khu Q', 1, 'Q', false), khu(10, 'Khu S', 2, 'S'), khu(11, 'Khu R', 2, 'R')];
    expect(khuXeMayTrenSoDo(ds).map((k) => k.id)).toEqual([11, 10]);
    expect(khuOToTrenSoDo(ds).map((k) => k.id)).toEqual([2, 1]);
    expect(khuTrenSoDo(ds).map((k) => k.id)).toEqual([11, 10, 2, 1]);
  });

  it('maXeMayCua bỏ khu ô tô (dữ liệu giả chỉ có đường cho xe máy)', () => {
    expect(maXeMayCua(khu(1, 'Khu A', 1, 'A'))).toBeNull();
    expect(maXeMayCua(khu(2, 'Khu S', 2, 'S'))).toBe('S');
  });
});
