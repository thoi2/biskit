package com.example.backend.common.security.exception;

import com.example.backend.common.exception.ErrorCode;
import com.example.backend.common.response.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
@Component
public class JwtAuthenticationExceptionHandler {

    private final ObjectMapper objectMapper;

    // === 액세스 토큰 전용 에러 처리 ===
    
    /**
     * 액세스 토큰이 요청에 없는 경우 에러 응답
     */
    public void handleAccessTokenMissing(HttpServletResponse response, String requestUri) throws IOException {
        log.warn("액세스 토큰이 없습니다. URI: {}", requestUri);
        createErrorResponse(response, ErrorCode.AUTH_TOKEN_MISSING, HttpStatus.UNAUTHORIZED);
    }

    /**
     * JWT 토큰이 요청에 없는 경우 에러 응답 (하위 호환성)
     */
    public void handleMissingToken(HttpServletResponse response, String requestUri) throws IOException {
        handleAccessTokenMissing(response, requestUri);
    }

    public void handleAccessTokenExpired(HttpServletResponse response, String message) throws IOException {
        log.warn("액세스 토큰이 만료되었습니다: {}", message);
        createErrorResponse(response, ErrorCode.AUTH_ACCESS_TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);
    }

    public void handleAccessTokenInvalidSignature(HttpServletResponse response, String message) throws IOException {
        log.warn("액세스 토큰 서명이 유효하지 않습니다: {}", message);
        createErrorResponse(response, ErrorCode.AUTH_INVALID_SIGNATURE, HttpStatus.UNAUTHORIZED);
    }

    public void handleAccessTokenMalformed(HttpServletResponse response, String message) throws IOException {
        log.warn("액세스 토큰 형식이 잘못되었습니다: {}", message);
        createErrorResponse(response, ErrorCode.AUTH_MALFORMED_TOKEN, HttpStatus.UNAUTHORIZED);
    }

    public void handleAccessTokenMissingRequiredClaim(HttpServletResponse response, String missingClaim) throws IOException {
        log.warn("액세스 토큰에 필수 클레임이 없습니다: {}", missingClaim);
        createErrorResponse(response, ErrorCode.AUTH_MISSING_REQUIRED_CLAIM, HttpStatus.UNAUTHORIZED);
    }

    public void handleAccessTokenInvalid(HttpServletResponse response, String message) throws IOException {
        log.warn("액세스 토큰이 유효하지 않습니다: {}", message);
        createErrorResponse(response, ErrorCode.AUTH_ACCESS_TOKEN_INVALID, HttpStatus.UNAUTHORIZED);
    }

    public void handleAccessTokenMisused(HttpServletResponse response, String message) throws IOException {
        log.warn("액세스 토큰 잘못된 사용: {}", message);
        createErrorResponse(response, ErrorCode.AUTH_ACCESS_TOKEN_MISUSED, HttpStatus.UNAUTHORIZED);
    }

    // === 리프레시 토큰 전용 에러 처리 ===
    
    public void handleRefreshTokenMisused(HttpServletResponse response, String message) throws IOException {
        log.error("리프레시 토큰 잘못된 사용 (보안 위반): {}", message);
        createErrorResponse(response, ErrorCode.AUTH_REFRESH_TOKEN_MISUSED, HttpStatus.UNAUTHORIZED);
    }

    // === 하위 호환성을 위한 기존 메서드들 ===
    
    public void handleExpiredToken(HttpServletResponse response, String message) throws IOException {
        handleAccessTokenExpired(response, message);
    }

    public void handleInvalidSignature(HttpServletResponse response, String message) throws IOException {
        handleAccessTokenInvalidSignature(response, message);
    }

    public void handleMalformedToken(HttpServletResponse response, String message) throws IOException {
        handleAccessTokenMalformed(response, message);
    }

    public void handleMissingRequiredClaim(HttpServletResponse response, String missingClaim) throws IOException {
        handleAccessTokenMissingRequiredClaim(response, missingClaim);
    }

    public void handleInvalidToken(HttpServletResponse response, String message) throws IOException {
        handleAccessTokenInvalid(response, message);
    }

    /**
     * JWT 토큰 처리 중 예상치 못한 오류 발생 시 에러 응답
     *
     * @param response HTTP 응답 객체
     * @param throwable 발생한 예외
     * @throws IOException 응답 작성 중 I/O 오류 발생 시
     */
    public void handleUnexpectedError(HttpServletResponse response, Throwable throwable) throws IOException {
        log.error("JWT 토큰 처리 중 예상치 못한 오류가 발생했습니다", throwable);
        createErrorResponse(response, ErrorCode.COMMON_INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * 공통 에러 응답 작성 메서드
     * HTTP 응답에 JSON 형태의 표준화된 에러 정보를 작성합니다.
     *
     * @param response HTTP 응답 객체
     * @param errorCode 에러 코드
     * @param status HTTP 상태 코드
     * @throws IOException 응답 작성 중 I/O 오류 발생 시
     */
    private void createErrorResponse(HttpServletResponse response, ErrorCode errorCode, HttpStatus status) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ErrorResponse<Void> errorResponse = ErrorResponse.of(errorCode);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
