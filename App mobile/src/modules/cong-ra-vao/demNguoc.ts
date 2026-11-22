// Đếm ngược 60 giây của yêu cầu xác nhận xe ra. Giống DemNguoc.tsx của web: KHÔNG so đồng hồ máy với hetHanLuc của server
// (giờ điện thoại có thể lệch), mà lấy soGiayConLai server trả về + thời điểm máy nhận được, rồi đếm theo đồng hồ máy.
// Mỗi lần tải lại GET /api/ra-vao thì tính lại mốc (đồng bộ lại). Hàm thuần, có test (demNguoc.test.ts).

export const TONG_GIAY_XAC_NHAN = 60;

/** Mốc hết giờ theo đồng hồ máy (ms): lúc nhận dữ liệu + số giây còn lại server báo. */
export function mocHetTheoMay(soGiayConLai: number, nhanLucMs: number): number {
  return nhanLucMs + Math.max(0, soGiayConLai) * 1000;
}

/** Số giây còn lại hiện trên màn hình (làm tròn lên, không âm): 59.2 giây còn lại → 60, 0.1 → 1, hết → 0. */
export function soGiayCon(mocHetMs: number, bayGioMs: number): number {
  return Math.max(0, Math.ceil((mocHetMs - bayGioMs) / 1000));
}

/** Tỉ lệ còn lại 0..1 để vẽ vòng đếm ngược. */
export function tiLeCon(giayCon: number, tong = TONG_GIAY_XAC_NHAN): number {
  return Math.max(0, Math.min(1, giayCon / tong));
}
