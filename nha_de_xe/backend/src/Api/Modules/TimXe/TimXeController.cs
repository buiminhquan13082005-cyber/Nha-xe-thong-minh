using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NhaXe.Api.Common;
using NhaXe.Modules.TimXe.Application;

namespace NhaXe.Api.Modules.TimXe;

/// <summary>Khách: tìm xe (khu, giờ vào khu, đường đi), "Đã đỗ xe", mức chỗ các khu xe máy.</summary>
[ApiController]
[Authorize(Roles = "USER")]
[Route("api/tim-xe")]
[Tags("8. TimXe · Khách: tìm xe, đã đỗ xe")]
public class TimXeController : ControllerBase
{
    /// <summary>Các xe mình được dùng: đang ở khu nào, được mời vào khu nào, đường đi từ cổng; kèm mức chỗ các khu.</summary>
    [HttpGet]
    public Task<TimXeCuaToiDto> Lay([FromServices] TimXeCuaToiUseCase uc, CancellationToken ct) => uc.ThucHienAsync(User.TaiKhoanId(), ct);

    /// <summary>"Đã đỗ xe" (xác nhận phụ). Camera đã ghi khu khác thì giữ theo camera và báo Admin.</summary>
    [HttpPost("da-do-xe")]
    public async Task<IActionResult> DaDoXe([FromBody] DaDoXeLenh lenh, [FromServices] DaDoXeUseCase uc, CancellationToken ct) =>
        Ok(new { thongDiep = await uc.ThucHienAsync(User.TaiKhoanId(), lenh.XeId, lenh.KhuId, ct) });
}

/// <summary>Admin: chỉ dẫn khu cho màn hình cổng, camera lối vào khu, đối soát, gán / gỡ khu.</summary>
[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("api/admin/tim-xe")]
[Tags("8. TimXe · Admin: lối vào khu, đối soát")]
public class AdminTimXeController : ControllerBase
{
    /// <summary>Màn hình cổng hỏi sau khi cho xe vào: "Mời vào khu X" (null: ô tô, hoặc mọi khu đã đầy).</summary>
    [HttpGet("chi-dan/{luotGuiId:int}")]
    public async Task<IActionResult> ChiDan(int luotGuiId, [FromServices] LayChiDanUseCase uc, CancellationToken ct) =>
        await uc.ThucHienAsync(luotGuiId, ct) is { } d ? Ok(d) : NoContent();

    /// <summary>Camera lối vào khu gửi ảnh (AI đọc biển). Gõ thêm bienSo để thử khi chưa có camera.</summary>
    [HttpPost("camera/{cameraId:int}/anh"), Consumes("multipart/form-data"), RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<KetQuaCameraKhuDto> CameraAnh(int cameraId, IFormFile? anh, [FromForm] string? bienSo,
                                                    [FromServices] XuLyCameraKhuUseCase uc, CancellationToken ct)
    {
        byte[]? bytes = null;
        if (anh is { Length: > 0 })
        {
            using var ms = new MemoryStream();
            await anh.CopyToAsync(ms, ct);
            bytes = ms.ToArray();
        }
        return await uc.ThucHienAsync(cameraId, bienSo, bytes, anh?.ContentType, ct);
    }

    public record BienSoLenh(string? BienSo);

    /// <summary>Giả lập camera lối vào khu bằng biển số (demo không có camera thật).</summary>
    [HttpPost("camera/{cameraId:int}")]
    public Task<KetQuaCameraKhuDto> CameraBienSo(int cameraId, [FromBody] BienSoLenh lenh, [FromServices] XuLyCameraKhuUseCase uc, CancellationToken ct) =>
        uc.ThucHienAsync(cameraId, lenh.BienSo, null, null, ct);

    /// <summary>Mức chỗ từng khu xe máy, xe quá 15 phút chưa có khu, xe đang ghi trong khu.</summary>
    [HttpGet("doi-soat")]
    public Task<DoiSoatDto> DoiSoat([FromServices] LayDoiSoatUseCase uc, CancellationToken ct) => uc.ThucHienAsync(ct);

    /// <summary>Gán xe vào khu (khuId) hoặc gỡ khỏi khu (khuId = null), từng xe một.</summary>
    [HttpPut("gan-khu")]
    public async Task<IActionResult> GanKhu([FromBody] GanKhuLenh lenh, [FromServices] AdminGanKhuUseCase uc, CancellationToken ct)
    {
        await uc.ThucHienAsync(lenh, ct);
        return NoContent();
    }
}
