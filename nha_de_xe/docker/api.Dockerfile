# Buổi 6: multi-stage. Stage 1 có SDK để build + test; stage 2 chỉ có runtime nên image nhỏ, không chứa mã nguồn.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
# Máy sau proxy có chứng chỉ riêng: đặt .crt vào docker/certs (bình thường để trống)
COPY docker/certs/ /usr/local/share/ca-certificates/
RUN update-ca-certificates >/dev/null 2>&1 || true
WORKDIR /src
COPY backend/ .
COPY models/ /models/
RUN dotnet restore
# Buổi 10: unit test chạy ngay trong build; test hỏng thì build hỏng, không ra được image để deploy.
RUN dotnet test tests/NhaXe.Tests --no-restore -c Release
RUN dotnet publish src/Api/NhaXe.Api.csproj -c Release --no-restore -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# Thư mục ảnh giấy đăng ký xe: user "app" phải ghi được. Compose gắn volume "uploads" vào đây để 2 bản API dùng chung.
RUN mkdir -p /app/uploads && chown app:app /app/uploads
# Buổi 5: chạy bằng user thường "app" (có sẵn trong image .NET 8 trở lên), không chạy root.
USER app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "NhaXe.Api.dll"]
