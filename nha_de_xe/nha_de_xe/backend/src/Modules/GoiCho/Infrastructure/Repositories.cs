using Microsoft.EntityFrameworkCore;
using NhaXe.Modules.GoiCho.Application;
using NhaXe.Modules.GoiCho.Domain;
using GoiChoEntity = NhaXe.Modules.GoiCho.Domain.GoiCho;

namespace NhaXe.Modules.GoiCho.Infrastructure;

public class XeRepository : IXeRepository
{
    private readonly GoiChoDbContext _db;
    public XeRepository(GoiChoDbContext db) => _db = db;

    public Task<Xe?> TimAsync(int xeId, CancellationToken ct) => _db.Xes.FirstOrDefaultAsync(x => x.Id == xeId, ct);
    public Task<bool> TonTaiBienSoAsync(string bienSo, CancellationToken ct) => _db.Xes.AnyAsync(x => x.BienSo == bienSo, ct);

    public async Task<IReadOnlyList<Xe>> LayChoDuyetAsync(CancellationToken ct) =>
        await _db.Xes.AsNoTracking().Where(x => x.TrangThaiDuyet == TrangThaiDuyet.ChoDuyet).OrderBy(x => x.TaoLuc).ToListAsync(ct);

    public Task<int> DemChoDuyetCuaAsync(int taiKhoanId, CancellationToken ct) =>
        _db.Xes.CountAsync(x => x.ChuXeId == taiKhoanId && x.TrangThaiDuyet == TrangThaiDuyet.ChoDuyet, ct);

    public void Them(Xe xe) => _db.Xes.Add(xe);
    public Task LuuAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);

    public async Task<bool> ThuXoaAsync(Xe xe, CancellationToken ct)
    {
        // Không tự đọc bảng của module khác (luot_gui, xe_trong_bai, di_sai_khu): để khoá ngoại của DB quyết định.
        // DELETE chạy riêng (ExecuteDelete) nên bị chặn cũng không làm hỏng các thay đổi khác đã lưu.
        try { await _db.Xes.Where(x => x.Id == xe.Id).ExecuteDeleteAsync(ct); }
        catch (Exception e) when (LaLoiKhoaNgoai(e)) { return false; }
        _db.Entry(xe).State = EntityState.Detached;
        return true;
    }

    /// <summary>SQL Server lỗi 547: câu lệnh vi phạm ràng buộc (ở đây là khoá ngoại từ bảng khác trỏ tới xe).</summary>
    private static bool LaLoiKhoaNgoai(Exception? e)
    {
        for (; e is not null; e = e.InnerException)
            if (e is Microsoft.Data.SqlClient.SqlException { Number: 547 }) return true;
        return false;
    }
}

public class GoiChoRepository : IGoiChoRepository
{
    private readonly GoiChoDbContext _db;
    public GoiChoRepository(GoiChoDbContext db) => _db = db;

    public Task<GoiChoEntity?> TimAsync(int goiId, CancellationToken ct) => _db.GoiChos.AsNoTracking().FirstOrDefaultAsync(g => g.Id == goiId, ct);

    public async Task<IReadOnlyList<GoiChoEntity>> LayDangBanAsync(CancellationToken ct) =>
        await _db.GoiChos.AsNoTracking().Where(g => g.DangBan).OrderBy(g => g.LoaiXeId).ThenBy(g => g.SoNgay).ToListAsync(ct);

    public async Task<IReadOnlyList<GoiChoEntity>> LayTatCaAsync(CancellationToken ct) =>
        await _db.GoiChos.AsNoTracking().OrderBy(g => g.LoaiXeId).ThenBy(g => g.SoNgay).ToListAsync(ct);

    public Task<GoiChoEntity?> TimDeSuaAsync(int goiId, CancellationToken ct) => _db.GoiChos.FirstOrDefaultAsync(g => g.Id == goiId, ct);

    public Task LuuAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);

    public Task<bool> TonTaiLoaiXeAsync(int loaiXeId, CancellationToken ct) => _db.LoaiXes.AnyAsync(l => l.Id == loaiXeId, ct);
    public Task<string?> LayMaLoaiXeAsync(int loaiXeId, CancellationToken ct) =>
        _db.LoaiXes.Where(l => l.Id == loaiXeId).Select(l => (string?)l.Ten).FirstOrDefaultAsync(ct);
}

/// <summary>Đọc bảng cau_hinh; thiếu dòng hoặc sai định dạng thì dùng giá trị mặc định.</summary>
public class CauHinhStore : ICauHinh
{
    private readonly GoiChoDbContext _db;
    public CauHinhStore(GoiChoDbContext db) => _db = db;

    public async Task<int> LaySoNguyenAsync(string khoa, int macDinh, CancellationToken ct)
    {
        var giaTri = await _db.Database
            .SqlQuery<string>($"SELECT gia_tri AS Value FROM dbo.cau_hinh WHERE khoa = {khoa}")
            .FirstOrDefaultAsync(ct);
        return int.TryParse(giaTri, out var n) && n > 0 ? n : macDinh;
    }
}
