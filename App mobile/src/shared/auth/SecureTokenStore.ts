import * as SecureStore from 'expo-secure-store';
import type { ITokenStore } from '@/shared/api/httpClient';
import type { PhienDangNhap } from '@/modules/tai-khoan/models';

const KHOA = 'nhaxe.phien';

type NguoiNghe = (p: PhienDangNhap | null, thongDiep?: string) => void;

/** Đọc chuỗi đã lưu; hỏng / thiếu trường thì coi như chưa đăng nhập. */
export function docPhien(s: string | null): PhienDangNhap | null {
  if (!s) return null;
  try {
    const p = JSON.parse(s) as Partial<PhienDangNhap>;
    return typeof p.token === 'string' && p.token && typeof p.id === 'number' && (p.vaiTro === 'USER' || p.vaiTro === 'ADMIN')
      ? { token: p.token, id: p.id, hoTen: p.hoTen ?? '', vaiTro: p.vaiTro }
      : null;
  } catch {
    return null;
  }
}

/**
 * Lưu phiên đăng nhập trong expo-secure-store (Keychain / Keystore, KHÔNG dùng AsyncStorage cho token).
 * SecureStore là bất đồng bộ, còn ITokenStore.layToken() đồng bộ như web: đọc một lần lúc mở app (napLai)
 * rồi giữ bản sao trong bộ nhớ. Báo cho giao diện khi phiên đổi (đăng nhập, đăng xuất, hết phiên).
 */
export class SecureTokenStore implements ITokenStore {
  private phien: PhienDangNhap | null = null;
  private readonly nguoiNghe = new Set<NguoiNghe>();

  async napLai(): Promise<PhienDangNhap | null> {
    try { this.phien = docPhien(await SecureStore.getItemAsync(KHOA)); } catch { this.phien = null; }
    return this.phien;
  }

  doc() { return this.phien; }

  async luu(p: PhienDangNhap | null, thongDiep?: string) {
    this.phien = p; // cập nhật bộ nhớ trước: lời gọi API ngay sau đó dùng đúng token
    this.nguoiNghe.forEach((fn) => fn(p, thongDiep));
    try {
      if (p) await SecureStore.setItemAsync(KHOA, JSON.stringify(p));
      else await SecureStore.deleteItemAsync(KHOA);
    } catch { /* máy không lưu được: phiên vẫn dùng được tới khi tắt app */ }
  }

  dangKyNghe(fn: NguoiNghe) {
    this.nguoiNghe.add(fn);
    return () => { this.nguoiNghe.delete(fn); };
  }

  layToken() { return this.phien?.token ?? null; }
  khiHetPhien(thongDiep: string) { void this.luu(null, thongDiep); }
}
