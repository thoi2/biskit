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
    COMMON_ENTITY_NOT_FOUND(NOT_FOUND, "COMMON_ENTITY_NOT_FOUND", "요청한 엔티티를 찾을 수 없습니다.");

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