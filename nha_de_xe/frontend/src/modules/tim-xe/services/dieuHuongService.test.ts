import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/shared/api/httpClient';
import { ApiDieuHuongService } from './dieuHuongService';
import { GiaDieuHuongService } from './dieuHuongGia';
import type { KhuCho } from '../models';

function httpGia() {
  const get = vi.fn(async () => ({ tuKhuId: 10, tongMet: 120, diem: [] }));
  return { http: { get } as unknown as IHttpClient, get };
}

describe('ApiDieuHuongService: đường ra', () => {
  it('layDuongRaXeToi không có xeId: gọi duong-ra không kèm tham số (server tự biết khu xe đang đỗ)', async () => {
    const { http, get } = httpGia();
    await new ApiDieuHuongService(http).layDuongRaXeToi();
    expect(get).toHaveBeenCalledWith('/api/dieu-huong/duong-ra');
  });

  it('layDuongRaXeToi có xeId: thêm ?xeId=', async () => {
    const { http, get } = httpGia();
    await new ApiDieuHuongService(http).layDuongRaXeToi(45);
    expect(get).toHaveBeenCalledWith('/api/dieu-huong/duong-ra?xeId=45');
  });

  it('layDuongRa cũ giữ nguyên ?tuKhu= (màn đường ra toàn màn hình, app điện thoại)', async () => {
    const { http, get } = httpGia();
    await new ApiDieuHuongService(http).layDuongRa(12);
    expect(get).toHaveBeenCalledWith('/api/dieu-huong/duong-ra?tuKhu=12');
  });
});

describe('GiaDieuHuongService: đường ra xe của tôi', () => {
  const hamB = { id: 12, ten: 'Hầm xe máy B1/B2', loaiXeId: 2, sucChua: 20, soXe: 0, soGiu: 0, conLai: 20, khoangCachTuCong: 90, maSoDo: 'HAM' } as KhuCho;

  it('xe đang ở khu: trả đường từ khu đó, điểm cuối là cổng ra', async () => {
    const s = new GiaDieuHuongService(async () => [hamB], async () => 12);
    const d = await s.layDuongRaXeToi(2);
    expect(d.tuKhuId).toBe(12);
    expect(d.diem.length).toBeGreaterThan(1);
    expect(d.tongMet).toBeGreaterThan(0);
  });

  it('xe chưa ở khu: báo lỗi', async () => {
    const s = new GiaDieuHuongService(async () => [hamB], async () => null);
    await expect(s.layDuongRaXeToi(2)).rejects.toThrow(/chưa được ghi nhận ở khu/);
  });
});
