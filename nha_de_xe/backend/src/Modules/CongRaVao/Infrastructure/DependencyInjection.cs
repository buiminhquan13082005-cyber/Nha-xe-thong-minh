using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NhaXe.Modules.CongRaVao.Application;

namespace NhaXe.Modules.CongRaVao.Infrastructure;

public static class DependencyInjection
{
    /// <param name="chuKyHetHan">Bao lâu quét yêu cầu quá hạn một lần. null = không chạy tác vụ nền (dùng trong test).</param>
    public static IServiceCollection AddCongRaVaoModule(this IServiceCollection s, string connectionString, TimeSpan? chuKyHetHan = null)
    {
        s.AddDbContext<CongRaVaoDbContext>(o => o.UseSqlServer(connectionString));
        s.AddScoped<ILuotGuiQuery, LuotGuiQuery>();
        s.AddScoped<ICongRaVaoRepository, CongRaVaoRepository>();
        s.AddScoped<ICongQuery, CongQuery>();
        s.AddScoped<ICauHinhCong, CauHinhCong>();
        s.AddCongRaVaoApplication();
        if (chuKyHetHan is TimeSpan ck)
            s.AddHostedService(sp => new HetHanXacNhanNen(sp.GetRequiredService<IServiceScopeFactory>(),
                                                         sp.GetRequiredService<ILogger<HetHanXacNhanNen>>(), ck));
        return s;
    }
}
