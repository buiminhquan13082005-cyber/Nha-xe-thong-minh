// Chép từ nha_de_xe/frontend/src/shared/realtime/useNgheThongBao.ts, sửa ở web thì nhớ sửa ở đây.
import { useEffect, useRef } from 'react';
import { useAuth } from '@/shared/auth/AuthContext';
import type { SuKienThoiGianThuc } from './thoiGianThuc';

/** Gọi fn mỗi khi server đẩy một thông báo (giữ fn mới nhất, không đăng ký lại mỗi lần render). */
export function useNgheThongBao(fn: (s: SuKienThoiGianThuc) => void) {
  const { services } = useAuth();
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => services.thoiGianThuc.nghe((s) => ref.current(s)), [services]);
}
