/* =====================================================================
   V017: KHU Ô TÔ theo ảnh "Phương án bố trí bãi đỗ xe"
   - 17 khu ô tô A–Q: mỗi dãy chữ trên ảnh là MỘT khu (ma_so_do = chữ đó). Định vị MỨC KHU như xe máy:
     mỗi khu có camera hướng VÀO (KHU_VAO) và hướng RA (KHU_RA) đọc biển bằng Model A + PaddleOCR.
     Chưa định vị tới từng ô (PKLot, ô trống: giai đoạn sau). Camera giám sát CAM-A1, CAM-B1 vẫn tắt.
   - Khu A, Khu B có sẵn (nha-xe.sql, V013 đã tắt): GIỮ khu cũ (id, ô đỗ, lịch sử), chỉ gắn mã sơ đồ và toạ độ.
     Khu ô tô cùng tên do Admin tạo tay cũng được gắn mã, không thêm khu trùng.
   - Khu mới có SỨC CHỨA 0: Admin nhập số chỗ ở trang Quản lý bãi. Khu sức chứa 0 không được chọn khi chỉ dẫn xe.
     Sức chứa chỉ đặt lúc thêm, chạy lại không ghi đè số Admin đã sửa.
   - Tên "Khu C" / "Khu D" đã có khu loại khác dùng (khu xe máy mẫu chưa xoá) thì khu ô tô lấy tên "Khu C (ô tô)".
   - Bật khu ô tô và camera hướng vào / hướng ra của chúng MỘT lần (đánh dấu 'v017_da_bat_khu_o_to' trong cau_hinh):
     Admin tắt lại khu nào thì lần chạy sau không bật nữa.
   - Đường đi tới khu: backend/src/Modules/BaiXe/Application/BanDo/do-thi-ban-do.json (nút có "khu": "A"...).
   Chạy lại nhiều lần vẫn an toàn. db-init.sh tự chạy sau nha-xe.sql.
   ===================================================================== */
USE NhaXeThongMinh;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

DECLARE @oto INT = (SELECT id FROM dbo.loai_xe WHERE ten = 'O_TO');
IF @oto IS NULL
BEGIN
    PRINT N'V017: không có loại xe O_TO, bỏ qua';
    RETURN;
END

DECLARE @khu TABLE (ma VARCHAR(10) PRIMARY KEY, ten NVARCHAR(50), toa_do NVARCHAR(200));
INSERT @khu (ma, ten, toa_do) VALUES
    ('A', N'Khu A', N'{"x":0.088,"y":0.273}'),
    ('B', N'Khu B', N'{"x":0.158,"y":0.273}'),
    ('C', N'Khu C', N'{"x":0.1,"y":0.459}'),
    ('D', N'Khu D', N'{"x":0.158,"y":0.459}'),
    ('E', N'Khu E', N'{"x":0.183,"y":0.57}'),
    ('F', N'Khu F', N'{"x":0.293,"y":0.432}'),
    ('G', N'Khu G', N'{"x":0.507,"y":0.432}'),
    ('H', N'Khu H', N'{"x":0.656,"y":0.432}'),
    ('I', N'Khu I', N'{"x":0.748,"y":0.438}'),
    ('J', N'Khu J', N'{"x":0.3,"y":0.553}'),
    ('K', N'Khu K', N'{"x":0.454,"y":0.553}'),
    ('L', N'Khu L', N'{"x":0.264,"y":0.673}'),
    ('M', N'Khu M', N'{"x":0.371,"y":0.673}'),
    ('N', N'Khu N', N'{"x":0.463,"y":0.673}'),
    ('O', N'Khu O', N'{"x":0.725,"y":0.61}'),
    ('P', N'Khu P', N'{"x":0.641,"y":0.768}'),
    ('Q', N'Khu Q', N'{"x":0.721,"y":0.768}');

BEGIN TRAN;

/* 1. Khu ô tô đã có cùng tên (Khu A, B của nha-xe.sql): gắn mã sơ đồ và toạ độ theo ảnh */
UPDATE kv SET ma_so_do = k.ma, toa_do_so_do = k.toa_do
FROM dbo.khu_vuc kv JOIN @khu k ON kv.ten = k.ten
WHERE kv.ma_so_do IS NULL AND kv.loai_xe_id = @oto
  AND NOT EXISTS (SELECT 1 FROM dbo.khu_vuc x WHERE x.ma_so_do = k.ma);

/* 2. Thêm khu còn thiếu (sức chứa 0, Admin nhập sau) */
INSERT dbo.khu_vuc (ten, loai_xe_id, toa_do_so_do, suc_chua, ma_so_do, dang_dung)
SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.khu_vuc x WHERE x.ten = k.ten) THEN k.ten + N' (ô tô)' ELSE k.ten END,
       @oto, k.toa_do, 0, k.ma, 1
FROM @khu k
WHERE NOT EXISTS (SELECT 1 FROM dbo.khu_vuc x WHERE x.ma_so_do = k.ma)
  AND NOT EXISTS (SELECT 1 FROM dbo.khu_vuc x WHERE x.ten = k.ten + N' (ô tô)');

/* 3. Camera hướng VÀO / hướng RA cho mỗi khu ô tô (tên CAM-A-VAO, CAM-Q-RA...) */
INSERT dbo.camera (khu_vuc_id, ten, nguon_anh, dang_bat, vai_tro)
SELECT kv.id, N'CAM-' + kv.ma_so_do + N'-' + h.duoi, h.anh, 1, h.vai_tro
FROM dbo.khu_vuc kv
JOIN @khu k ON k.ma = kv.ma_so_do
CROSS JOIN (VALUES ('KHU_VAO', N'VAO', '/demo/camera/khu-vao.jpg'),
                   ('KHU_RA',  N'RA',  '/demo/camera/khu-ra.jpg')) AS h (vai_tro, duoi, anh)
WHERE kv.loai_xe_id = @oto
  AND NOT EXISTS (SELECT 1 FROM dbo.camera c WHERE c.khu_vuc_id = kv.id AND c.vai_tro = h.vai_tro)
  AND NOT EXISTS (SELECT 1 FROM dbo.camera c WHERE c.ten = N'CAM-' + kv.ma_so_do + N'-' + h.duoi);

/* 4. Bật khu ô tô (V013 đã tắt A, B) và camera hướng vào / hướng ra của chúng, chỉ một lần */
IF NOT EXISTS (SELECT 1 FROM dbo.cau_hinh WHERE khoa = 'v017_da_bat_khu_o_to')
BEGIN
    UPDATE dbo.khu_vuc SET dang_dung = 1
    WHERE loai_xe_id = @oto AND ma_so_do IN (SELECT ma FROM @khu);
    UPDATE c SET dang_bat = 1
    FROM dbo.camera c JOIN dbo.khu_vuc kv ON kv.id = c.khu_vuc_id
    WHERE kv.loai_xe_id = @oto AND kv.ma_so_do IN (SELECT ma FROM @khu) AND c.vai_tro IN ('KHU_VAO', 'KHU_RA');
    INSERT dbo.cau_hinh (khoa, gia_tri, mo_ta)
    VALUES ('v017_da_bat_khu_o_to', N'1', N'V017 đã bật 17 khu ô tô A–Q và camera vào / ra của chúng (Admin tắt lại được)');
END

COMMIT;
GO

PRINT N'V017 khu ô tô A–Q theo bản đồ: xong';
GO
