import type { IHttpClient } from '@/shared/api/httpClient';
import type { ChiDan, DoiSoat, KetQuaCameraKhu, TimXeCuaToi } from '../models';

/** Lời gọi API của module TimXe. Trang chỉ biết interface này. */
export interface ITimXeService {
  // Khách
  layTimXe(): Promise<TimXeCuaToi>;
  daDoXe(xeId: number, khuId: number): Promise<string>;
  // Admin
  /** "Mời vào khu X" cho màn hình cổng sau khi xe vào. null: ô tô hoặc mọi khu đã đầy. */
  layChiDan(luotGuiId: number): Promise<ChiDan | null>;
  cameraKhuBienSo(cameraId: number, bienSo: string): Promise<KetQuaCameraKhu>;
  cameraKhuAnh(cameraId: number, anh: File, bienSo?: string): Promise<KetQuaCameraKhu>;
  layDoiSoat(): Promise<DoiSoat>;
  /** khuId = null: gỡ xe khỏi khu. */
  ganKhu(luotGuiId: number, khuId: number | null): Promise<void>;
}

export class ApiTimXeService implements ITimXeService {
  constructor(private readonly http: IHttpClient) {}
  layTimXe() { return this.http.get<TimXeCuaToi>('/api/tim-xe'); }
  async daDoXe(xeId: number, khuId: number) {
    return (await this.http.post<{ thongDiep: string }>('/api/tim-xe/da-do-xe', { xeId, khuId })).thongDiep;
  }
  async layChiDan(luotGuiId: number) { return (await this.http.get<ChiDan | undefined>(`/api/admin/tim-xe/chi-dan/${luotGuiId}`)) ?? null; }
  cameraKhuBienSo(cameraId: number, bienSo: string) { return this.http.post<KetQuaCameraKhu>(`/api/admin/tim-xe/camera/${cameraId}`, { bienSo }); }
  cameraKhuAnh(cameraId: number, anh: File, bienSo?: string) {
    const f = new FormData();
    f.append('anh', anh);
    if (bienSo?.trim()) f.append('bienSo', bienSo.trim());
    return this.http.postForm<KetQuaCameraKhu>(`/api/admin/tim-xe/camera/${cameraId}/anh`, f);
  }
  layDoiSoat() { return this.http.get<DoiSoat>('/api/admin/tim-xe/doi-soat'); }
  ganKhu(luotGuiId: number, khuId: number | null) { return this.http.put<void>('/api/admin/tim-xe/gan-khu', { luotGuiId, khuId }); }
}
