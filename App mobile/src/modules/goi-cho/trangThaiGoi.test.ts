import { docNgay } from '@/shared/utils/ngayGio';
import { trangThaiGoi } from './trangThaiGoi';

const bayGio = docNgay('2026-11-19T10:00:00')!.getTime();
const xe = (hetHanLuc: string | null, conHan = true, goiHienTai: string | null = 'Gói 30 ngày') => ({ hetHanLuc, conHan, goiHienTai });

describe('trangThaiGoi', () => {
  it('còn hơn 72 giờ: CON_HAN', () => {
    const t = trangThaiGoi(xe('2026-12-01T13:00:00'), bayGio);
    expect(t).toEqual({ muc: 'CON_HAN', tenGoi: 'Gói 30 ngày', thoiGian: 'Còn 12 ngày 3 giờ' });
  });

  it('còn đúng 72 giờ: SAP_HET (ngưỡng tính cả mốc 72 giờ)', () => {
    expect(trangThaiGoi(xe('2026-11-22T10:00:00'), bayGio).muc).toBe('SAP_HET');
  });

  it('còn 72 giờ 1 phút: vẫn CON_HAN', () => {
    expect(trangThaiGoi(xe('2026-11-22T10:01:00'), bayGio).muc).toBe('CON_HAN');
  });

  it('còn 5 giờ: SAP_HET', () => {
    const t = trangThaiGoi(xe('2026-11-19T15:00:00'), bayGio);
    expect(t.muc).toBe('SAP_HET');
    expect(t.thoiGian).toBe('Còn 5 giờ');
  });

  it('đã qua hạn: HET_HAN, ghi "Quá hạn …"', () => {
    const t = trangThaiGoi(xe('2026-11-17T10:00:00', false, null), bayGio);
    expect(t).toEqual({ muc: 'HET_HAN', tenGoi: 'Gói đã hết', thoiGian: 'Quá hạn 2 ngày' });
  });

  it('server báo conHan = false thì là HET_HAN dù đồng hồ chưa qua mốc', () => {
    expect(trangThaiGoi(xe('2026-11-25T10:00:00', false), bayGio).muc).toBe('HET_HAN');
  });

  it('chưa từng mua: CHUA_CO', () => {
    expect(trangThaiGoi(xe(null, false, null), bayGio)).toEqual({ muc: 'CHUA_CO', tenGoi: 'Chưa có', thoiGian: 'Chưa mua gói' });
  });

  it('đã mua nhưng chưa tới ngày bắt đầu: "Gói chưa bắt đầu" (giống thẻ xe của web)', () => {
    expect(trangThaiGoi(xe('2026-12-30T00:00:00', true, null), bayGio).tenGoi).toBe('Gói chưa bắt đầu');
  });
});
