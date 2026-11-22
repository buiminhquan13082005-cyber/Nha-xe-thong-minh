import { docNgay } from '@/shared/utils/ngayGio';
import { chuoiToaDo, dinhDangGiuCho, giayGiuChoCon, thoiGianChay, thoiGianDaDo, tinhHanhTrinh, viTriMuiTen } from './banDo';
import type { KhuCho } from './models';
import { KICH_THUOC_ANH, khuXeMayTrenSoDo, maSoDoCua } from './soDoXeMay';

const khu = (p: Partial<KhuCho>): KhuCho => ({
  id: 1, ten: 'Khu R', loaiXeId: 2, sucChua: 100, soXe: 10, soGiu: 0, conLai: 90, muc: 'CON_NHIEU', khoangCachTuCong: null, ...p,
});

describe('maSoDoCua / khuXeMayTrenSoDo (giống web)', () => {
  it('ưu tiên maSoDo, không có thì suy theo tên', () => {
    expect(maSoDoCua(khu({ maSoDo: 'ham' }))).toBe('HAM');
    expect(maSoDoCua(khu({ ten: 'Khu S' }))).toBe('S');
    expect(maSoDoCua(khu({ ten: 'R – Xe máy' }))).toBe('R');
    expect(maSoDoCua(khu({ ten: 'Hầm B1/B2' }))).toBe('HAM');
    expect(maSoDoCua(khu({ ten: 'Khu C' }))).toBeNull();
  });
  it('khu ô tô không hiện trên sơ đồ', () => {
    expect(maSoDoCua(khu({ loaiXeId: 1, ten: 'Khu R' }))).toBeNull();
  });
  it('sắp đúng thứ tự R, S, Hầm và bỏ khu lạ', () => {
    const ds = [khu({ id: 3, ten: 'Hầm' }), khu({ id: 9, ten: 'Khu D' }), khu({ id: 2, ten: 'Khu S' }), khu({ id: 1, ten: 'Khu R' })];
    expect(khuXeMayTrenSoDo(ds).map((k) => k.id)).toEqual([1, 2, 3]);
  });
});

describe('đường đi trên sơ đồ', () => {
  it('toạ độ theo kích thước ảnh gốc 683 × 342', () => {
    expect(chuoiToaDo([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe('0.0,0.0 683.0,342.0');
  });
  it('mũi tên đặt dọc đoạn thẳng, góc theo hướng đi', () => {
    const m = viTriMuiTen([{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]);
    expect(m.length).toBeGreaterThan(10);
    expect(m.every((p) => Math.abs(p.goc) < 0.001 && Math.abs(p.y - 171) < 0.001)).toBe(true);
    expect(m[0].x).toBeCloseTo(23);
  });
  it('dưới 2 điểm: không có mũi tên', () => {
    expect(viTriMuiTen([{ x: 0.1, y: 0.1 }])).toEqual([]);
  });
});

describe('giữ chỗ và thời gian đã đỗ', () => {
  it('số giây giữ chỗ theo giờ server', () => {
    expect(giayGiuChoCon('2026-11-19T21:35:00', '2026-11-19T21:30:30')).toBe(270);
    expect(giayGiuChoCon('2026-11-19T21:30:00', '2026-11-19T21:31:00')).toBe(0);
    expect(dinhDangGiuCho(270)).toBe('4:30');
    expect(dinhDangGiuCho(5)).toBe('0:05');
    expect(dinhDangGiuCho(0)).toBe('hết giờ giữ');
  });
  it('thời gian đã đỗ', () => {
    const bay = docNgay('2026-11-19T22:10:00')!.getTime();
    expect(thoiGianDaDo('2026-11-19T22:09:40', bay)).toBe('vừa đỗ');
    expect(thoiGianDaDo('2026-11-19T21:45:00', bay)).toBe('25 phút');
    expect(thoiGianDaDo('2026-11-19T21:05:00', bay)).toBe('1 giờ 05 phút');
  });
});

describe('tinhHanhTrinh', () => {
  const { rong: W, cao: H } = KICH_THUOC_ANH;
  it('ít hơn 2 điểm khác nhau thì không có hành trình', () => {
    expect(tinhHanhTrinh([])).toBeNull();
    expect(tinhHanhTrinh([{ x: 0.1, y: 0.1 }, { x: 0.1, y: 0.1 }])).toBeNull();
  });
  it('tính tổng chiều dài và mốc tăng dần từ 0 đến 1, bỏ điểm trùng', () => {
    const h = tinhHanhTrinh([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 100 / W, y: 0 }, { x: 100 / W, y: 300 / H }])!;
    expect(h.tong).toBeCloseTo(400);
    expect(h.diem.map((d) => d.moc)).toEqual([0, 0.25, 1]);
  });
  it('thời gian chạy tối thiểu 2,5 giây', () => {
    expect(thoiGianChay({ tong: 50, diem: [] })).toBe(2.5);
    expect(thoiGianChay({ tong: 550, diem: [] })).toBe(5);
  });
});
