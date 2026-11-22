// Chép từ nha_de_xe/frontend/src/modules/tim-xe/services/timXeService.ts (chỉ phần Khách), sửa ở web thì nhớ sửa ở đây.
// Không chép các hàm Admin (chỉ dẫn cổng, camera khu, gán khu, đi sai khu).
import type { IHttpClient } from '@/shared/api/httpClient';
import type { SoXeKhu, TimXeCuaToi } from '../models';

export interface ITimXeService {
  layTimXe(): Promise<TimXeCuaToi>;
  daDoXe(xeId: number, khuId: number): Promise<string>;
  /** Sơ đồ chỗ trống: Admin và khách cùng xem. */
  laySoXeKhu(): Promise<SoXeKhu>;
}

export class ApiTimXeService implements ITimXeService {
  constructor(private readonly http: IHttpClient) {}
  layTimXe() { return this.http.get<TimXeCuaToi>('/api/tim-xe'); }
  async daDoXe(xeId: number, khuId: number) {
    return (await this.http.post<{ thongDiep: string }>('/api/tim-xe/da-do-xe', { xeId, khuId })).thongDiep;
  }
  laySoXeKhu() { return this.http.get<SoXeKhu>('/api/so-xe-khu'); }
}
