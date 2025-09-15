# frontend/Dockerfile (운영용 최종 버전)

# ==================================================================
# Stage 1: Build the application (빌드 단계)
# ==================================================================
FROM node:18-alpine AS builder
WORKDIR /app

# 🔽🔽🔽 이 부분을 추가합니다 🔽🔽🔽
# docker-compose로부터 build args를 받기 위한 선언
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=${NEXT_PUBLIC_GOOGLE_REDIRECT_URI}
# 🔼🔼🔼 여기까지 추가 🔼🔼🔼

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
# Standalone 출력을 위해 next.config.js에 output: 'standalone' 설정이 필요합니다.
RUN yarn build


# ==================================================================
# Stage 2: Run the application (실행 단계)
# ==================================================================
FROM node:18-alpine AS runner

WORKDIR /app

# 빌드 단계(builder)에서 생성된 결과물만 복사해옵니다.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 3000번 포트를 내부적으로 사용한다고 명시합니다.
EXPOSE 3000

# Next.js Standalone 서버를 실행합니다.
# server.js는 standalone 빌드 시 자동으로 생성됩니다.
CMD ["node", "server.js"]