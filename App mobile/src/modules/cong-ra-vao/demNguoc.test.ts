import { mocHetTheoMay, soGiayCon, tiLeCon } from './demNguoc';

describe('đếm ngược xác nhận xe ra', () => {
  const nhan = 1_000_000;

  it('mốc hết = lúc nhận + số giây server báo', () => {
    expect(mocHetTheoMay(60, nhan)).toBe(nhan + 60_000);
    expect(mocHetTheoMay(-3, nhan)).toBe(nhan); // server báo âm (đã quá hạn): coi như hết ngay
  });

  it('đếm theo đồng hồ máy, làm tròn lên', () => {
    const moc = mocHetTheoMay(60, nhan);
    expect(soGiayCon(moc, nhan)).toBe(60);
    expect(soGiayCon(moc, nhan + 800)).toBe(60);
    expect(soGiayCon(moc, nhan + 1_000)).toBe(59);
    expect(soGiayCon(moc, nhan + 59_900)).toBe(1);
    expect(soGiayCon(moc, nhan + 60_000)).toBe(0);
    expect(soGiayCon(moc, nhan + 90_000)).toBe(0);
  });

  it('tải lại thì đồng bộ theo số mới của server (máy chạy nhanh / chậm không cộng dồn sai số)', () => {
    // lần 1: server báo 60 giây lúc nhan; 3 giây sau tải lại, server báo 55 (đồng hồ máy lệch 2 giây)
    const moc2 = mocHetTheoMay(55, nhan + 3_000);
    expect(soGiayCon(moc2, nhan + 3_000)).toBe(55);
  });

  it('tỉ lệ vòng tròn trong khoảng 0..1', () => {
    expect(tiLeCon(60)).toBe(1);
    expect(tiLeCon(30)).toBe(0.5);
    expect(tiLeCon(0)).toBe(0);
    expect(tiLeCon(90)).toBe(1);
  });
});
