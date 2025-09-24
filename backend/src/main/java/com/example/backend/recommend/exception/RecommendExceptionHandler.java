package com.example.backend.recommend.exception;

import com.example.backend.common.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * recommend 도메인 전용 예외 핸들러
 * - HTTP 상태는 공통 ErrorCode의 HttpStatus 사용
 * - 응답 code 값은 도메인 식별을 위해 RecommendErrorCode.name()을 내려줌
 *   (공통 시스템 코드를 쓰고 싶다면 rec.getSystemCode()로 교체)
 */
@RestControllerAdvice(basePackages = "com.example.backend.recommend")
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
public class RecommendExceptionHandler {

    @ExceptionHandler(RecommendException.class)
    public ResponseEntity<ErrorResponse<Void>> handle(RecommendException ex) {
        RecommendErrorCode rec = ex.getRecommendCode();
        HttpStatus status = rec.getHttpStatus();

        // 도메인 전용 코드/메시지로 응답 (공통 시스템코드를 쓰려면 rec.getSystemCode()로 바꾸세요)
        ErrorResponse<Void> body = ErrorResponse.of(
                status.value(),
                rec.name(),        // "INVALID_RECOMMEND_TYPE"처럼 도메인 전용 코드 노출
                rec.getMessage()
        );

        return ResponseEntity.status(status).body(body);
    }
}
