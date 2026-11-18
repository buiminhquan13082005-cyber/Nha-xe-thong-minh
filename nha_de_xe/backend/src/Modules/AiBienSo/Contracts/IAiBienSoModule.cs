namespace NhaXe.Modules.AiBienSo.Contracts;

/// <summary>Không sở hữu bảng; CongRaVao (và sau này TimXe) truyền ảnh và nhận kết quả, không biết mô hình nào chạy bên dưới.</summary>
public interface IAiBienSoModule
{
    Task<KetQuaDocBienSo> DocAsync(AnhBienSo anh, CancellationToken ct = default);
}
public record AnhBienSo(byte[] NoiDung, string LoaiNoiDung);
public record BienSoUngVien(string BienSo, double DoTinCay);
// Biển không rõ hoặc nhiều biển: BienSo = null, yêu cầu kiểm tra thủ công.
// LoaiBien: O_TO / XE_MAY / KHONG_RO (suy từ dạng biển của BienSo, hoặc của ứng viên đầu khi BienSo = null).
public record KetQuaDocBienSo(string? BienSo, double DoTinCay, bool CanXacNhan, IReadOnlyList<BienSoUngVien> UngVien,
                              string LoaiBien = "KHONG_RO");
