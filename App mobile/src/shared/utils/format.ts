// Chép từ nha_de_xe/frontend/src/shared/utils/format.ts, sửa ở web thì nhớ sửa ở đây.
// Khác web: đọc ngày bằng docNgay() (giờ VN), và tự nhóm chữ số thay cho Intl (Hermes trên vài máy Android thiếu dữ liệu locale).
import type { LoaiXeMa } from '../models';
import { dinhDangNgay, docNgay } from './ngayGio';

export { dinhDangNgay };

/** 150000 → "150.000 đ" (giống Intl vi-VN của web). */
export function dinhDangTien(so: number): string {
  const am = so < 0;
  const nguyen = Math.round(Math.abs(so)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${am ? '-' : ''}${nguyen} đ`;
}

export const tenLoaiXe = (l: LoaiXeMa | number) => (l === 'O_TO' || l === 1 ? 'Ô tô' : 'Xe máy');

/** 30A12345 -> 30A-123.45 ; 29B112345 -> 29B1-123.45 */
export function hienThiBienSo(bs: string): string {
  const m = /^(\d{2}[A-Z]{1,2})(\d+)$/.exec(bs);
  if (!m) return bs;
  const so = m[2];
  if (so.length >= 5) {
    const dau = m[1] + so.slice(0, so.length - 5);
    const cuoi = so.slice(-5);
    return `${dau}-${cuoi.slice(0, 3)}.${cuoi.slice(3)}`;
  }
  return `${m[1]}-${so}`;
}

/** Thời gian còn lại tới một mốc, dạng ngắn: "Còn 12 ngày 3 giờ", "Còn 5 giờ", "Quá hạn 2 ngày". */
export function conLai(iso: string | null, bayGio = Date.now()): string {
  const moc = docNgay(iso);
  if (!moc) return 'Không có gói';
  const ms = moc.getTime() - bayGio;
  const qua = ms <= 0;
  const gio = Math.floor(Math.abs(ms) / 3_600_000);
  const ngay = Math.floor(gio / 24);
  const chu = ngay > 0 ? `${ngay} ngày${gio % 24 ? ` ${gio % 24} giờ` : ''}` : gio > 0 ? `${gio} giờ` : 'dưới 1 giờ';
  return qua ? `Quá hạn ${chu}` : `Còn ${chu}`;
}

/** Chuẩn hoá chuỗi tìm biển số giống cách backend lưu: viết hoa, bỏ dấu chấm / gạch / khoảng trắng. */
export const chuanHoaBienSo = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]/g, '');
