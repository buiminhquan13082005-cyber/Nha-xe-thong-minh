import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { useNgheThongBao } from '@/shared/realtime/useNgheThongBao';

export function Layout() {
  const { phien, dangXuat, services } = useApp();
  const nav = useNavigate();
  const laAdmin = phien?.vaiTro === 'ADMIN';
  const viTri = useLocation();
  const [chuaDoc, setChuaDoc] = useState(0);
  const [loiDangXuat, setLoiDangXuat] = useState('');
  const [dangThoat, setDangThoat] = useState(false);
  const [moi, setMoi] = useState<{ noiDung: string; khoa: number } | null>(null);
  const [lanTai, setLanTai] = useState(0);
  // Thông báo tới qua SignalR: hiện thẻ nổi vài giây và tải lại số chưa đọc
  useNgheThongBao((s) => { setMoi({ noiDung: s.noiDung, khoa: Date.now() }); setLanTai((n) => n + 1); });
  useEffect(() => {
    if (!moi) return;
    const id = window.setTimeout(() => setMoi(null), 6_000);
    return () => window.clearTimeout(id);
  }, [moi]);
  async function thoat() {
    setDangThoat(true); setLoiDangXuat('');
    try { await services.auth.dangXuat(); dangXuat(); nav('/dang-nhap'); }
    catch (er) { setLoiDangXuat((er as Error).message); }
    finally { setDangThoat(false); }
  }
  // số thông báo chưa đọc (Admin: hộp thư Admin; khách: hộp thư của mình), tải lại khi đổi trang và mỗi 15 giây
  useEffect(() => {
    const tai = () => (laAdmin ? services.thongBao.layHopThuAdmin().then((h) => h.soChuaDoc) : services.thongBao.soChuaDoc())
      .then(setChuaDoc).catch(() => setChuaDoc(0));
    void tai();
    const id = window.setInterval(() => { if (!document.hidden) void tai(); }, 15_000);
    return () => window.clearInterval(id);
  }, [laAdmin, services, viTri.pathname, lanTai]);

  return (
    <div className="khung">
      <header className="dau-trang">
        <div className="thuong-hieu"><span className="logo-p" aria-hidden="true">P</span> Nhà xe thông minh</div>
        <nav>
          {laAdmin ? (
            <>
              <NavLink to="/admin/cong">Cổng ra vào</NavLink>
              <NavLink to="/admin/camera-khu">Camera khu</NavLink>
              <NavLink to="/admin/doi-soat">Đối soát khu</NavLink>
              <NavLink to="/admin/bai-xe">Sơ đồ bãi</NavLink>
              <NavLink to="/admin/quan-ly-bai">Quản lý bãi</NavLink>
              <NavLink to="/admin/ai-bien-so">Đọc biển số</NavLink>
              <NavLink to="/admin/duyet-xe">Quản lý xe</NavLink>
              <NavLink to="/admin/goi-gia">Gói &amp; giá</NavLink>
              <NavLink to="/admin/tai-khoan">Tài khoản</NavLink>
              <NavLink to="/admin/bao-cao">Báo cáo</NavLink>
              <NavLink to="/admin/thong-bao">Thông báo{chuaDoc > 0 && <span className="so-dem">{chuaDoc}</span>}</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/xe">Xe của tôi</NavLink>
              <NavLink to="/mua-goi">Mua / gia hạn gói</NavLink>
              <NavLink to="/tim-xe">Tìm xe</NavLink>
              <NavLink to="/ra-vao">Ra vào</NavLink>
              <NavLink to="/nhom-gia-dinh">Nhóm gia đình</NavLink>
              <NavLink to="/thong-bao">Thông báo{chuaDoc > 0 && <span className="so-dem">{chuaDoc}</span>}</NavLink>
            </>
          )}
        </nav>
        <div className="nguoi-dung">
          <span>{phien?.hoTen}</span>
          <NavLink to={laAdmin ? '/admin/doi-mat-khau' : '/doi-mat-khau'}>Đổi mật khẩu</NavLink>
          <button className="nut nut-phu nut-nho" disabled={dangThoat} onClick={() => void thoat()}>Đăng xuất</button>
          {loiDangXuat && <span role="alert">{loiDangXuat}</span>}
        </div>
      </header>
      <main className="noi-dung"><Outlet /></main>
      {moi && (
        <div key={moi.khoa} className="the-noi" role="status" onClick={() => { setMoi(null); nav(laAdmin ? '/admin/thong-bao' : '/thong-bao'); }}>
          <span className="nhan-nho">Thông báo mới</span>
          <span>{moi.noiDung}</span>
        </div>
      )}
    </div>
  );
}
