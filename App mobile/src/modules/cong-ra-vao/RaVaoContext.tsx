import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import { yeuCauCanMo } from './chonYeuCau';
import type { RaVaoCuaToi } from './models';

/** Hỏi lại GET /api/ra-vao mỗi 3 giây khi app đang mở (giống trang Ra vào của web). */
export const CHU_KY_RA_VAO_MS = 3_000;

interface RaVaoState {
  duLieu: RaVaoCuaToi | null;
  /** Thời điểm máy nhận dữ liệu (ms): mốc để đếm ngược theo đồng hồ máy. */
  nhanLuc: number;
  loi: string | null;
  dangTai: boolean;
  taiLai: () => Promise<void>;
  /** Đánh dấu đã mở màn xác nhận của yêu cầu này (mở tay từ trang Ra vào), để không tự bật lại. */
  danhDauDaMo: (yeuCauId: number) => void;
}

const Ctx = createContext<RaVaoState | null>(null);

/**
 * Theo dõi xe ra cho cả app (chỉ chạy khi đã đăng nhập). Phát hiện yêu cầu xác nhận mới bằng CẢ HAI cách:
 * 1) SignalR "thongBao": có sự kiện bất kỳ thì tải lại ngay (trang Ra vào của web cũng tải lại với mọi sự kiện);
 * 2) hỏi lại mỗi 3 giây khi app đang mở, và tải ngay khi app từ nền trở lại (AppState).
 * Lý do cần cách 2: API chạy 2 bản sau NGINX, chưa có Redis backplane, sự kiện có thể không tới máy đang nối bản kia.
 * Có yêu cầu mới thì mở màn xac-nhan-ra/[id] đè lên mọi màn.
 */
export function RaVaoProvider({ batDau, children }: { batDau: boolean; children: ReactNode }) {
  const { services } = useAuth();
  const [duLieu, setDuLieu] = useState<RaVaoCuaToi | null>(null);
  const [nhanLuc, setNhanLuc] = useState(0);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const lanGoi = useRef(0);
  const dangChay = useRef(0); // số lần gọi chưa xong: hỏi định kỳ thì bỏ qua nếu lần trước chưa xong (mạng chậm)
  const daMo = useRef(new Set<number>());

  const taiLai = useCallback(async () => {
    if (!batDau) return;
    const lan = ++lanGoi.current;
    dangChay.current++;
    setDangTai(true);
    try {
      const d = await services.congRaVao.layRaVaoCuaToi();
      if (lan !== lanGoi.current) return;
      setDuLieu(d); setNhanLuc(Date.now()); setLoi(null);
    } catch (e) {
      if (lan === lanGoi.current) setLoi(thongDiepLoi(e)); // giữ dữ liệu cũ: lỗi mạng thoáng qua không xoá màn hình
    } finally {
      dangChay.current--;
      if (lan === lanGoi.current) setDangTai(false);
    }
  }, [services, batDau]);

  // Đăng xuất / đổi tài khoản: xoá dữ liệu của người trước
  useEffect(() => {
    if (batDau) { void taiLai(); return; }
    lanGoi.current++;
    setDuLieu(null); setLoi(null); setDangTai(false); daMo.current.clear();
  }, [batDau, taiLai]);

  useEffect(() => {
    if (!batDau) return;
    const id = setInterval(() => {
      if (AppState.currentState === 'active' && dangChay.current === 0) void taiLai();
    }, CHU_KY_RA_VAO_MS);
    const sub = AppState.addEventListener('change', (tt) => { if (tt === 'active') void taiLai(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [batDau, taiLai]);

  useNgheThongBao(() => { void taiLai(); });

  // Yêu cầu mới → mở màn xác nhận 60 giây (mỗi yêu cầu tự bật một lần)
  useEffect(() => {
    if (!duLieu) return;
    const y = yeuCauCanMo(duLieu.dangCho, daMo.current);
    if (!y) return;
    daMo.current.add(y.id);
    router.push({ pathname: '/xac-nhan-ra/[id]', params: { id: String(y.id) } });
  }, [duLieu]);

  const danhDauDaMo = useCallback((id: number) => { daMo.current.add(id); }, []);

  const value = useMemo(() => ({ duLieu, nhanLuc, loi, dangTai, taiLai, danhDauDaMo }), [duLieu, nhanLuc, loi, dangTai, taiLai, danhDauDaMo]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRaVao() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRaVao phải nằm trong RaVaoProvider');
  return v;
}
