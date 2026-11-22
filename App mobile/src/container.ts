import { API_URL } from '@/shared/api/cauHinh';
import { FetchHttpClient } from '@/shared/api/httpClient';
import { ApiHeThongService, type IHeThongService } from '@/shared/api/heThongService';
import { SecureTokenStore } from '@/shared/auth/SecureTokenStore';
import { ApiAuthService, type IAuthService } from '@/modules/tai-khoan/services/authService';
import { ApiNhomGiaDinhService, type INhomGiaDinhService } from '@/modules/nhom-gia-dinh/services/nhomGiaDinhService';
import { ApiXeService, type IXeService } from '@/modules/goi-cho/services/xeService';
import { ApiGoiChoService, type IGoiChoService } from '@/modules/goi-cho/services/goiChoService';
import { ApiCongRaVaoService, type ICongRaVaoService } from '@/modules/cong-ra-vao/services/congRaVaoService';
import { ApiTimXeService, type ITimXeService } from '@/modules/tim-xe/services/timXeService';
import { ApiDieuHuongService, type IDieuHuongService } from '@/modules/tim-xe/services/dieuHuongService';
import { ApiThongBaoService, type IThongBaoService } from '@/modules/thong-bao/services/thongBaoService';
import { SignalRKenh, type IKenhThoiGianThuc } from '@/shared/realtime/thoiGianThuc';

/**
 * Composition root (giống nha_de_xe/frontend/src/app/container.ts): nơi DUY NHẤT chọn cài đặt cụ thể cho từng interface.
 * Màn hình chỉ biết interface. Mỗi trang làm xong thì thêm service của module đó vào đây.
 */
export interface Services {
  phien: SecureTokenStore;
  heThong: IHeThongService;
  // module TaiKhoan
  auth: IAuthService;
  nhomGiaDinh: INhomGiaDinhService;
  // module GoiCho
  xe: IXeService;
  goiCho: IGoiChoService;
  // module CongRaVao
  congRaVao: ICongRaVaoService;
  // module TimXe
  timXe: ITimXeService;
  /** Điều hướng trong bãi: phiên dẫn đường, đổi khu đích, đường đi từ cổng. */
  dieuHuong: IDieuHuongService;
  // module ThongBao
  thongBao: IThongBaoService;
  /** Kênh SignalR: thông báo tới ngay, màn hình tải lại sớm hơn chu kỳ. */
  thoiGianThuc: IKenhThoiGianThuc;
}

export function taoServices(): Services {
  const phien = new SecureTokenStore();
  const http = new FetchHttpClient(phien, API_URL ?? '');
  return {
    phien,
    heThong: new ApiHeThongService(http),
    auth: new ApiAuthService(http),
    nhomGiaDinh: new ApiNhomGiaDinhService(http),
    xe: new ApiXeService(http),
    goiCho: new ApiGoiChoService(http),
    congRaVao: new ApiCongRaVaoService(http),
    timXe: new ApiTimXeService(http),
    dieuHuong: new ApiDieuHuongService(http),
    thongBao: new ApiThongBaoService(http),
    thoiGianThuc: new SignalRKenh(API_URL ?? ''),
  };
}
