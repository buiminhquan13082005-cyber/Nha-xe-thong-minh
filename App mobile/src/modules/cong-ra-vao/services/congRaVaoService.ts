// Chép từ nha_de_xe/frontend/src/modules/cong-ra-vao/services/congRaVaoService.ts (chỉ phần Khách), sửa ở web thì nhớ sửa ở đây.
// App chỉ dành cho người dùng: không chép các hàm Admin (màn hình cổng, camera, mở barie tay).
import type { RaVaoCuaToi } from '../models';
import type { IHttpClient } from '@/shared/api/httpClient';

export interface ICongRaVaoService {
  layRaVaoCuaToi(): Promise<RaVaoCuaToi>;
  /** dongY = true: "Đúng là tôi"; false: "Không phải tôi" (báo nghi mất xe). Ai trả lời trước thì tính. */
  nguoiDungXeTraLoi(yeuCauId: number, dongY: boolean): Promise<void>;
}

export class ApiCongRaVaoService implements ICongRaVaoService {
  constructor(private readonly http: IHttpClient) {}
  layRaVaoCuaToi() { return this.http.get<RaVaoCuaToi>('/api/ra-vao'); }
  nguoiDungXeTraLoi(id: number, dongY: boolean) { return this.http.put<void>(`/api/ra-vao/yeu-cau/${id}`, { dongY }); }
}
