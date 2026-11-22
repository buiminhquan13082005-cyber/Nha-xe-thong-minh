import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { taoServices, type Services } from '@/container';
import { chiNhanNguoiDung } from '@/modules/tai-khoan/kiemTraVaiTro';
import type { PhienDangNhap } from '@/modules/tai-khoan/models';

interface AuthState {
  services: Services;
  /** true khi đang đọc phiên đã lưu lúc mở app (chưa biết đã đăng nhập hay chưa). */
  dangNap: boolean;
  phien: PhienDangNhap | null;
  /** Câu của server khi phiên bị huỷ (đăng nhập ở máy khác...), hiện ở màn đăng nhập. */
  thongBaoPhien: string | null;
  /**
   * Đăng nhập; vai trò khác USER thì ném lỗi và KHÔNG lưu token.
   * trangSau: màn mở ngay sau khi đăng nhập (đăng ký xong thì vào tab Xe như web); không truyền thì vào Trang chủ.
   */
  dangNhap: (sdt: string, matKhau: string, trangSau?: TrangSauDangNhap) => Promise<PhienDangNhap>;
  /** Màn app/_layout.tsx chuyển tới khi phiên vừa có (redirectTo của nhóm (auth)). */
  trangSauDangNhap: TrangSauDangNhap;
  /** Báo server huỷ phiên rồi xoá token trên máy (xoá cả khi server lỗi, để không kẹt phiên). */
  dangXuat: () => Promise<void>;
}

/** Các màn được mở thẳng sau khi đăng nhập. */
export type TrangSauDangNhap = '/' | '/xe';

const Ctx = createContext<AuthState | null>(null);

/**
 * Giữ phiên đăng nhập cho cả app. Màn hình chỉ gọi useAuth(), không biết tới fetch hay SecureStore (DIP).
 * Phiên đổi (đăng nhập, đăng xuất, 401) thì app/_layout.tsx tự chuyển màn bằng Stack.Protected.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const services = useMemo(taoServices, []);
  const [dangNap, setDangNap] = useState(true);
  const [phien, setPhien] = useState<PhienDangNhap | null>(null);
  const [thongBaoPhien, setThongBaoPhien] = useState<string | null>(null);
  const [trangSauDangNhap, setTrangSauDangNhap] = useState<TrangSauDangNhap>('/');

  useEffect(() => {
    const huy = services.phien.dangKyNghe((p, tb) => { setPhien(p); setThongBaoPhien(tb ?? null); });
    let conMo = true;
    void services.phien.napLai().then((p) => { if (conMo) { setPhien(p); setDangNap(false); } });
    return () => { conMo = false; huy(); };
  }, [services]);

  // Có phiên thì nối kênh thời gian thực (SignalR), đăng xuất / hết phiên thì ngắt (giống AppContext của web)
  const token = phien?.token ?? null;
  useEffect(() => {
    if (!token) return;
    services.thoiGianThuc.ketNoi(() => services.phien.layToken());
    return () => services.thoiGianThuc.ngat();
  }, [services, token]);

  const value = useMemo<AuthState>(() => ({
    services, dangNap, phien, thongBaoPhien, trangSauDangNhap,
    dangNhap: async (sdt, matKhau, trangSau = '/') => {
      const p = chiNhanNguoiDung(await services.auth.dangNhap(sdt, matKhau));
      setTrangSauDangNhap(trangSau); // đặt trước khi có phiên: cùng lượt render với phien mới
      await services.phien.luu(p);
      return p;
    },
    dangXuat: async () => {
      try { await services.auth.dangXuat(); } catch { /* mất mạng / phiên đã hết: vẫn xoá trên máy */ }
      await services.phien.luu(null);
    },
  }), [services, dangNap, phien, thongBaoPhien, trangSauDangNhap]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth phải nằm trong AuthProvider');
  return v;
}
