import { dinhDangNgay, docNgay } from './ngayGio';

describe('docNgay: chuỗi API không múi giờ là giờ Việt Nam (UTC+7)', () => {
  it('21:30 giờ VN = 14:30 UTC, bất kể múi giờ của máy', () => {
    expect(docNgay('2026-11-19T21:30:05.123')?.toISOString()).toBe('2026-11-19T14:30:05.123Z');
  });

  it('qua nửa đêm: 03:00 giờ VN là 20:00 UTC của ngày hôm trước', () => {
    expect(docNgay('2026-01-01T03:00:00.000')?.toISOString()).toBe('2025-12-31T20:00:00.000Z');
  });

  it('không có phần mili giây hoặc giây vẫn đọc được', () => {
    expect(docNgay('2026-11-19T21:30:05')?.toISOString()).toBe('2026-11-19T14:30:05.000Z');
    expect(docNgay('2026-11-19T21:30')?.toISOString()).toBe('2026-11-19T14:30:00.000Z');
  });

  it('chỉ có ngày: 00:00 giờ VN', () => {
    expect(docNgay('2026-11-19')?.toISOString()).toBe('2026-11-18T17:00:00.000Z');
  });

  it('có Z hoặc +hh:mm thì theo đúng múi giờ ghi trong chuỗi', () => {
    expect(docNgay('2026-11-19T14:30:00Z')?.toISOString()).toBe('2026-11-19T14:30:00.000Z');
    expect(docNgay('2026-11-19T21:30:00+07:00')?.toISOString()).toBe('2026-11-19T14:30:00.000Z');
    expect(docNgay('2026-11-19T09:30:00-05:00')?.toISOString()).toBe('2026-11-19T14:30:00.000Z');
  });

  it('phần giây lẻ dài hơn 3 chữ số (kiểu .NET) cắt còn mili giây', () => {
    expect(docNgay('2026-11-19T21:30:05.1234567')?.toISOString()).toBe('2026-11-19T14:30:05.123Z');
  });

  it('rỗng, null, sai dạng, ngày không có thật: null', () => {
    expect(docNgay(null)).toBeNull();
    expect(docNgay(undefined)).toBeNull();
    expect(docNgay('')).toBeNull();
    expect(docNgay('hôm qua')).toBeNull();
    expect(docNgay('2026-02-31T10:00:00')).toBeNull();
    expect(docNgay('2026-13-01T10:00:00')).toBeNull();
    expect(docNgay('2026-11-19T24:00:00')).toBeNull();
  });
});

describe('dinhDangNgay: hiện theo giờ Việt Nam', () => {
  it('chuỗi API giữ nguyên giờ đã ghi', () => {
    expect(dinhDangNgay('2026-11-19T21:30:05.123')).toBe('19/11/2026 21:30');
  });
  it('chuỗi UTC đổi sang giờ VN', () => {
    expect(dinhDangNgay('2026-11-19T20:00:00Z')).toBe('20/11/2026 03:00');
  });
  it('không có giá trị: —', () => {
    expect(dinhDangNgay(null)).toBe('—');
    expect(dinhDangNgay('sai')).toBe('—');
  });
});
