import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminBaiXePage, AdminQuanLyBaiPage } from '@/modules/bai-xe';
import { AdminCongPage, RaVaoPage } from '@/modules/cong-ra-vao';
import { AdminDuyetXePage, AdminGoiGiaPage, MuaGoiPage, PhiQuaHanPage, XeCuaToiPage } from '@/modules/goi-cho';
import { AdminTaiKhoanPage, BaoVe, DangNhapPage, DangKyPage, QuenMatKhauPage, DoiMatKhauPage } from '@/modules/tai-khoan';
import { AdminCameraKhuPage, AdminDoiSoatPage, TimXePage } from '@/modules/tim-xe';
import { AdminBaoCaoPage } from '@/modules/bao-cao';
import { NhomGiaDinhPage } from '@/modules/nhom-gia-dinh';
import { AiBienSoPage } from '@/modules/ai-bien-so';
import { AdminThongBaoPage, ThongBaoPage } from '@/modules/thong-bao';
import { Layout } from './Layout';

/** Lắp các trang của từng module vào đường dẫn. Thêm module mới: export trang ở index.ts của module rồi thêm Route ở đây. */
export function App() {
  return (
    <Routes>
      {/* 1. TaiKhoan */}
      <Route path="/dang-nhap" element={<DangNhapPage />} />
      <Route path="/dang-ky" element={<DangKyPage />} />
      <Route path="/quen-mat-khau" element={<QuenMatKhauPage />} />
      <Route element={<BaoVe vaiTro="USER" />}>
        <Route element={<Layout />}>
          {/* 2. GoiCho (khách) */}
          <Route path="/xe" element={<XeCuaToiPage />} />
          <Route path="/mua-goi" element={<MuaGoiPage />} />
          <Route path="/phi-qua-han/:xeId" element={<PhiQuaHanPage />} />
          {/* 3. NhomGiaDinh */}
          <Route path="/nhom-gia-dinh" element={<NhomGiaDinhPage />} />
          {/* 5. CongRaVao (khách xác nhận xe ra) */}
          <Route path="/ra-vao" element={<RaVaoPage />} />
          {/* 6. ThongBao (hộp thư khách) */}
          <Route path="/thong-bao" element={<ThongBaoPage />} />
          {/* 8. TimXe (xe máy: khu đang ở, mời vào khu, đường đi, "Đã đỗ xe", mức chỗ). Ô trống ô tô (PKLot) chưa làm. */}
          <Route path="/tim-xe" element={<TimXePage />} />
          <Route path="/cho-trong" element={<Navigate to="/tim-xe" replace />} />
          <Route path="/doi-mat-khau" element={<DoiMatKhauPage />} />
        </Route>
      </Route>
      <Route element={<BaoVe vaiTro="ADMIN" />}>
        <Route element={<Layout />}>
          {/* 5. CongRaVao (màn hình cổng) */}
          <Route path="/admin/cong" element={<AdminCongPage />} />
          {/* 7. BaiXe */}
          <Route path="/admin/bai-xe" element={<AdminBaiXePage />} />
          <Route path="/admin/quan-ly-bai" element={<AdminQuanLyBaiPage />} />
          {/* 8. TimXe (Admin) */}
          <Route path="/admin/camera-khu" element={<AdminCameraKhuPage />} />
          <Route path="/admin/doi-soat" element={<AdminDoiSoatPage />} />
          {/* 9. BaoCao */}
          <Route path="/admin/bao-cao" element={<AdminBaoCaoPage />} />
          {/* 1. TaiKhoan (Admin) */}
          <Route path="/admin/tai-khoan" element={<AdminTaiKhoanPage />} />
          {/* 4. AiBienSo */}
          <Route path="/admin/ai-bien-so" element={<AiBienSoPage />} />
          {/* 2. GoiCho (Admin) */}
          <Route path="/admin/duyet-xe" element={<AdminDuyetXePage />} />
          <Route path="/admin/goi-gia" element={<AdminGoiGiaPage />} />
          {/* 6. ThongBao */}
          <Route path="/admin/thong-bao" element={<AdminThongBaoPage />} />
          <Route path="/admin/doi-mat-khau" element={<DoiMatKhauPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
    </Routes>
  );
}
