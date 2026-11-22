// Chép từ nha_de_xe/frontend/src/shared/api/httpClient.ts, sửa ở web thì nhớ sửa ở đây.
// Khác web: địa chỉ gốc tuyệt đối (điện thoại không có "cùng origin"), có thời gian chờ tối đa,
// lỗi mạng đổi thành LoiApi "Không kết nối được máy chủ" để màn hình không bị treo hay trắng.
import { loiHetThoiGian, loiMatKetNoi, taoLoiTuPhanHoi } from './loiApi';

/** Interface gọi HTTP (DIP): service phụ thuộc interface này, không gọi fetch trực tiếp. */
export interface IHttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: unknown): Promise<T>;
  put<T>(url: string, body?: unknown): Promise<T>;
  del<T>(url: string): Promise<T>;
  /** Gửi multipart/form-data (tải tệp). */
  putForm<T>(url: string, form: FormData): Promise<T>;
  postForm<T>(url: string, form: FormData): Promise<T>;
  /** Lấy tệp nhị phân (ảnh) có kèm JWT. */
  getBlob(url: string): Promise<Blob>;
}

export interface ITokenStore {
  /** Đồng bộ như web: SecureTokenStore đọc SecureStore một lần lúc mở app rồi giữ trong bộ nhớ. */
  layToken(): string | null;
  /** Gọi khi API báo 401: phiên hết hạn hoặc đã đăng nhập ở máy khác. */
  khiHetPhien(thongDiep: string): void;
}

/** Cài đặt bằng fetch: tự gắn JWT, tự đổi lỗi { ma, thongDiep } thành LoiApi. */
export class FetchHttpClient implements IHttpClient {
  constructor(
    private readonly tokens: ITokenStore,
    private readonly goc: string,
    private readonly thoiGianChoMs = 10_000,
  ) {}

  get<T>(url: string) { return this.goi<T>('GET', url); }
  post<T>(url: string, body?: unknown) { return this.goi<T>('POST', url, body); }
  put<T>(url: string, body?: unknown) { return this.goi<T>('PUT', url, body); }
  del<T>(url: string) { return this.goi<T>('DELETE', url); }
  putForm<T>(url: string, form: FormData) { return this.goi<T>('PUT', url, form); }
  postForm<T>(url: string, form: FormData) { return this.goi<T>('POST', url, form); }
  async getBlob(url: string) {
    const res = await this.guiYeuCau('GET', url);
    if (!res.ok) await this.nemLoi(res);
    return res.blob();
  }

  private async guiYeuCau(method: string, url: string, body?: unknown): Promise<Response> {
    const token = this.tokens.layToken();
    const laForm = typeof FormData !== 'undefined' && body instanceof FormData; // FormData: để fetch tự đặt Content-Type kèm boundary
    const huy = new AbortController();
    const hen = setTimeout(() => huy.abort(), this.thoiGianChoMs);
    try {
      return await fetch(this.goc + url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && !laForm ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : laForm ? (body as FormData) : JSON.stringify(body),
        signal: huy.signal,
      });
    } catch (e) {
      if (__DEV__) console.warn(`[http] ${method} ${this.goc + url} lỗi:`, String(e), laForm ? '(multipart)' : '');
      // fetch chỉ ném khi không tới được máy chủ (sai IP, khác Wi-Fi, Docker tắt, tường lửa chặn) hoặc bị huỷ do quá giờ
      throw huy.signal.aborted ? loiHetThoiGian() : loiMatKetNoi();
    } finally {
      clearTimeout(hen);
    }
  }

  private async nemLoi(res: Response): Promise<never> {
    const data = await res.json().catch(() => null);
    const loi = taoLoiTuPhanHoi(res.status, data);
    if (res.status === 401 && this.tokens.layToken()) this.tokens.khiHetPhien(loi.message);
    throw loi;
  }

  private async goi<T>(method: string, url: string, body?: unknown): Promise<T> {
    const res = await this.guiYeuCau(method, url, body);
    if (!res.ok) await this.nemLoi(res);
    if (res.status === 204) return undefined as T;
    return (await res.json().catch(() => null)) as T;
  }
}
