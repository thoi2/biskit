package com.example.backend.common.exception;

import org.springframework.http.HttpStatus;
import static org.springframework.http.HttpStatus.*;

public enum ErrorCode {

    // 공통 도메인 에러
    COMMON_INVALID_INPUT(BAD_REQUEST, "COMMON_INVALID_INPUT", "잘못된 입력값입니다."),
    COMMON_INVALID_TYPE(BAD_REQUEST, "COMMON_INVALID_TYPE", "잘못된 타입입니다."),
    COMMON_NOT_FOUND(NOT_FOUND, "COMMON_NOT_FOUND", "요청한 리소스를 찾을 수 없습니다."),
    COMMON_METHOD_NOT_ALLOWED(METHOD_NOT_ALLOWED, "COMMON_METHOD_NOT_ALLOWED", "허용되지 않는 메서드입니다."),
    COMMON_INTERNAL_SERVER_ERROR(INTERNAL_SERVER_ERROR, "COMMON_INTERNAL_SERVER_ERROR", "내부 서버 오류입니다."),
    COMMON_INVALID_REQUEST(BAD_REQUEST, "COMMON_INVALID_REQUEST", "잘못된 요청입니다."),
    COMMON_ENTITY_NOT_FOUND(NOT_FOUND, "COMMON_ENTITY_NOT_FOUND", "요청한 엔티티를 찾을 수 없습니다."),



    // Store 범위 검색 에러
    STORE_INVALID_BOUNDS(BAD_REQUEST, "STORE_INVALID_BOUNDS", "잘못된 영역 범위입니다."),
    STORE_TOO_LARGE_BOUNDS(BAD_REQUEST, "STORE_TOO_LARGE_BOUNDS", "검색 범위가 너무 큽니다. 범위를 줄여주세요."),

    // 인증 도메인 에러
    AUTH_TOKEN_MISSING(UNAUTHORIZED, "AUTH_TOKEN_MISSING", "인증 토큰이 필요합니다."),
    AUTH_INVALID_SIGNATURE(UNAUTHORIZED, "AUTH_INVALID_SIGNATURE", "토큰 서명이 유효하지 않습니다."),
    AUTH_MALFORMED_TOKEN(UNAUTHORIZED, "AUTH_MALFORMED_TOKEN", "토큰 형식이 올바르지 않습니다."),
    AUTH_MISSING_REQUIRED_CLAIM(UNAUTHORIZED, "AUTH_MISSING_REQUIRED_CLAIM", "필수 토큰 정보가 누락되었습니다."),
    AUTH_OAUTH2_INVALID_CODE(BAD_REQUEST, "AUTH_OAUTH2_INVALID_CODE", "유효하지 않은 OAuth2 인증 코드입니다."),
    AUTH_OAUTH2_MISSING_ACCESS_TOKEN(BAD_REQUEST, "AUTH_OAUTH2_MISSING_ACCESS_TOKEN", "OAuth2 응답에 액세스 토큰이 없습니다."),
    AUTH_OAUTH2_USER_INFO_FAILED(BAD_REQUEST, "AUTH_OAUTH2_USER_INFO_FAILED", "OAuth2 사용자 정보 처리에 실패했습니다."),
    AUTH_OAUTH2_INVALID_USER_INFO_RESPONSE(BAD_REQUEST, "AUTH_OAUTH2_INVALID_USER_INFO_RESPONSE", "OAuth2 사용자 정보 응답이 올바르지 않습니다."),
    AUTH_OAUTH2_EMPTY_USER_INFO(BAD_REQUEST, "AUTH_OAUTH2_EMPTY_USER_INFO", "OAuth2 사용자 정보가 비어있습니다."),
    AUTH_OAUTH2_UNSUPPORTED_PROVIDER(BAD_REQUEST, "AUTH_OAUTH2_UNSUPPORTED_PROVIDER", "지원하지 않는 OAuth2 제공자입니다."),
    AUTH_UNSUPPORTED_OAUTH2_PROVIDER(BAD_REQUEST, "AUTH_UNSUPPORTED_OAUTH2_PROVIDER", "지원하지 않는 OAuth2 제공자입니다."),
    AUTH_OAUTH2_AUTHENTICATION_FAILED(UNAUTHORIZED, "AUTH_OAUTH2_AUTHENTICATION_FAILED", "OAuth2 인증에 실패했습니다."),
    AUTH_USER_NOT_FOUND(UNAUTHORIZED, "AUTH_USER_NOT_FOUND", "사용자를 찾을 수 없습니다."),
    
    // 리프레시 토큰 전용 에러
    AUTH_REFRESH_TOKEN_INVALID(UNAUTHORIZED, "AUTH_REFRESH_TOKEN_INVALID", "리프레시 토큰이 유효하지 않습니다."),
    AUTH_REFRESH_TOKEN_EXPIRED(UNAUTHORIZED, "AUTH_REFRESH_TOKEN_EXPIRED", "리프레시 토큰이 만료되었습니다."),
    AUTH_REFRESH_TOKEN_ALREADY_USED(UNAUTHORIZED, "AUTH_REFRESH_TOKEN_ALREADY_USED", "리프레시 토큰이 이미 사용되었습니다."),
    AUTH_REFRESH_TOKEN_MISUSED(UNAUTHORIZED, "AUTH_REFRESH_TOKEN_MISUSED", "리프레시 토큰을 잘못된 용도로 사용했습니다."),
    
    // 액세스 토큰 전용 에러 (기존 에러와 구분)
    AUTH_ACCESS_TOKEN_INVALID(UNAUTHORIZED, "AUTH_ACCESS_TOKEN_INVALID", "액세스 토큰이 유효하지 않습니다."),
    AUTH_ACCESS_TOKEN_EXPIRED(UNAUTHORIZED, "AUTH_ACCESS_TOKEN_EXPIRED", "액세스 토큰이 만료되었습니다."),
    AUTH_ACCESS_TOKEN_MISUSED(UNAUTHORIZED, "AUTH_ACCESS_TOKEN_MISUSED", "액세스 토큰을 잘못된 용도로 사용했습니다.");


    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}