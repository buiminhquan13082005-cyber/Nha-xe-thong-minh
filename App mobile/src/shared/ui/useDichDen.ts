// Chỉnh từ nha_de_xe/frontend/src/shared/ui/useDichDen.ts cho điện thoại: không có document.querySelector / scrollIntoView,
// nên mỗi dòng tự báo vị trí (onLayout) và màn hình cuộn ScrollView tới đó, tô sáng 2,5 giây.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';

export const LOI_KHONG_MO_DUOC = 'khong-mo-duoc';

/** Số nguyên dương từ tham số URL, sai thì null. */
export function soId(v: string | string[] | undefined | null): number | null {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return s && Number.isInteger(n) && n > 0 ? n : null;
}

/** Không có quyền / không còn đối tượng: về tab Thông báo, báo "Không mở được nội dung này" (giống web). */
export function veKhongMoDuoc() {
  // mo: mỗi lần là một giá trị mới để hộp thư hiện lại câu báo (lần thứ hai cùng lỗi vẫn hiện)
  router.navigate({ pathname: '/thong-bao', params: { loi: LOI_KHONG_MO_DUOC, mo: String(Date.now()) } });
}

/**
 * Cuộn tới một dòng và tô sáng. Dùng:
 *   const dich = useCuonToi();  <ScrollView ref={dich.cuonRef}>  <View onLayout={dich.ghiViTri('xe-45')} …>
 *   dich.toi('xe-45') → true nếu tìm thấy dòng; dich.dangSang === 'xe-45' trong 2,5 giây để đổi viền.
 */
export function useCuonToi() {
  const cuonRef = useRef<ScrollViewInstance>(null);
  // onLayout cho toạ độ so với khối cha trực tiếp: dòng nằm trong một thẻ thì ghi kèm tên thẻ (cha) để cộng dồn
  const viTri = useRef(new Map<string, { y: number; cha?: string }>());
  const [dangSang, setDangSang] = useState<string | null>(null);

  const ghiViTri = useCallback((khoa: string, cha?: string) => (e: LayoutChangeEvent) => {
    viTri.current.set(khoa, { y: e.nativeEvent.layout.y, cha });
  }, []);

  const toi = useCallback((khoa: string) => {
    let muc = viTri.current.get(khoa);
    if (!muc) return false;
    let y = 0;
    for (let buoc = 0; muc && buoc < 5; buoc++) {
      y += muc.y;
      muc = muc.cha ? viTri.current.get(muc.cha) : undefined;
    }
    cuonRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    setDangSang(khoa);
    return true;
  }, []);

  useEffect(() => {
    if (!dangSang) return;
    const t = setTimeout(() => setDangSang(null), 2_600);
    return () => clearTimeout(t);
  }, [dangSang]);

  return { cuonRef, ghiViTri, toi, dangSang };
}

/**
 * Chạy fn đúng MỘT lần cho mỗi giá trị tham số mới (mở từ thông báo), khi dữ liệu màn hình đã sẵn sàng
 * và các dòng đã đo xong vị trí (chờ một nhịp sau khi có dữ liệu). Khoá nên kèm tham số `mo` (moThongBao thêm mỗi lần bấm)
 * để bấm lại cùng thông báo trên tab đang mở sẵn vẫn chạy lại.
 */
export function useKhiMoTuThongBao(khoa: string | null, sanSang: boolean, fn: (khoa: string) => void) {
  const daChay = useRef<string | null>(null);
  const f = useRef(fn);
  f.current = fn;
  useEffect(() => {
    if (!khoa || !sanSang || daChay.current === khoa) return;
    const t = setTimeout(() => { daChay.current = khoa; f.current(khoa); }, 250);
    return () => clearTimeout(t);
  }, [khoa, sanSang]);
}
