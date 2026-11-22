#!/bin/sh
# Chạy lúc container web khởi động (thư mục /docker-entrypoint.d của image NGINX), TRƯỚC khi NGINX đọc cấu hình.
# Sinh /etc/nginx/conf.d/00-che-do-mang.conf (mức http, nạp trước default.conf) theo biến WEB_BIND của docker-compose:
#
#  - WEB_BIND là địa chỉ loopback (127.0.0.1 mặc định, 127.x, localhost, ::1; VPS): chỉ NGINX của VPS gọi vào
#    và gửi X-Real-IP là IP thật của khách.
#    Tin header đó, giới hạn /api/auth/ 20 yêu cầu/phút cho MỖI IP khách, Swagger mở như cũ.
#  - WEB_BIND khác (ví dụ 0.0.0.0 để thử app điện thoại trong mạng LAN): máy khác gọi thẳng vào, Docker đổi mọi
#    địa chỉ nguồn thành IP cổng Docker. KHÔNG tin X-Real-IP (máy trong LAN tự gửi header giả để lách giới hạn được),
#    mọi máy dùng chung một suất giới hạn nên nới lên 60 yêu cầu/phút, và chặn hẳn /swagger (không phân biệt được
#    máy nào gọi: Docker đổi địa chỉ nguồn, còn header Host thì máy khách tự đặt được). Cần Swagger thì tắt chế độ LAN.
set -eu
TEP=/etc/nginx/conf.d/00-che-do-mang.conf

case "${WEB_BIND:-127.0.0.1}" in
  127.*|localhost|::1|\[::1\]) CHE_DO=may-chu ;;
  *) CHE_DO=lan ;;
esac

if [ "$CHE_DO" = may-chu ]; then
  cat > "$TEP" <<'HET'
# Sinh bởi /docker-entrypoint.d/15-che-do-mang.sh: chế độ máy chủ (WEB_BIND là địa chỉ loopback).
set_real_ip_from 127.0.0.1;
set_real_ip_from 172.16.0.0/12;
real_ip_header X-Real-IP;
limit_req_zone $binary_remote_addr zone=dang_nhap:10m rate=20r/m;
map $host $chan_swagger { default 0; }
HET
else
  echo "CẢNH BÁO: WEB_BIND=${WEB_BIND}: web mở cho cả mạng. Chỉ dùng ở mạng LAN tin cậy khi thử app điện thoại, KHÔNG dùng trên VPS (Docker mở cổng vượt qua tường lửa UFW)." >&2
  cat > "$TEP" <<'HET'
# Sinh bởi /docker-entrypoint.d/15-che-do-mang.sh: chế độ LAN (WEB_BIND không phải địa chỉ loopback).
# Không tin X-Real-IP. Mọi máy trong LAN đi qua cùng một IP cổng Docker nên dùng chung suất giới hạn này.
limit_req_zone $binary_remote_addr zone=dang_nhap:10m rate=60r/m;
map $host $chan_swagger { default 1; }
HET
fi
