import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/shared/auth/AuthContext';
import type { SuKienThoiGianThuc } from '@/shared/realtime/thoiGianThuc';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';
import { LOI_KHONG_MO_DUOC } from '@/shared/ui/useDichDen';
import { bo, bong, chu, khoang, mau } from '@/shared/theme';
import { duongDanCho, nhanHanhDong, type ThongBaoDich } from './dichDen';

/** Tải lại số chưa đọc mỗi 15 giây (giống Layout.tsx của web), ngoài lúc có SignalR / mở lại app. */
const CHU_KY_SO_CHUA_DOC_MS = 15_000;
const THE_NOI_MS = 6_000;

interface ThongBaoState {
  soChuaDoc: number;
  taiSoChuaDoc: () => Promise<void>;
  /**
   * Bấm một thông báo (dòng trong hộp thư hoặc thẻ nổi): đánh dấu đã đọc → mở màn đích (dichDen.ts).
   * Có hành động mà không mở được → về hộp thư, báo "Không mở được nội dung này". Trả về true nếu đã chuyển màn.
   */
  moThongBao: (tb: ThongBaoDich & { id?: number | null; daDoc?: boolean }) => Promise<boolean>;
}

const Ctx = createContext<ThongBaoState | null>(null);

/**
 * Thông báo cho cả app (chỉ chạy khi đã đăng nhập): số chưa đọc cho biểu tượng tab, thẻ nổi khi SignalR đẩy thông báo mới
 * (giống thẻ nổi trong Layout.tsx của web, tự ẩn sau 6 giây, bấm để mở màn liên quan).
 */
export function ThongBaoProvider({ batDau, children }: { batDau: boolean; children: ReactNode }) {
  const { services } = useAuth();
  const [soChuaDoc, setSoChuaDoc] = useState(0);
  const [moi, setMoi] = useState<(SuKienThoiGianThuc & { khoa: number }) | null>(null);
  const insets = useSafeAreaInsets();
  const dangXacNhanRa = usePathname().startsWith('/xac-nhan-ra'); // không che màn xác nhận xe ra 60 giây

  // Số thứ tự lần gọi: kết quả về muộn (gọi trước khi đăng xuất / trước lần gọi mới hơn) thì bỏ, không ghi đè
  const lanGoi = useRef(0);
  const taiSoChuaDoc = useCallback(async () => {
    if (!batDau) return;
    const lan = ++lanGoi.current;
    try {
      const so = await services.thongBao.soChuaDoc();
      if (lan === lanGoi.current) setSoChuaDoc(so);
    } catch { /* lỗi mạng: giữ số cũ */ }
  }, [services, batDau]);

  useEffect(() => {
    if (!batDau) { lanGoi.current++; setSoChuaDoc(0); setMoi(null); return; }
    void taiSoChuaDoc();
    const id = setInterval(() => { if (AppState.currentState === 'active') void taiSoChuaDoc(); }, CHU_KY_SO_CHUA_DOC_MS);
    const sub = AppState.addEventListener('change', (tt) => { if (tt === 'active') void taiSoChuaDoc(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [batDau, taiSoChuaDoc]);

  useNgheThongBao((s) => {
    if (!batDau) return;
    void taiSoChuaDoc();
    // Tín hiệu không lưu hộp thư (không có id, ví dụ DIEU_HUONG) thì không hiện thẻ nổi
    if (s.id) setMoi({ ...s, khoa: Date.now() });
  });

  useEffect(() => {
    if (!moi) return;
    const t = setTimeout(() => setMoi(null), THE_NOI_MS);
    return () => clearTimeout(t);
  }, [moi]);

  const moThongBao = useCallback(async (tb: ThongBaoDich & { id?: number | null; daDoc?: boolean }) => {
    if (tb.id && !tb.daDoc) {
      try { await services.thongBao.danhDauDaDoc(tb.id); } catch { /* lỗi mạng: vẫn mở màn, lần tải sau đánh dấu lại */ }
      void taiSoChuaDoc();
    }
    const dich = duongDanCho(tb);
    // mo=<thời điểm>: mỗi lần bấm là một tham số mới, màn đích (kể cả tab đang mở sẵn) chạy lại việc cuộn / tô sáng / mở
    if (dich) { router.push(`${dich}${dich.includes('?') ? '&' : '?'}mo=${Date.now()}` as never); return true; }
    if (tb.hanhDong) { router.navigate({ pathname: '/thong-bao', params: { loi: LOI_KHONG_MO_DUOC, mo: String(Date.now()) } }); return true; }
    return false;
  }, [services, taiSoChuaDoc]);

  const value = useMemo(() => ({ soChuaDoc, taiSoChuaDoc, moThongBao }), [soChuaDoc, taiSoChuaDoc, moThongBao]);
  const viec = moi ? nhanHanhDong(moi) : null;

  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {moi && !dangXacNhanRa && (
          <Pressable
            key={moi.khoa}
            accessibilityRole="button" accessibilityLiveRegion="polite"
            accessibilityLabel={`Thông báo mới: ${moi.noiDung}`}
            onPress={async () => {
              const s = moi; setMoi(null);
              if (!(await moThongBao({ ...s, daDoc: false }))) router.navigate('/thong-bao');
            }}
            style={[st.theNoi, { top: insets.top + khoang.s }]}
          >
            <Text style={st.nhan}>THÔNG BÁO MỚI</Text>
            <Text style={st.noiDung} numberOfLines={3}>{moi.noiDung}</Text>
            {viec && <Text style={st.viec}>{viec} →</Text>}
          </Pressable>
        )}
      </View>
    </Ctx.Provider>
  );
}

export function useThongBao() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useThongBao phải nằm trong ThongBaoProvider');
  return v;
}

const st = StyleSheet.create({
  theNoi: {
    position: 'absolute', left: khoang.m, right: khoang.m, padding: khoang.l, gap: 4,
    backgroundColor: mau.the, borderRadius: bo.lon, borderWidth: 1, borderColor: mau.chinh, ...bong, elevation: 12, zIndex: 50,
  },
  nhan: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: mau.chinhChu },
  noiDung: { fontSize: chu.thuong, color: mau.chu },
  viec: { fontSize: chu.nho, fontWeight: '700', color: mau.chinhChu },
});
