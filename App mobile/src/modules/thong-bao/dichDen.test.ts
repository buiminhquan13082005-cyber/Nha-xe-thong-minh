// Chép từ nha_de_xe/frontend/src/modules/thong-bao/dichDen.test.ts (phần khách), đường dẫn đổi theo route của app.
import { duongDanCho, HANH_DONG_KHACH, hanhDongCua, nhanHanhDong, type ThongBaoDich } from './dichDen';

const tb = (p: Partial<ThongBaoDich>): ThongBaoDich => ({ loai: 'RA', noiDung: '', ...p });

describe('duongDanCho: có hanhDong (thông báo mới)', () => {
  const khach: [string, number | null, string][] = [
    ['XAC_NHAN_RA', 123, '/ra-vao?luot=123&xacNhan=1'],
    ['XEM_LUOT', 123, '/ra-vao?luot=123'],
    ['TRA_PHI', 45, '/phi-qua-han/45'],
    ['DAN_DUONG', 123, '/tim-xe?danDuong=123'],
    ['DUONG_RA', 123, '/tim-xe?duongRa=123'],
    ['XEM_VI_TRI', 45, '/tim-xe?xe=45'],
    ['XEM_SO_DO', null, '/so-do'],
    ['MUA_GOI', 45, '/mua-goi/45'],
    ['GUI_LAI_GIAY', 45, '/xe?xe=45'],
    ['XEM_XE', 45, '/xe?xe=45'],
    ['XEM_NHOM', 7, '/nhom-gia-dinh'],
    ['DOI_MAT_KHAU', null, '/doi-mat-khau'],
  ];
  it.each(khach)('%s (%s) → %s', (hanhDong, thamChieuId, dich) => {
    expect(duongDanCho(tb({ hanhDong, thamChieuId }))).toBe(dich);
  });

  it('mọi hành động của khách đều có đường dẫn (không sót case)', () => {
    for (const h of HANH_DONG_KHACH) expect(duongDanCho(tb({ hanhDong: h, thamChieuId: 1 }))).toMatch(/^\//);
  });

  it('thiếu id: về màn chung, không có tham số rỗng', () => {
    expect(duongDanCho(tb({ hanhDong: 'XAC_NHAN_RA' }))).toBe('/ra-vao');
    expect(duongDanCho(tb({ hanhDong: 'MUA_GOI' }))).toBe('/mua-goi/0');
    expect(duongDanCho(tb({ hanhDong: 'TRA_PHI' }))).toBe('/ra-vao');
  });

  it('hành động của Admin hoặc hành động lạ → null (app chỉ dành cho người dùng)', () => {
    expect(duongDanCho(tb({ hanhDong: 'DUYET_XE', thamChieuId: 45 }))).toBeNull();
    expect(duongDanCho(tb({ hanhDong: 'LAM_GI_DO', thamChieuId: 1 }))).toBeNull();
  });
});

describe('duongDanCho: thông báo cũ (hanh_dong NULL) suy theo loai', () => {
  it.each([
    ['RA', 'Xe 36C239395 đang ở cổng ra. Mở mục Ra vào và xác nhận trong 60 giây nếu đúng là bạn.', '/ra-vao'],
    ['RA', 'Xe 36C239395 đã được An xác nhận ra bãi lúc 03:48 19/11/2026.', '/ra-vao'],
    ['VAO', 'Xe 36C239395 đã vào bãi lúc 03:42.', '/ra-vao'],
    ['KHU', 'Xe 36C239395: mời vào Khu R. Bãi giữ cho bạn 1 chỗ trong 5 phút, mở bản đồ để xem đường đi.', '/tim-xe'],
    ['KHU', 'Xe 36C239395: bãi xe máy đã hết chỗ (R, S, Hầm đều đầy).', '/so-do'],
    ['KHU', 'Đã đến bãi đỗ thành công: xe 36C239395 đang đỗ tại Hầm.', '/tim-xe'],
    ['SAP_HET_HAN', 'Gói Tháng của xe 36C239395 sẽ hết hạn…', '/mua-goi/0'],
    ['HET_HAN', 'Xe 36C239395 vừa tới cổng vào nhưng chưa có chỗ hoặc gói đã hết hạn.', '/mua-goi/0'],
    ['QUA_HAN', 'Xe 36C239395 đã quá hạn 2 ngày…', '/ra-vao'],
    ['KET_QUA_DUYET', 'Xe 36C239395 đã được duyệt, bạn có thể mua gói.', '/mua-goi/0'],
    ['KET_QUA_DUYET', 'Xe 36C239395 bị từ chối: ảnh mờ.', '/xe'],
    ['XE_BI_GO', 'Xe 36C239395 bị gỡ…', '/xe'],
    ['NHOM', 'Có người xin tham gia nhóm…', '/nhom-gia-dinh'],
  ])('%s "%s" → %s', (loai, noiDung, dich) => {
    expect(duongDanCho({ loai, noiDung })).toBe(dich);
  });

  it('loại lạ hoặc loại chỉ của Admin → null', () => {
    expect(duongDanCho({ loai: 'LOAI_MOI', noiDung: 'x' })).toBeNull();
    expect(duongDanCho({ loai: 'XE_CHO_DUYET', noiDung: 'Có xe mới chờ duyệt' })).toBeNull();
  });
});

describe('nhãn hành động', () => {
  it('việc cần làm có nhãn, thông báo chỉ để biết thì không', () => {
    expect(nhanHanhDong(tb({ hanhDong: 'XAC_NHAN_RA', thamChieuId: 1 }))).toBe('Xác nhận ra');
    expect(nhanHanhDong(tb({ hanhDong: 'XEM_LUOT', thamChieuId: 1 }))).toBeNull();
  });
  it('thông báo cũ "đang ở cổng ra" vẫn có nhãn Xác nhận ra', () => {
    expect(hanhDongCua({ loai: 'RA', noiDung: 'Xe A đang ở cổng ra…' })).toBe('XAC_NHAN_RA');
  });
});
