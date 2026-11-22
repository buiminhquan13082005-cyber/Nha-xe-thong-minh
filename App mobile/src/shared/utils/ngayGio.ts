// Ngày giờ từ API (GioDiaPhuongJson ở backend): "2026-11-19T21:30:05.123", là GIỜ VIỆT NAM và KHÔNG kèm múi giờ.
// new Date(chuoi) sẽ hiểu đó là giờ theo múi giờ của điện thoại: đúng nếu máy đặt giờ VN, lệch nếu máy đặt múi khác.
// Ở đây luôn hiểu là UTC+7 (Việt Nam không có giờ mùa hè), nên mọi điện thoại cho cùng một thời điểm.

const LECH_VN_MS = 7 * 3_600_000;

const MAU = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?)?(Z|[+-]\d{2}:?\d{2})?$/i;

/**
 * Đọc chuỗi ngày giờ của API thành Date (đúng thời điểm tuyệt đối). Không có múi giờ: hiểu là giờ Việt Nam.
 * Có "Z" hoặc "+hh:mm" thì theo đúng múi giờ ghi trong chuỗi. Chuỗi rỗng / sai dạng: null.
 */
export function docNgay(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = MAU.exec(s.trim());
  if (!m) return null;
  const [, nam, thang, ngay, gio = '0', phut = '0', giay = '0', phanGiay = '0', mui] = m;
  const n = { nam: +nam, thang: +thang, ngay: +ngay, gio: +gio, phut: +phut, giay: +giay };
  if (n.thang < 1 || n.thang > 12 || n.ngay < 1 || n.ngay > 31 || n.gio > 23 || n.phut > 59 || n.giay > 59) return null;
  const ms = Number(phanGiay.padEnd(3, '0').slice(0, 3));
  const utc = Date.UTC(n.nam, n.thang - 1, n.ngay, n.gio, n.phut, n.giay, ms);
  if (new Date(utc).getUTCDate() !== n.ngay) return null; // 31/02 và các ngày không có thật
  return new Date(utc - lechCua(mui));
}

function lechCua(mui: string | undefined): number {
  if (!mui) return LECH_VN_MS;
  if (mui.toUpperCase() === 'Z') return 0;
  const dau = mui[0] === '-' ? -1 : 1;
  const so = mui.slice(1).replace(':', '');
  return dau * (Number(so.slice(0, 2)) * 60 + Number(so.slice(2, 4))) * 60_000;
}

const hai = (x: number) => String(x).padStart(2, '0');

/** "19/11/2026 21:30" theo giờ Việt Nam (không dùng Intl: Hermes trên một số máy Android thiếu dữ liệu múi giờ). null: "—". */
export function dinhDangNgay(s: string | null | undefined): string {
  const d = docNgay(s);
  if (!d) return '—';
  const vn = new Date(d.getTime() + LECH_VN_MS); // đọc các thành phần UTC của mốc đã cộng 7 giờ = giờ VN
  return `${hai(vn.getUTCDate())}/${hai(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${hai(vn.getUTCHours())}:${hai(vn.getUTCMinutes())}`;
}
