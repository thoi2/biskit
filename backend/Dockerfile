# =============================================================================
# Multi-stage 빌드로 최적화된 Spring Boot 3.5.5 + Java 21 Dockerfile
# =============================================================================

# Stage 1: 빌드 스테이지
FROM gradle:8.5-jdk21 AS builder

# 작업 디렉토리 설정
WORKDIR /app

# Gradle wrapper 및 빌드 파일들 복사
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./

# (★핵심 수정★) gradlew 파일에 실행 권한을 부여합니다.
RUN chmod +x ./gradlew

# 의존성 다운로드 (캐시 활용)
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사
COPY src/ src/

# 애플리케이션 빌드 (테스트 제외)
RUN ./gradlew clean build -x test --no-daemon

# Stage 2: 런타임 스테이지 (Eclipse Temurin 사용)
FROM eclipse-temurin:21-jre-alpine

# 보안을 위한 비루트 사용자 생성
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 스테이지에서 JAR 파일 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 파일 소유권 변경
RUN chown appuser:appgroup app.jar

# 비루트 사용자로 전환
USER appuser

# 포트 노출
EXPOSE 8080

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# JVM 최적화 옵션과 함께 애플리케이션 실행
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-XX:+UseStringDeduplication", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
