# App điện thoại — Nhà xe thông minh (người dùng)

React Native + Expo SDK 58 + TypeScript, điều hướng bằng expo-router. App dành cho vai trò **USER**; Admin dùng trang web.
App gọi đúng các API mà web (`nha_de_xe/frontend`) đang dùng, qua NGINX cổng 8080.

## Chạy thử trên điện thoại (Expo Go)

Điện thoại và máy tính phải dùng **chung một mạng Wi-Fi**. Expo Go trên điện thoại phải hỗ trợ **SDK 58**
(Expo Go → Settings → "Supported SDKs").

### 1. Mở backend cho mạng LAN (chỉ làm một lần)

Trong `nha_de_xe/.env` thêm (hoặc sửa) dòng:

```
WEB_BIND=0.0.0.0
```

Mặc định là `127.0.0.1` (chỉ máy tính vào được, dùng cho VPS). Rồi chạy lại trong thư mục `nha_de_xe`:

```
docker compose up -d --build
```

> Không bao giờ dùng `docker compose down -v` (xoá dữ liệu CSDL).

Chế độ LAN chỉ dùng ở mạng tin cậy (nhà, phòng lab), **không** đặt trên VPS. Khi bật:
- Mọi máy trong mạng dùng chung giới hạn đăng nhập (khoảng 30 lần/phút). Gặp "Thử lại sau ít phút" thì đợi 1 phút.
- `/swagger` bị chặn. Cần Swagger thì đặt lại `WEB_BIND=127.0.0.1`.
- Thử xong nên đặt lại `WEB_BIND=127.0.0.1`. Chi tiết: mục "App điện thoại trong mạng LAN" trong `nha_de_xe/README.md`.

Bên dưới dùng cổng 8080 (`WEB_PORT` mặc định). Đổi `WEB_PORT` thì thay 8080 bằng số đó ở luật tường lửa và `EXPO_PUBLIC_API_URL`.

### 2. Mở cổng 8080 trên Windows Firewall (chỉ làm một lần)

PowerShell **chạy với quyền Administrator**:

```
netsh advfirewall firewall add rule name="NhaXe Web 8080" dir=in action=allow protocol=TCP localport=8080 profile=private
```

Mạng Wi-Fi phải ở chế độ **Private**: Settings → Network & internet → Wi-Fi → (tên mạng) → Network profile type → Private.
Muốn gỡ luật: `netsh advfirewall firewall delete rule name="NhaXe Web 8080"`.

Kiểm tra: trên trình duyệt của **điện thoại** mở `http://<IP-máy-tính>:8080/api/health`, thấy `{"trangThai":"OK",...}` là được.

### 3. Cấu hình địa chỉ API cho app

```
cd mobile
copy .env.example .env
```

Sửa `EXPO_PUBLIC_API_URL` trong `mobile/.env` thành IP mạng LAN của máy tính. Xem IP bằng `ipconfig`, lấy dòng
**IPv4 Address** của card **Wi-Fi** (thường dạng `192.168.x.x`; bỏ qua `172.x.x.x` của WSL / Hyper-V / Docker):

```
EXPO_PUBLIC_API_URL=http://192.168.1.105:8080
```

Không dùng `localhost` / `127.0.0.1`: trên điện thoại đó là chính điện thoại.

### 4. Chạy app

```
npm install
npx expo start --clear
```

Quét mã QR bằng Expo Go (Android) hoặc Camera (iPhone). Màn hình Bước 0 hiện **"Kết nối API: OK"** kèm tên bản API đã trả lời.
Đổi `.env` thì phải chạy lại với `--clear` (biến `EXPO_PUBLIC_*` được gắn vào lúc đóng gói).

Nếu điện thoại không tải được app (lỗi ở bước tải JS, khác với lỗi gọi API): thử `npx expo start --tunnel`.

## Kiểm tra mã

```
npx tsc --noEmit   # kiểu
npx jest           # test các hàm thuần (đọc ngày giờ, đổi lỗi API, cấu hình địa chỉ)
```

## Ghi chú

- **Web và app chạy cùng lúc được.** Nhưng 1 tài khoản chỉ đăng nhập trên 1 máy (luật nghiệp vụ): đăng nhập trên app thì phiên web
  của cùng tài khoản hết hiệu lực, và ngược lại.
- **Admin không đăng nhập trên app.** App từ chối vai trò ADMIN, nhưng lúc server trả lời thì phiên mới đã được tạo,
  nên phiên web của Admin đó sẽ bị đăng xuất.
- **HTTP không mã hoá:** Expo Go chạy được. Nếu sau này build APK riêng mà vẫn gọi `http://` thì phải bật cleartext cho Android
  (plugin `expo-build-properties`, `android.usesCleartextTraffic: true`). Dùng HTTPS thì không cần.
- **CORS:** app native không bị CORS. Chỉ `expo start --web` mới gặp CORS — bản web của app không được hỗ trợ (đã có trang web thật).
- **Ngày giờ:** API trả giờ Việt Nam không kèm múi giờ. Luôn đọc bằng `docNgay()` (`src/shared/utils/ngayGio.ts`), không dùng `new Date(chuoi)`.
- **Token** lưu bằng `expo-secure-store` (Keychain / Keystore), không dùng AsyncStorage.
- Các file `models.ts` và `services/` chép từ `nha_de_xe/frontend`, không import chéo (hai bên build độc lập).
  Đầu mỗi file chép có ghi chú: sửa ở web thì nhớ sửa ở đây.

