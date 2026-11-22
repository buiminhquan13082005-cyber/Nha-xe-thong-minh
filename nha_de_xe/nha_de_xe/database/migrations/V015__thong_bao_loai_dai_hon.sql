/* =====================================================================
   V015: Nới cột thong_bao.loai từ VARCHAR(12) lên VARCHAR(20)
   - VARCHAR(12) không chứa được 'KET_QUA_DUYET' (13 ký tự) và 'CHO_THANH_TOAN' (14 ký tự):
     INSERT báo lỗi "String or binary data would be truncated", thông báo kết quả duyệt xe không được lưu.
   - IX_tb_chong_lap (V014) có loai trong khoá nên phải xoá trước khi đổi cột rồi tạo lại.
   Chạy lại nhiều lần an toàn. db-init.sh tự chạy sau nha-xe.sql.
   ===================================================================== */
USE NhaXeThongMinh;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.thong_bao', 'loai') < 20
BEGIN
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_chong_lap' AND object_id = OBJECT_ID('dbo.thong_bao'))
        DROP INDEX IX_tb_chong_lap ON dbo.thong_bao;
    ALTER TABLE dbo.thong_bao ALTER COLUMN loai VARCHAR(20) NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_chong_lap' AND object_id = OBJECT_ID('dbo.thong_bao'))
    CREATE INDEX IX_tb_chong_lap ON dbo.thong_bao (tai_khoan_id, loai, gui_luc DESC) INCLUDE (tham_chieu_id);
GO

PRINT N'V015 thong_bao.loai VARCHAR(20): xong';
GO
