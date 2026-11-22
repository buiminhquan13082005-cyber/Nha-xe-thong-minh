import type { YeuCauXacNhan } from './models';

/**
 * Yêu cầu xác nhận xe ra cần mở màn hình 60 giây: chưa ai trả lời (người dùng xe lẫn quản lý), còn giờ,
 * và chưa từng mở trên máy này (mỗi yêu cầu chỉ tự bật một lần; đóng rồi thì mở lại từ trang Ra vào).
 * Nhiều yêu cầu cùng lúc: yêu cầu sắp hết giờ nhất trước. Hàm thuần, có test.
 */
export function yeuCauCanMo(dangCho: YeuCauXacNhan[], daMo: ReadonlySet<number>): YeuCauXacNhan | null {
  return dangCho
    .filter((y) => y.nguoiDungXeDongY === null && y.quanLyDongY === null && y.soGiayConLai > 0 && !daMo.has(y.id))
    .sort((a, b) => a.soGiayConLai - b.soGiayConLai)[0] ?? null;
}
