import type { ReactNode } from 'react';

/**
 * Khung chung của Đăng nhập / Đăng ký theo bản thiết kế "bãi xe ban đêm" (giao-dien/project/Main.dc.html, DangKy.dc.html):
 * vạch sơn ô đỗ phía trên, ô giữa tô vàng, biểu tượng P; dưới là nhãn nhỏ, tiêu đề, mô tả rồi tới form.
 */
export function KhungXacThuc({ nhan, tieuDe, moTa, children, chan }: { nhan: string; tieuDe: string; moTa: string; children: ReactNode; chan?: ReactNode }) {
  return (
    <div className="trang-xac-thuc">
      <div className="xt-hero" aria-hidden="true">
        <svg viewBox="0 0 390 220" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="xt-mo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.5" stopColor="#17181b" stopOpacity="0" />
              <stop offset="1" stopColor="#17181b" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d="M-10 34 H400" stroke="#f4f1ea" strokeOpacity="0.16" strokeWidth="2" strokeDasharray="22 16" />
          <path d="M-10 78 H400" stroke="#f4f1ea" strokeOpacity="0.22" strokeWidth="2" />
          <path d="M0 78 V220 M78 78 V220 M156 78 V220 M234 78 V220 M312 78 V220 M390 78 V220" stroke="#f4f1ea" strokeOpacity="0.22" strokeWidth="2" />
          <rect x="157" y="79" width="76" height="150" fill="#f2c14e" fillOpacity="0.07" />
          <path d="M156 78 V220 M234 78 V220 M156 78 H234" stroke="#f2c14e" strokeWidth="3" />
          <rect x="0" y="0" width="390" height="220" fill="url(#xt-mo)" />
        </svg>
        <div className="xt-logo">P</div>
      </div>
      <div className="xt-than">
        <span className="nhan-nho">{nhan}</span>
        <h1 className="xt-tieu-de">{tieuDe}</h1>
        <p className="xt-mo-ta">{moTa}</p>
        {children}
      </div>
      {chan && <div className="xt-chan">{chan}</div>}
    </div>
  );
}
