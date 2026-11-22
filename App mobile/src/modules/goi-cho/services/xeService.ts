// Chép từ nha_de_xe/frontend/src/modules/goi-cho/services/xeService.ts, sửa ở web thì nhớ sửa ở đây.
// Khác web ở 2 hàm ảnh: điện thoại không có File / URL.createObjectURL của trình duyệt.
//  - taiAnhGiayDangKy nhận ảnh đã chọn (uri tệp trên máy), gửi multipart trường "anh" như web;
//  - layAnhGiayDangKy trả ảnh dạng data URI base64 (ảnh cần JWT nên không đưa thẳng URL cho <Image>).
import type { DangKyCho, PhiQuaHan, XeDuocDung, XemHuyGoi } from '../models';
import type { AnhDaChon } from '../utils/anhGiayDangKy';
import type { IHttpClient } from '@/shared/api/httpClient';

export interface IXeService {
  layDanhSach(): Promise<XeDuocDung[]>;
  them(loaiXeId: number, bienSo: string, chiaSeNhom: boolean): Promise<{ xeId: number }>;
  layLichSuGoi(xeId: number): Promise<DangKyCho[]>;
  layPhiQuaHan(xeId: number): Promise<PhiQuaHan | null>;
  traPhiQuaHan(xeId: number): Promise<PhiQuaHan>;
  xemHuyGoi(dangKyChoId: number): Promise<XemHuyGoi>;
  huyGoi(dangKyChoId: number, lyDo?: string, gopY?: string): Promise<XemHuyGoi>;
  layLyDoHuy(): Promise<string[]>;
  taiAnhGiayDangKy(xeId: number, anh: AnhDaChon): Promise<void>;
  /** Ảnh giấy đăng ký dạng "data:image/jpeg;base64,..." để hiện bằng <Image>. */
  layAnhGiayDangKy(xeId: number): Promise<string>;
}

export class ApiXeService implements IXeService {
  constructor(private readonly http: IHttpClient) {}
  layDanhSach() { return this.http.get<XeDuocDung[]>('/api/xe'); }
  them(loaiXeId: number, bienSo: string, chiaSeNhom: boolean) {
    return this.http.post<{ xeId: number }>('/api/xe', { loaiXeId, bienSo, chiaSeNhom });
  }
  layLichSuGoi(xeId: number) { return this.http.get<DangKyCho[]>(`/api/xe/${xeId}/dang-ky`); }
  async layPhiQuaHan(xeId: number) { return (await this.http.get<PhiQuaHan | undefined>(`/api/xe/${xeId}/phi-qua-han`)) ?? null; }
  traPhiQuaHan(xeId: number) { return this.http.post<PhiQuaHan>(`/api/xe/${xeId}/phi-qua-han/thanh-toan`); }
  xemHuyGoi(dangKyChoId: number) { return this.http.get<XemHuyGoi>(`/api/dang-ky-cho/${dangKyChoId}/huy`); }
  huyGoi(dangKyChoId: number, lyDo?: string, gopY?: string) {
    return this.http.post<XemHuyGoi>(`/api/dang-ky-cho/${dangKyChoId}/huy`, { lyDo: lyDo || null, gopY: gopY || null });
  }
  layLyDoHuy() { return this.http.get<string[]>('/api/dang-ky-cho/ly-do-huy'); }
  taiAnhGiayDangKy(xeId: number, anh: AnhDaChon) {
    const f = new FormData();
    // React Native: phần tệp của FormData là { uri, name, type } (fetch tự đọc tệp từ uri)
    f.append('anh', { uri: anh.uri, name: anh.ten, type: anh.kieu } as unknown as Blob);
    return this.http.putForm<void>(`/api/xe/${xeId}/giay-dang-ky`, f);
  }
  async layAnhGiayDangKy(xeId: number) {
    const blob = await this.http.getBlob(`/api/xe/${xeId}/giay-dang-ky`);
    return new Promise<string>((ok, loi) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result));
      r.onerror = () => loi(new Error('Không đọc được ảnh giấy đăng ký.'));
      r.readAsDataURL(blob);
    });
  }
}
