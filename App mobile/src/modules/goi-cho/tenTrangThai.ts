// Chép từ nha_de_xe/frontend/src/modules/goi-cho/components/GoiChoUi.tsx (tenTrangThaiDuyet + màu nhãn), sửa ở web thì nhớ sửa ở đây.
import type { TrangThaiDuyet } from './models';

export const tenTrangThaiDuyet: Record<TrangThaiDuyet, string> = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Bị từ chối',
  BI_GO: 'Bị gỡ',
};

/** Màu nhãn giống web: đã duyệt xanh, chờ duyệt vàng, còn lại đỏ. */
export const loaiNhanDuyet = (tt: TrangThaiDuyet): 'ok' | 'canh' | 'loi' =>
  tt === 'DA_DUYET' ? 'ok' : tt === 'CHO_DUYET' ? 'canh' : 'loi';
