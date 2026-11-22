// Hiệu ứng chuyển động dùng chung của app (theo SoChay.tsx và các @keyframes trong nha_de_xe/frontend/src/styles.css).
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type TextStyle } from 'react-native';

/** Người dùng bật "Giảm chuyển động" trong cài đặt trợ năng của điện thoại thì tắt các hiệu ứng lặp. */
export function useGiamChuyenDong() {
  const [giam, setGiam] = useState(false);
  useEffect(() => {
    let conGan = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (conGan) setGiam(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setGiam);
    return () => { conGan = false; sub.remove(); };
  }, []);
  return giam;
}

/**
 * Animated.Value chạy lặp 0 → 1 mãi (vòng toả, nhịp điểm đến...). Tắt khi `bat` = false hoặc giảm chuyển động.
 * nghiMs: nghỉ ở cuối mỗi vòng. native: dùng native driver (chỉ cho transform / opacity của View).
 */
export function useVongLap(thoiGianMs: number, { bat = true, native = true, nghiMs = 0, treMs = 0 } = {}) {
  const giam = useGiamChuyenDong();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!bat || giam) { v.setValue(0); return; }
    v.setValue(0);
    const buoc: Animated.CompositeAnimation[] = [
      Animated.timing(v, { toValue: 1, duration: thoiGianMs, easing: Easing.linear, useNativeDriver: native }),
    ];
    if (nghiMs) buoc.push(Animated.delay(nghiMs));
    const lap = Animated.loop(Animated.sequence(buoc));
    const hen = setTimeout(() => lap.start(), treMs);
    return () => { clearTimeout(hen); lap.stop(); };
  }, [v, bat, giam, thoiGianMs, native, nghiMs, treMs]);
  return { v, giam };
}

/** Animated.Value chạy MỘT lần 0 → 1 mỗi khi `khoa` đổi (vẽ dần đường đi, dấu tích...). Giảm chuyển động thì nhảy thẳng tới 1. */
export function useChayMotLan(khoa: unknown, thoiGianMs: number, { treMs = 0, native = false } = {}) {
  const giam = useGiamChuyenDong();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (giam) { v.setValue(1); return; }
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration: thoiGianMs, delay: treMs, easing: Easing.out(Easing.cubic), useNativeDriver: native });
    a.start();
    return () => a.stop();
  }, [v, khoa, giam, thoiGianMs, treMs, native]);
  return v;
}

/**
 * Số tự "đếm" từ giá trị cũ sang giá trị mới (khoảng 0,6 giây) khi số liệu đổi, và nảy nhẹ một nhịp.
 * Lần hiện đầu tiên không chạy. Giảm chuyển động thì đổi ngay.
 */
export function SoChay({ gia, dinhDang = (n) => String(n), style }: {
  gia: number;
  dinhDang?: (n: number) => string;
  style?: StyleProp<TextStyle>;
}) {
  const giam = useGiamChuyenDong();
  const [hien, setHien] = useState(gia);
  const tu = useRef(gia);
  /** Số đang hiện trên màn (đổi giữa chừng thì chạy tiếp từ đây, không nhảy). */
  const dangHien = useRef(gia);
  const nay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tu.current === gia) return;
    tu.current = gia;
    const batDau = dangHien.current;
    if (giam) { dangHien.current = gia; setHien(gia); return; }
    nay.setValue(0);
    Animated.timing(nay, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    const t0 = Date.now();
    let id = 0;
    const buoc = () => {
      const p = Math.min(1, (Date.now() - t0) / 600);
      dangHien.current = Math.round(batDau + (gia - batDau) * (1 - (1 - p) ** 3));
      setHien(dangHien.current);
      if (p < 1) id = requestAnimationFrame(buoc);
    };
    id = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(id);
  }, [gia, giam, nay]);

  const scale = nay.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1.3, 1] });
  return <Animated.Text style={[style, { transform: [{ scale }] }]}>{dinhDang(hien)}</Animated.Text>;
}
