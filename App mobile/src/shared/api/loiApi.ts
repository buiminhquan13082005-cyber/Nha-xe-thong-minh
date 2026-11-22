import { LoiApi } from '../models';

// Hàm thuần: đổi phản hồi lỗi / lỗi mạng thành LoiApi có câu tiếng Việt cho người dùng. Có test (loiApi.test.ts).

export const MA_MAT_KET_NOI = 'MAT_KET_NOI';
export const MA_HET_THOI_GIAN = 'HET_THOI_GIAN';

export const THONG_DIEP_MAT_KET_NOI =
  'Không kết nối được máy chủ. Kiểm tra điện thoại và máy tính cùng Wi-Fi, Docker đang chạy, địa chỉ trong mobile/.env đúng.';
export const THONG_DIEP_HET_THOI_GIAN = 'Không kết nối được máy chủ: chờ quá lâu không thấy trả lời. Thử lại sau.';
export const THONG_DIEP_QUA_NHIEU = 'Thử lại sau ít phút.';
export const THONG_DIEP_MAY_CHU_LOI = 'Máy chủ đang khởi động hoặc gặp sự cố. Thử lại sau ít phút.';

export const loiMatKetNoi = () => new LoiApi(0, MA_MAT_KET_NOI, THONG_DIEP_MAT_KET_NOI);
export const loiHetThoiGian = () => new LoiApi(0, MA_HET_THOI_GIAN, THONG_DIEP_HET_THOI_GIAN);

const laChuoi = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/**
 * Phản hồi HTTP lỗi → LoiApi. Server có { ma, thongDiep } thì luôn dùng thongDiep của server.
 * Không có JSON (NGINX tự trả 429 / 502 dạng HTML) thì dùng câu dự phòng theo mã HTTP.
 */
export function taoLoiTuPhanHoi(status: number, data: unknown): LoiApi {
  const d = (data && typeof data === 'object' ? data : {}) as { ma?: unknown; thongDiep?: unknown };
  const ma = laChuoi(d.ma) ? d.ma : status === 429 ? 'QUA_NHIEU_YEU_CAU' : 'LOI';
  if (laChuoi(d.thongDiep)) return new LoiApi(status, ma, d.thongDiep);
  if (status === 429) return new LoiApi(status, ma, THONG_DIEP_QUA_NHIEU);
  if (status === 502 || status === 503 || status === 504) return new LoiApi(status, ma, THONG_DIEP_MAY_CHU_LOI);
  return new LoiApi(status, ma, `Lỗi ${status}`);
}

/** Câu hiện lên màn hình cho một lỗi bất kỳ bắt được trong try/catch. */
export function thongDiepLoi(e: unknown): string {
  if (e instanceof LoiApi) return e.message;
  return 'Đã có lỗi không mong muốn. Thử lại sau.';
}
