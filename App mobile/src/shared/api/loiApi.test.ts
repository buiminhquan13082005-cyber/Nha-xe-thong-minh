import { LoiApi } from '../models';
import {
  MA_HET_THOI_GIAN, MA_MAT_KET_NOI, THONG_DIEP_MAY_CHU_LOI, THONG_DIEP_QUA_NHIEU,
  loiHetThoiGian, loiMatKetNoi, taoLoiTuPhanHoi, thongDiepLoi,
} from './loiApi';

describe('taoLoiTuPhanHoi', () => {
  it('server trả { ma, thongDiep }: luôn dùng thongDiep của server', () => {
    const l = taoLoiTuPhanHoi(401, { ma: 'PHIEN_HET_HIEU_LUC', thongDiep: 'Phiên đăng nhập đã hết hiệu lực. Hãy đăng nhập lại.' });
    expect(l).toBeInstanceOf(LoiApi);
    expect(l.status).toBe(401);
    expect(l.ma).toBe('PHIEN_HET_HIEU_LUC');
    expect(l.message).toBe('Phiên đăng nhập đã hết hiệu lực. Hãy đăng nhập lại.');
  });

  it('429 của backend có thongDiep: dùng câu của server', () => {
    const l = taoLoiTuPhanHoi(429, { ma: 'QUA_NHIEU_YEU_CAU', thongDiep: 'Bạn thao tác quá nhanh. Hãy thử lại sau 1 phút.' });
    expect(l.message).toBe('Bạn thao tác quá nhanh. Hãy thử lại sau 1 phút.');
  });

  it('429 của NGINX (trang HTML, không có JSON): "Thử lại sau ít phút."', () => {
    const l = taoLoiTuPhanHoi(429, null);
    expect(l.ma).toBe('QUA_NHIEU_YEU_CAU');
    expect(l.message).toBe(THONG_DIEP_QUA_NHIEU);
  });

  it('502 / 503 / 504 không có JSON (API chưa chạy xong sau NGINX): câu dễ hiểu', () => {
    for (const st of [502, 503, 504]) expect(taoLoiTuPhanHoi(st, null).message).toBe(THONG_DIEP_MAY_CHU_LOI);
  });

  it('lỗi khác không có JSON: "Lỗi <mã>" như web', () => {
    const l = taoLoiTuPhanHoi(500, 'không phải object');
    expect(l.ma).toBe('LOI');
    expect(l.message).toBe('Lỗi 500');
  });

  it('thongDiep rỗng thì coi như không có', () => {
    expect(taoLoiTuPhanHoi(400, { ma: 'X', thongDiep: '  ' }).message).toBe('Lỗi 400');
  });
});

describe('lỗi mạng', () => {
  it('mất kết nối và hết thời gian chờ có status 0 và mã riêng', () => {
    expect(loiMatKetNoi().status).toBe(0);
    expect(loiMatKetNoi().ma).toBe(MA_MAT_KET_NOI);
    expect(loiMatKetNoi().message).toMatch(/^Không kết nối được máy chủ/);
    expect(loiHetThoiGian().ma).toBe(MA_HET_THOI_GIAN);
    expect(loiHetThoiGian().message).toMatch(/^Không kết nối được máy chủ/);
  });
});

describe('thongDiepLoi', () => {
  it('LoiApi: lấy câu của lỗi; lỗi lạ: câu chung', () => {
    expect(thongDiepLoi(new LoiApi(400, 'SDT_SAI', 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.')))
      .toBe('Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.');
    expect(thongDiepLoi(new TypeError('x'))).toBe('Đã có lỗi không mong muốn. Thử lại sau.');
  });
});
