import { kiemTraAnh } from './anhGiayDangKy';
import { canhBaoChoKhach, hetCho, timChoCon } from './choCon';

describe('kiemTraAnh', () => {
  it('chưa chọn ảnh', () => {
    expect(kiemTraAnh(null)).toBe('Chưa chọn ảnh giấy đăng ký xe.');
  });
  it('JPG / PNG dưới 5 MB: hợp lệ', () => {
    expect(kiemTraAnh({ uri: 'file:///a.jpg', ten: 'a.jpg', kieu: 'image/jpeg', kichThuoc: 400_000 })).toBeNull();
    expect(kiemTraAnh({ uri: 'file:///a.png', ten: 'a.png', kieu: 'image/png' })).toBeNull();
  });
  it('quá 5 MB', () => {
    expect(kiemTraAnh({ uri: 'file:///a.jpg', ten: 'a.jpg', kieu: 'image/jpeg', kichThuoc: 6 * 1024 * 1024 })).toBe('Ảnh tối đa 5 MB.');
  });
  it('kiểu khác', () => {
    expect(kiemTraAnh({ uri: 'file:///a.gif', ten: 'a.gif', kieu: 'image/gif' as 'image/png' })).toBe('Chỉ nhận ảnh JPG hoặc PNG.');
  });
});

describe('choCon (giống web)', () => {
  const ds = [
    { loaiXeId: 1, loaiXe: 'O_TO' as const, sucChua: 10, soChoConBan: 0 },
    { loaiXeId: 2, loaiXe: 'XE_MAY' as const, sucChua: 100, soChoConBan: 42 },
  ];
  it('tìm theo loại xe và biết hết chỗ', () => {
    expect(hetCho(timChoCon(ds, 1))).toBe(true);
    expect(hetCho(timChoCon(ds, 2))).toBe(false);
    expect(timChoCon(undefined, 2)).toBeUndefined();
  });
  it('câu cảnh báo', () => {
    expect(canhBaoChoKhach(timChoCon(ds, 1))).toMatch(/^Ô tô hiện đã hết chỗ \(0 \/ 10\)/);
    expect(canhBaoChoKhach(timChoCon(ds, 2))).toMatch(/^Xe máy còn 42 \/ 100 chỗ/);
    expect(canhBaoChoKhach(undefined)).toBeNull();
  });
});
