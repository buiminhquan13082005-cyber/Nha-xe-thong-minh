/* =====================================================================
   V016: Xe bị từ chối duyệt thì xoá luôn
   - Từ nay Admin từ chối xe = xoá hẳn dòng xe (API làm), biển số được giải phóng để chủ xe đăng ký lại.
     Lý do từ chối gửi cho chủ xe qua thông báo KET_QUA_DUYET.
   - Dọn các xe đang ở trạng thái TU_CHOI từ trước. Xe bị từ chối chưa từng được duyệt nên không có gói / lượt gửi;
     vẫn kiểm tra cho chắc: xe nào còn được bảng khác tham chiếu thì để nguyên.
   - Tệp ảnh giấy đăng ký cũ (nếu có) vẫn nằm trong volume uploads, không ảnh hưởng gì.
   Chạy lại nhiều lần an toàn. db-init.sh tự chạy sau nha-xe.sql.
   ===================================================================== */
USE NhaXeThongMinh;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

DELETE x FROM dbo.xe x
WHERE x.trang_thai_duyet = 'TU_CHOI'
  AND NOT EXISTS (SELECT 1 FROM dbo.dang_ky_cho d WHERE d.xe_id = x.id)
  AND NOT EXISTS (SELECT 1 FROM dbo.luot_gui l WHERE l.xe_id = x.id)
  AND NOT EXISTS (SELECT 1 FROM dbo.xe_trong_bai t WHERE t.xe_id = x.id)
  AND NOT EXISTS (SELECT 1 FROM dbo.di_sai_khu s WHERE s.xe_id = x.id);
PRINT N'V016 xoá xe bị từ chối: ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' xe';
GO
