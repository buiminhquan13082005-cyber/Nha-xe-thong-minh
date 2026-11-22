// Chép từ nha_de_xe/frontend/src/shared/models.ts, sửa ở web thì nhớ sửa ở đây.
// Kiểu dùng chung cho mọi module (khớp DTO của API, tên trường camelCase).

export type VaiTro = 'ADMIN' | 'USER';

export type LoaiXeMa = 'O_TO' | 'XE_MAY';

/** Lỗi API trả về: { ma, thongDiep }. status = 0: không tới được máy chủ (mất mạng, hết thời gian chờ). */
export class LoiApi extends Error {
  constructor(public status: number, public ma: string, thongDiep: string) {
    super(thongDiep);
    this.name = 'LoiApi';
    Object.setPrototypeOf(this, LoiApi.prototype); // giữ instanceof đúng khi Babel chuyển class
  }
}
