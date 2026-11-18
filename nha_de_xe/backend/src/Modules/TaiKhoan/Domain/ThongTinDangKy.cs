using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
using NhaXe.SharedKernel;

namespace NhaXe.Modules.TaiKhoan.Domain;

public static class ThongTinDangKy
{
    public static string ChuanHoaSdt(string? sdt)
    {
        var value = sdt?.Trim() ?? "";
        if (!Regex.IsMatch(value, @"\A0[0-9]{9}\z"))
            throw new LoiNghiepVu(LoaiLoi.DuLieuKhongHopLe, "SDT_SAI", "Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.");
        return value;
    }

    public static (string HoTen, string Sdt, string Email) ChuanHoa(string? hoTen, string? sdt, string? email, string? matKhau)
    {
        var ten = hoTen?.Trim() ?? "";
        if (ten.Length is < 2 or > 100)
            throw new LoiNghiepVu(LoaiLoi.DuLieuKhongHopLe, "HO_TEN_SAI", "Họ tên phải từ 2 đến 100 ký tự.");
        var mail = email?.Trim().ToLowerInvariant() ?? "";
        if (mail.Length > 255 || !MailAddress.TryCreate(mail, out var addr) || addr.Address != mail || !mail.Contains('.'))
            throw new LoiNghiepVu(LoaiLoi.DuLieuKhongHopLe, "EMAIL_SAI", "Nhập địa chỉ email hợp lệ để khôi phục mật khẩu.");
        KiemTraMatKhau(matKhau);
        return (ten, ChuanHoaSdt(sdt), mail);
    }

    public static void KiemTraMatKhau(string? matKhau)
    {
        if (string.IsNullOrWhiteSpace(matKhau) || matKhau.Length is < 8 or > 64 || Encoding.UTF8.GetByteCount(matKhau) > 72)
            throw new LoiNghiepVu(LoaiLoi.DuLieuKhongHopLe, "MAT_KHAU_YEU", "Mật khẩu phải từ 8 đến 64 ký tự và không quá 72 byte UTF-8.");
    }
}