## Các màn hình

| Màn | Đường dẫn | API chính |
|---|---|---|
| Đăng nhập / Đăng ký / Quên mật khẩu | `/dang-nhap`, `/dang-ky`, `/quen-mat-khau` | `/api/auth/*` |
| Trang chủ (tab) | `/` | `/api/tim-xe`, `/api/ra-vao`, `/api/xe`, `/api/thong-bao/so-chua-doc` |
| Xe của tôi (tab) | `/xe` | `/api/xe`, `/api/goi-cho`, `/api/xe/{id}/giay-dang-ky` |
| Tìm xe (tab), có nút "Chỉ đường ra cổng" | `/tim-xe` | `/api/tim-xe`, `/api/tim-xe/da-do-xe`, `/api/dieu-huong/*` |
| Thông báo (tab, có số chưa đọc) | `/thong-bao` | `/api/thong-bao/*` |
| Tài khoản (tab) | `/tai-khoan` | — |
| Xác nhận xe ra 60 giây (tự bật đè lên mọi màn) | `/xac-nhan-ra/[id]` | `GET /api/ra-vao`, `PUT /api/ra-vao/yeu-cau/{id}` |
| Ra vào (lịch sử) | `/ra-vao` | `/api/ra-vao` |
| Trả phí quá hạn | `/phi-qua-han/[xeId]` | `/api/xe/{id}/phi-qua-han` |
| Mua / gia hạn / huỷ gói | `/mua-goi/[xeId]` (`0` = xe đầu tiên đã duyệt) | `/api/goi-cho`, `/api/dang-ky-cho/*`, `/api/xe/{id}/dang-ky` |
| Sơ đồ chỗ trống | `/so-do` | `/api/so-xe-khu`, `/api/dieu-huong/duong-di` |
| Nhóm gia đình | `/nhom-gia-dinh` | `/api/nhom-gia-dinh/*` |
| Đổi mật khẩu | `/doi-mat-khau` | `PUT /api/auth/mat-khau` |
| Kiểm tra kết nối | `/kiem-tra-ket-noi` | `/api/health` |

Theo dõi toàn app (chỉ chạy khi đã đăng nhập, gắn ở `app/_layout.tsx`):
- `RaVaoProvider`: hỏi lại `GET /api/ra-vao` mỗi 3 giây + SignalR + khi app từ nền trở lại; có yêu cầu mới thì mở màn xác nhận và rung máy.
- `ThongBaoProvider`: số chưa đọc (mỗi 15 giây + SignalR), thẻ thông báo nổi 6 giây, bấm để đi tới màn liên quan (`dichDen.ts`).
- `DieuHuongToanCuc`: xe vừa qua cổng vào thì màn chỉ đường tự bật; thanh "Đang dẫn đường" nằm trên thanh tab.
  Camera RA của khu thấy xe (`GET /api/dieu-huong/cua-toi/ra`) thì màn **"Đường ra cổng"** tự bật: đường từ khu tới Cổng ra Y
  (`GET /api/dieu-huong/duong-ra?tuKhu=`); xe qua cổng ra thì tự đóng, màn xác nhận xe ra hiện như thường.
- Màn xác nhận xe ra luôn được ưu tiên: thẻ nổi, thanh và màn chỉ đường không che lên nó.

## Cấu trúc

```
app/                    # expo-router: mỗi file là một màn hình
  _layout.tsx           # AuthProvider + các bộ theo dõi; Stack.Protected chặn màn theo phiên
  (auth)/               # đăng nhập, đăng ký, quên mật khẩu
  (tabs)/               # thanh tab dưới: index, xe, tim-xe, thong-bao, tai-khoan
  xac-nhan-ra/[id].tsx, ra-vao.tsx, phi-qua-han/[xeId].tsx, mua-goi/[xeId].tsx, so-do.tsx, nhom-gia-dinh.tsx, doi-mat-khau.tsx
src/
  container.ts          # composition root: chọn cài đặt cụ thể cho từng interface
  shared/api/           # httpClient (IHttpClient, FetchHttpClient), cauHinh, loiApi
  shared/auth/          # SecureTokenStore (ITokenStore), AuthContext (useAuth)
  shared/realtime/      # SignalRKenh (IKenhThoiGianThuc), useNgheThongBao
  shared/ui/            # Nut, The, ThongBao, Nhan, ONhap, ChonMot, ManHinh, KhungTai, useTaiDuLieu, useDichDen
  shared/utils/         # ngayGio (docNgay, dinhDangNgay), format
  shared/theme.ts       # màu theo nha_de_xe/frontend/src/styles.css
  modules/<module>/     # models.ts, services/ chép từ web; hàm thuần có test (*.test.ts)
```

## Chưa làm / khác web

- `GET /api/bai/cho-trong`: web người dùng không còn dùng (đường `/cho-trong` của web chuyển sang `/so-do` dùng `/api/so-xe-khu`), nên app cũng không dùng.
- Thông báo đẩy khi app đã đóng (giai đoạn 2): chưa làm, chờ duyệt.
- Ảnh giấy đăng ký: app thu nhỏ còn tối đa 1600px, JPEG 0.8 trước khi gửi (web gửi nguyên ảnh).
