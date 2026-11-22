// Chép từ nha_de_xe/frontend/src/modules/nhom-gia-dinh/models.ts, sửa ở web thì nhớ sửa ở đây.
export interface YeuCau { id: number; nhomId: number; taiKhoanId: number; trangThai: string; taoLuc: string }
export interface Nhom {
  id: number; ten: string; chuNhomId: number; maMoi: string | null; maHetHanLuc: string | null;
  thanhVien: { taiKhoanId: number; vaiTro: string; thamGiaLuc: string }[];
  yeuCau: YeuCau[];
}
export interface TrangThaiNhom { nhom: Nhom | null; yeuCauCuaToi: YeuCau[] }
