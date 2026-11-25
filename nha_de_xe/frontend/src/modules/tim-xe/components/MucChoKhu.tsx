import type { KhuCho } from '../models';
import { TEN_MUC } from '../models';

/**
 * Mức chỗ các khu (đề cương v10): còn trên 20% là "Còn nhiều", từ 20% trở xuống "Sắp đầy", hết là "Đầy".
 * Số liệu tính từ dữ liệu (sức chứa − xe đang ghi ở khu − suất đang giữ), không phải AI.
 * Khu chưa đặt sức chứa (sức chứa 0, ví dụ khu ô tô mới thêm) hiện "Chưa đặt sức chứa" thay vì "Đầy".
 */
export function MucChoKhu({ khu, chiTiet = false, khuNoiBat, loai = 'xe máy' }: {
  khu: KhuCho[]; chiTiet?: boolean; khuNoiBat?: number | null;
  /** Tên loại xe cho câu "Chưa có khu … nào". */
  loai?: string;
}) {
  if (khu.length === 0) return <p className="mo">Chưa có khu {loai} nào.</p>;
  return (
    <div className="luoi-khu">
      {khu.map((k) => {
        const chuaDat = k.sucChua <= 0;
        const dung = chuaDat ? 0 : Math.min(100, ((k.soXe + k.soGiu) / k.sucChua) * 100);
        return (
          <div key={k.id} className={`the khu-cho muc-${chuaDat ? 'CHUA' : k.muc} ${khuNoiBat === k.id ? 'khu-noi-bat' : ''}`}>
            <div className="khu-cho-dau">
              <strong>{k.ten}</strong>
              {chuaDat
                ? <span className="nhan">Chưa đặt sức chứa</span>
                : <span className={`nhan nhan-muc-${k.muc}`}>{TEN_MUC[k.muc]}</span>}
            </div>
            <div className="khu-cho-so"><span className="lon">{k.conLai}</span> <span className="mo">/ {k.sucChua} chỗ còn</span></div>
            <div className="thanh"><div className="thanh-day" style={{ width: `${dung}%` }} /></div>
            {chiTiet && (
              <div className="mo khu-cho-ct">
                {k.soXe} xe đang ở khu · {k.soGiu} suất đang giữ
                {k.khoangCachTuCong != null && ` · cách cổng ${Math.round(k.khoangCachTuCong)} m`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
