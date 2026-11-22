import type { IHttpClient } from './httpClient';

/** GET /api/health (không cần đăng nhập): { trangThai: "OK", instance } — instance là tên container API đã trả lời. */
export interface TrangThaiMayChu { trangThai: string; instance: string }

export interface IHeThongService {
  kiemTraKetNoi(): Promise<TrangThaiMayChu>;
}

export class ApiHeThongService implements IHeThongService {
  constructor(private readonly http: IHttpClient) {}
  kiemTraKetNoi() { return this.http.get<TrangThaiMayChu>('/api/health'); }
}
