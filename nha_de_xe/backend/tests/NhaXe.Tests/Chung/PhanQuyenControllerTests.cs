using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using NhaXe.Api.Modules.TimXe;

namespace NhaXe.Tests.Chung;

/// <summary>
/// Nhiều [Authorize(Roles = ...)] trên lớp và hàm được cộng dồn kiểu AND: vai trò thật sự được gọi là GIAO của các danh sách.
/// Lỗi cũ: duong-di ghi "ADMIN,USER" ở hàm nhưng lớp khoá "USER" nên admin bị 403. Các test này đọc attribute bằng reflection.
/// </summary>
public class PhanQuyenControllerTests
{
    private static readonly string[] MoiVaiTro = ["ADMIN", "USER"];

    /// <summary>Vai trò gọi được action. null: không giới hạn vai trò (AllowAnonymous hoặc chỉ cần đăng nhập).</summary>
    private static HashSet<string>? VaiTroGoiDuoc(MethodInfo m)
    {
        var lop = m.DeclaringType!;
        if (m.GetCustomAttribute<AllowAnonymousAttribute>() is not null || lop.GetCustomAttribute<AllowAnonymousAttribute>() is not null) return null;
        HashSet<string>? kq = null;
        foreach (var a in lop.GetCustomAttributes<AuthorizeAttribute>(true).Concat(m.GetCustomAttributes<AuthorizeAttribute>(true)))
        {
            if (string.IsNullOrWhiteSpace(a.Roles)) continue;
            var ds = a.Roles.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).ToHashSet();
            kq = kq is null ? ds : kq.Intersect(ds).ToHashSet();
        }
        return kq;
    }

    private static IEnumerable<MethodInfo> CacAction() =>
        typeof(DieuHuongController).Assembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract)
            .SelectMany(t => t.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            .Where(m => m.GetCustomAttributes<HttpMethodAttribute>().Any());

    private static MethodInfo Action(string route) =>
        Assert.Single(CacAction(), m => m.DeclaringType!.GetCustomAttribute<RouteAttribute>()?.Template == "api/dieu-huong"
                                        && m.GetCustomAttributes<HttpMethodAttribute>().Any(h => h.Template == route));

    [Theory]
    [InlineData("duong-di")]
    [InlineData("duong-ra")]
    public void XemDuong_AdminVaUserDeuGoiDuoc(string route)
    {
        var vaiTro = VaiTroGoiDuoc(Action(route));
        Assert.NotNull(vaiTro);
        Assert.Superset(MoiVaiTro.ToHashSet(), vaiTro);
        Assert.Equal(MoiVaiTro.ToHashSet(), vaiTro);
    }

    [Theory]
    [InlineData("cua-toi")]
    [InlineData("cua-toi/khu-dich")]
    [InlineData("cua-toi/ra")]
    public void PhienDieuHuong_ChiUser(string route) =>
        Assert.Equal(new HashSet<string> { "USER" }, VaiTroGoiDuoc(Action(route)));

    [Fact]
    public void KhongActionNaoBiKhoaChet_GiaoVaiTroRong()
    {
        var chet = CacAction().Where(m => VaiTroGoiDuoc(m) is { Count: 0 })
            .Select(m => $"{m.DeclaringType!.Name}.{m.Name}").ToList();
        Assert.Empty(chet);
    }
}
