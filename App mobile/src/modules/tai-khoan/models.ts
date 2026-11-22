// Chép từ nha_de_xe/frontend/src/modules/tai-khoan/models.ts, sửa ở web thì nhớ sửa ở đây.
// Module TaiKhoan: phiên đăng nhập.
import type { VaiTro } from '@/shared/models';

export interface PhienDangNhap {
  token: string;
  id: number;
  hoTen: string;
  vaiTro: VaiTro;
}
