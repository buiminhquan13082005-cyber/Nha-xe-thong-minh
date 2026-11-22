import { conLai, dinhDangTien, hienThiBienSo, tenLoaiXe } from './format';
import { docNgay } from './ngayGio';

const luc = (s: string) => docNgay(s)!.getTime();

describe('dinhDangTien', () => {
  it('nhóm 3 chữ số bằng dấu chấm, thêm " đ"', () => {
    expect(dinhDangTien(150000)).toBe('150.000 đ');
    expect(dinhDangTien(1234567)).toBe('1.234.567 đ');
    expect(dinhDangTien(0)).toBe('0 đ');
    expect(dinhDangTien(999)).toBe('999 đ');
    expect(dinhDangTien(-20000)).toBe('-20.000 đ');
  });
});

describe('hienThiBienSo (giống web)', () => {
  it('xe máy và ô tô', () => {
    expect(hienThiBienSo('30A12345')).toBe('30A-123.45');
    expect(hienThiBienSo('29B112345')).toBe('29B1-123.45');
    expect(hienThiBienSo('51F1234')).toBe('51F-1234');
  });
  it('không đúng dạng thì giữ nguyên', () => {
    expect(hienThiBienSo('ABC')).toBe('ABC');
  });
});

describe('tenLoaiXe', () => {
  it('O_TO / 1 là Ô tô, còn lại Xe máy', () => {
    expect(tenLoaiXe('O_TO')).toBe('Ô tô');
    expect(tenLoaiXe(1)).toBe('Ô tô');
    expect(tenLoaiXe('XE_MAY')).toBe('Xe máy');
  });
});

describe('conLai (đọc giờ VN của API)', () => {
  const bayGio = luc('2026-11-19T10:00:00');
  it('còn ngày và giờ', () => {
    expect(conLai('2026-12-01T13:00:00', bayGio)).toBe('Còn 12 ngày 3 giờ');
    expect(conLai('2026-11-20T10:00:00', bayGio)).toBe('Còn 1 ngày');
  });
  it('dưới 1 ngày', () => {
    expect(conLai('2026-11-19T15:30:00', bayGio)).toBe('Còn 5 giờ');
    expect(conLai('2026-11-19T10:30:00', bayGio)).toBe('Còn dưới 1 giờ');
  });
  it('đã qua mốc', () => {
    expect(conLai('2026-11-17T10:00:00', bayGio)).toBe('Quá hạn 2 ngày');
  });
  it('không có mốc', () => {
    expect(conLai(null, bayGio)).toBe('Không có gói');
  });
});
