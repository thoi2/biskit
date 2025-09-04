# frontend/Dockerfile
# 운영(Production) 환경을 위한 Dockerfile

# ==================================================================
# Stage 1: Build the application (빌드 단계)
# ==================================================================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

# (★핵심 수정★)
# 개발용 Dockerfile과 동일하게 Corepack과 빌드 도구를 사용하여 안정성을 높입니다.
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    corepack enable && \
    yarn install --frozen-lockfile && \
    apk del .build-deps

COPY . .

# Next.js 애플리케이션을 프로덕션용으로 빌드합니다.
RUN yarn build


# ==================================================================
# Stage 2: Serve the application with Nginx (실행 단계)
# ==================================================================
FROM nginx:stable-alpine

# 1. Next.js Standalone 서버 실행에 필요한 Node.js를 설치합니다.
RUN apk add --no-cache nodejs

# 2. Next.js 서버가 모든 네트워크에서 요청을 받도록 설정합니다.
ENV HOSTNAME 0.0.0.0

# 3. 빌드 단계(builder)에서 생성된 결과물만 복사해옵니다.
#    - /app/.next/standalone: 최적화된 Next.js 서버 파일
#    - /app/.next/static: CSS, JS 등 정적 파일
#    - /app/public: public 폴더의 파일들 (이미지 등)
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

# 4. Nginx 설정 파일과 시작 스크립트를 복사합니다.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY start.sh /start.sh

# 5. 시작 스크립트에 실행 권한을 부여합니다.
RUN chmod +x /start.sh

# 80번 포트를 외부에 노출합니다.
EXPOSE 80

# 6. 컨테이너가 시작될 때 start.sh 스크립트를 실행합니다.
CMD ["/start.sh"]
