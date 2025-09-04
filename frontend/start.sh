#!/bin/sh

# 1. Next.js 서버를 백그라운드에서 실행합니다.
# standalone 빌드 결과물 안에 있는 server.js를 실행합니다.
node /app/server.js &

# 2. Nginx를 포어그라운드(foreground)에서 실행합니다.
# 이 명령어가 실행되는 동안 컨테이너는 계속 살아있게 됩니다.
nginx -g 'daemon off;'
