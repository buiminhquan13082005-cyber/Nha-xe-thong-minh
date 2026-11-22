import { LOI_CHUA_CAU_HINH, canhBaoDiaChi, chuanHoaDiaChi } from './cauHinh';

describe('chuanHoaDiaChi', () => {
  it('bỏ khoảng trắng và dấu / ở cuối', () => {
    expect(chuanHoaDiaChi(' http://192.168.1.10:8080/ ')).toBe('http://192.168.1.10:8080');
    expect(chuanHoaDiaChi('https://nhaxe.vn//')).toBe('https://nhaxe.vn');
  });
  it('thiếu http(s):// hoặc rỗng: null', () => {
    expect(chuanHoaDiaChi('192.168.1.10:8080')).toBeNull();
    expect(chuanHoaDiaChi('')).toBeNull();
    expect(chuanHoaDiaChi(undefined)).toBeNull();
  });
});

describe('canhBaoDiaChi', () => {
  it('chưa đặt: nhắc đặt EXPO_PUBLIC_API_URL', () => {
    expect(canhBaoDiaChi(null)).toBe(LOI_CHUA_CAU_HINH);
  });
  it('localhost / 127.0.0.1: điện thoại không gọi được', () => {
    expect(canhBaoDiaChi('http://localhost:8080')).toMatch(/localhost/);
    expect(canhBaoDiaChi('http://127.0.0.1:8080')).toMatch(/localhost/);
  });
  it('IP mạng LAN: không cảnh báo', () => {
    expect(canhBaoDiaChi('http://192.168.1.10:8080')).toBeNull();
  });
});
