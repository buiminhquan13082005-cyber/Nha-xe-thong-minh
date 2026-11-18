using System.Text.RegularExpressions;
using NhaXe.Modules.GoiCho.Application;

namespace NhaXe.Modules.GoiCho.Infrastructure;

/// <summary>
/// Lưu tệp vào một thư mục. Trong Docker, thư mục này là volume "uploads" gắn vào CẢ HAI container API,
/// nên ảnh tải lên qua container 1 vẫn xem được khi NGINX chuyển yêu cầu sang container 2.
/// </summary>
public sealed partial class LuuTruTepTrenDia : ILuuTruTep
{
    private readonly string _goc;
    public LuuTruTepTrenDia(string thuMucGoc) { _goc = Path.GetFullPath(thuMucGoc); Directory.CreateDirectory(_goc); }

    [GeneratedRegex("^[a-z0-9-]+(/[a-z0-9-]+)*\\.(png|jpg)$")]
    private static partial Regex KhoaHopLe();

    public async Task<string> LuuAsync(string thuMuc, string duoi, Stream noiDung, CancellationToken ct)
    {
        var khoa = $"{thuMuc}/{Guid.NewGuid():N}.{duoi}"; // tên do server đặt, không dùng tên tệp người dùng gửi
        var duongDan = DuongDan(khoa);
        Directory.CreateDirectory(Path.GetDirectoryName(duongDan)!);
        await using var f = File.Create(duongDan);
        await noiDung.CopyToAsync(f, ct);
        return khoa;
    }

    public Task<Stream?> MoAsync(string khoa, CancellationToken ct)
    {
        var duongDan = DuongDan(khoa);
        return Task.FromResult<Stream?>(File.Exists(duongDan) ? File.OpenRead(duongDan) : null);
    }

    /// <summary>Chặn khoá kiểu "../../etc/passwd": chỉ nhận chữ thường, số, gạch, và phải nằm trong thư mục gốc.</summary>
    private string DuongDan(string khoa)
    {
        if (!KhoaHopLe().IsMatch(khoa)) throw new ArgumentException("Khoá tệp không hợp lệ.", nameof(khoa));
        var p = Path.GetFullPath(Path.Combine(_goc, khoa));
        if (!p.StartsWith(_goc + Path.DirectorySeparatorChar)) throw new ArgumentException("Khoá tệp không hợp lệ.", nameof(khoa));
        return p;
    }

    /// <summary>Chép ảnh mẫu của dữ liệu demo (giay-dk/1.png ...) vào kho nếu chưa có. Không ghi đè.</summary>
    public static void ChepAnhMau(string thuMucMau, string thuMucGoc)
    {
        if (!Directory.Exists(thuMucMau)) return;
        foreach (var tep in Directory.EnumerateFiles(thuMucMau, "*", SearchOption.AllDirectories))
        {
            var dich = Path.Combine(thuMucGoc, Path.GetRelativePath(thuMucMau, tep));
            if (File.Exists(dich)) continue;
            Directory.CreateDirectory(Path.GetDirectoryName(dich)!);
            try { File.Copy(tep, dich); } catch (IOException) { /* container API kia vừa chép xong */ }
        }
    }
}
