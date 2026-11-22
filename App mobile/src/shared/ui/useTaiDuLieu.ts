// Chép và chỉnh từ nha_de_xe/frontend/src/shared/ui/useTaiDuLieu.ts, sửa ở web thì nhớ xem lại ở đây.
// Khác web: thay "tab trình duyệt đang ẩn" bằng "màn hình đang không hiện" (useFocusEffect) và "app đang ở nền" (AppState);
// quay lại màn / mở lại app thì tự tải lại ngầm.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { thongDiepLoi } from '@/shared/api/loiApi';

/**
 * Hook dùng chung: gọi một hàm async, giữ trạng thái đang tải / lỗi / dữ liệu, cho phép tải lại.
 * - Lần đầu: tải và bật dangTai (màn hiện vòng quay).
 * - Quay lại màn này, hoặc app từ nền trở lại: tải lại NGẦM (giữ dữ liệu đang hiện, không nhấp nháy).
 * - chuKyMs: tự tải lại ngầm theo chu kỳ, chỉ khi màn đang hiện và app đang mở (Trang 3: hỏi lại mỗi 3 giây).
 * Lỗi lúc tải ngầm thì giữ dữ liệu cũ; chưa có dữ liệu thì hiện lỗi.
 */
export function useTaiDuLieu<T>(ham: () => Promise<T>, phuThuoc: unknown[] = [], chuKyMs?: number) {
  const [duLieu, setDuLieu] = useState<T | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tai = useCallback(ham, phuThuoc);

  // Chỉ nhận kết quả của lần gọi MỚI NHẤT: phản hồi cũ về sau không đè lên kết quả mới
  const lanGoi = useRef(0);
  const coDuLieu = useRef(false);

  const chay = useCallback(async (ngam: boolean) => {
    const lan = ++lanGoi.current;
    if (!ngam) { setDangTai(true); setLoi(null); }
    try {
      const d = await tai();
      if (lan === lanGoi.current) { setDuLieu(d); setLoi(null); coDuLieu.current = true; }
    } catch (e) {
      // tải ngầm mà đã có dữ liệu: lỗi mạng thoáng qua thì giữ dữ liệu cũ
      if (lan === lanGoi.current && (!ngam || !coDuLieu.current)) setLoi(thongDiepLoi(e));
    } finally {
      if (lan === lanGoi.current) setDangTai(false);
    }
  }, [tai]);

  /** Tải lại có hiện trạng thái đang tải (nút "Thử lại", kéo xuống để tải lại). */
  const taiLai = useCallback(() => chay(false), [chay]);
  /** Tải lại không hiện đang tải (SignalR báo có thay đổi, quay lại màn...). */
  const taiNgam = useCallback(() => chay(true), [chay]);

  // Tham số đổi (ví dụ chọn xe khác): bỏ ngay dữ liệu của tham số cũ, để màn hình không hiện / thao tác trên dữ liệu sai
  // trong lúc chờ, và lỗi của lần tải mới luôn được hiện (không bị coi là "lỗi tải ngầm" khi đã có dữ liệu).
  const lanDau = useRef(true);
  useEffect(() => {
    if (lanDau.current) lanDau.current = false;
    else { setDuLieu(null); setLoi(null); coDuLieu.current = false; }
    void taiLai();
  }, [taiLai]);

  // Màn đang hiện hay không. Lần focus đầu trùng với lần tải đầu ở trên nên bỏ qua.
  const dangHien = useRef(false);
  const lanFocusDau = useRef(true);
  useFocusEffect(useCallback(() => {
    dangHien.current = true;
    if (lanFocusDau.current) lanFocusDau.current = false;
    else void taiNgam();
    return () => { dangHien.current = false; };
  }, [taiNgam]));

  // App từ nền trở lại (mở lại từ đa nhiệm, tắt màn hình rồi mở): tải lại ngầm nếu màn đang hiện
  useEffect(() => {
    const sub = AppState.addEventListener('change', (tt) => { if (tt === 'active' && dangHien.current) void taiNgam(); });
    return () => sub.remove();
  }, [taiNgam]);

  useEffect(() => {
    if (!chuKyMs) return;
    const id = setInterval(() => {
      if (!dangHien.current || AppState.currentState !== 'active') return; // đang ở màn khác / app ở nền: đỡ tốn request
      void taiNgam();
    }, chuKyMs);
    return () => clearInterval(id);
  }, [taiNgam, chuKyMs]);

  return { duLieu, loi, dangTai, taiLai, taiNgam };
}
