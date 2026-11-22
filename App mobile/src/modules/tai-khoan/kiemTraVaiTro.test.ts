import { LoiApi } from '@/shared/models';
import { MA_KHONG_PHAI_NGUOI_DUNG, THONG_DIEP_KHONG_PHAI_NGUOI_DUNG, chiNhanNguoiDung } from './kiemTraVaiTro';
import type { PhienDangNhap } from './models';

const phien = (vaiTro: string) => ({ token: 't', id: 1, hoTen: 'An', vaiTro }) as PhienDangNhap;

describe('chiNhanNguoiDung', () => {
  it('USER: trả lại nguyên phiên', () => {
    const p = phien('USER');
    expect(chiNhanNguoiDung(p)).toBe(p);
  });

  it('ADMIN: ném LoiApi với câu "App chỉ dành cho người dùng…"', () => {
    expect.assertions(3);
    try { chiNhanNguoiDung(phien('ADMIN')); } catch (e) {
      expect(e).toBeInstanceOf(LoiApi);
      expect((e as LoiApi).ma).toBe(MA_KHONG_PHAI_NGUOI_DUNG);
      expect((e as LoiApi).message).toBe(THONG_DIEP_KHONG_PHAI_NGUOI_DUNG);
    }
  });

  it('vai trò lạ hoặc thiếu: cũng từ chối', () => {
    expect(() => chiNhanNguoiDung(phien('KHACH'))).toThrow(THONG_DIEP_KHONG_PHAI_NGUOI_DUNG);
    expect(() => chiNhanNguoiDung({} as PhienDangNhap)).toThrow(THONG_DIEP_KHONG_PHAI_NGUOI_DUNG);
  });
});
