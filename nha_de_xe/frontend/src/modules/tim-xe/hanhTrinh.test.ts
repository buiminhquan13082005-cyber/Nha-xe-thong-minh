import { describe, expect, it } from 'vitest';
import { duongSvg, thoiGianChay, tinhHanhTrinh } from './hanhTrinh';
import { KICH_THUOC_ANH } from './soDoBai';

const { rong: W, cao: H } = KICH_THUOC_ANH;

describe('tinhHanhTrinh', () => {
  it('ít hơn 2 điểm khác nhau thì không có hành trình', () => {
    expect(tinhHanhTrinh([])).toBeNull();
    expect(tinhHanhTrinh([{ x: 0.1, y: 0.1 }])).toBeNull();
    expect(tinhHanhTrinh([{ x: 0.1, y: 0.1 }, { x: 0.1, y: 0.1 }])).toBeNull();
  });

  it('tính tổng chiều dài và mốc tăng dần từ 0 đến 1, bỏ điểm trùng', () => {
    const h = tinhHanhTrinh([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 100 / W, y: 0 }, { x: 100 / W, y: 300 / H }])!;
    expect(h.tong).toBeCloseTo(400);
    expect(h.diem.map((d) => d.moc)).toEqual([0, 0.25, 1]);
    expect(duongSvg(h)).toBe('M 0.0 0.0 L 100.0 0.0 L 100.0 300.0');
  });

  it('thời gian chạy tối thiểu 2,5 giây', () => {
    expect(thoiGianChay({ tong: 50, diem: [] })).toBe(2.5);
    expect(thoiGianChay({ tong: 550, diem: [] })).toBe(5);
  });
});
