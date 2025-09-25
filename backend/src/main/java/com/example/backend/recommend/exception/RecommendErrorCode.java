package com.example.backend.recommend.exception;

import com.example.backend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;

/**
 * recommend 전용 에러코드
 * - HTTP 상태/시스템코드는 공통 ErrorCode를 따라가되
 * - 노출 메시지는 도메인 전용으로 커스터마이즈
 */
public enum RecommendErrorCode {

    INVALID_RECOMMEND_TYPE(ErrorCode.COMMON_INVALID_INPUT, "지원하지 않는 추천 타입입니다."),
    QUERY_VALIDATION_FAILED(ErrorCode.COMMON_INVALID_INPUT, "추천 요청이 유효하지 않습니다."),
    NO_RECOMMENDATION(ErrorCode.COMMON_NOT_FOUND, "추천 결과가 존재하지 않습니다."),
    AI_UPSTREAM_TIMEOUT(ErrorCode.COMMON_GATEWAY_TIMEOUT, "AI 서버 응답이 지연되었습니다."),
    AI_UPSTREAM_BAD_RESPONSE(ErrorCode.COMMON_BAD_GATEWAY, "AI 서버 응답이 올바르지 않습니다."),
    AI_UPSTREAM_RATE_LIMITED(ErrorCode.COMMON_TOO_MANY_REQUESTS, "AI 서버 요청이 제한되었습니다."),
    AI_UPSTREAM_UNAVAILABLE(ErrorCode.COMMON_SERVICE_UNAVAILABLE, "AI 서버가 일시적으로 불가 상태입니다."),
    AI_UPSTREAM_AUTH_FAILED(ErrorCode.COMMON_BAD_GATEWAY, "AI 서버 인증에 실패했습니다."),
    GEO_NOT_FOUND(ErrorCode.COMMON_NOT_FOUND, "해당 좌표에서 주소 관리번호(ADR)를 찾지 못했습니다."),
    GEO_UPSTREAM_TIMEOUT(ErrorCode.COMMON_GATEWAY_TIMEOUT, "지오코더 응답이 지연되었습니다."),
    GEO_UPSTREAM_BAD_RESPONSE(ErrorCode.COMMON_BAD_GATEWAY, "지오코더 응답이 올바르지 않습니다.");

    private final ErrorCode commonCode;  // 공통 에러코드(HTTP 상태/시스템 코드 보유)
    private final String message;        // 도메인 전용 응답 메시지

    RecommendErrorCode(ErrorCode commonCode, String message) {
        this.commonCode = commonCode;
        this.message = message;
    }

    public ErrorCode getCommonCode() {
        return commonCode;
    }
    public String getMessage() {
        return message;
    }
    public HttpStatus getHttpStatus() {
        return commonCode.getStatus(); // 이미 HttpStatus 타입
    }
    /** 공통 시스템 코드(e.g., "COMMON_INVALID_INPUT")가 필요하면 사용 */
    public String getSystemCode() {
        return commonCode.getCode();
    }
}
