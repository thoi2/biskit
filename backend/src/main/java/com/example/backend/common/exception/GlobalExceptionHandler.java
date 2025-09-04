package com.example.backend.common.exception;

import com.example.backend.common.response.ErrorResponse;
import com.example.backend.common.response.ValidationError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 비즈니스 로직 관련 예외 처리
     */
    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ErrorResponse<Void>> handleBusinessException(BusinessException e) {
        log.warn("BusinessException: {}", e.getMessage());

        ErrorCode errorCode = e.getErrorCode();
        ErrorResponse<Void> response = ErrorResponse.of(
            errorCode,
            e.getMessage()
        );

        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    /**
     * @Valid 검증 실패 예외 처리
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ErrorResponse<List<ValidationError>>> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        log.warn("MethodArgumentNotValidException: {}", e.getMessage());

        List<ValidationError> errors = e.getBindingResult().getFieldErrors().stream()
            .map(error -> ValidationError.of(
                error.getField(),
                error.getDefaultMessage(),
                error.getRejectedValue()
            ))
            .toList();

        ErrorResponse<List<ValidationError>> response = ErrorResponse.of(
            ErrorCode.COMMON_INVALID_INPUT,
            errors
        );

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * @ModelAttribute 검증 실패 예외 처리
     */
    @ExceptionHandler(BindException.class)
    protected ResponseEntity<ErrorResponse<List<ValidationError>>> handleBindException(BindException e) {
        log.warn("BindException: {}", e.getMessage());

        List<ValidationError> errors = e.getBindingResult().getFieldErrors().stream()
            .map(error -> ValidationError.of(
                error.getField(),
                error.getDefaultMessage(),
                error.getRejectedValue()
            ))
            .toList();

        ErrorResponse<List<ValidationError>> response = ErrorResponse.of(
            ErrorCode.COMMON_INVALID_INPUT,
            errors
        );

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 타입 불일치 예외 처리
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    protected ResponseEntity<ErrorResponse<Void>> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.warn("MethodArgumentTypeMismatchException: {}", e.getMessage());

        ErrorResponse<Void> response = ErrorResponse.of(
            ErrorCode.COMMON_INVALID_TYPE,
            e.getValue() + "의 타입이 올바르지 않습니다."
        );

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * HTTP 메서드 미지원 예외 처리
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    protected ResponseEntity<ErrorResponse<Void>> handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
        log.warn("HttpRequestMethodNotSupportedException: {}", e.getMessage());

        ErrorResponse<Void> response = ErrorResponse.of(
            ErrorCode.COMMON_METHOD_NOT_ALLOWED,
            e.getMethod() + " 메서드는 지원하지 않습니다."
        );

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }

    /**
     * JSON 파싱 에러 예외 처리
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    protected ResponseEntity<ErrorResponse<Void>> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        log.warn("HttpMessageNotReadableException: {}", e.getMessage());

        ErrorResponse<Void> response = ErrorResponse.of(
            ErrorCode.COMMON_INVALID_INPUT,
            "요청 본문을 읽을 수 없습니다."
        );

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 리소스를 찾을 수 없음 예외 처리 (Spring 6+)
     */
    @ExceptionHandler(NoResourceFoundException.class)
    protected ResponseEntity<ErrorResponse<Void>> handleNoResourceFoundException(NoResourceFoundException e) {
        log.warn("NoResourceFoundException: {}", e.getMessage());

        ErrorResponse<Void> response = ErrorResponse.of(ErrorCode.COMMON_NOT_FOUND);

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * 잘못된 인수 예외 처리
     */
    @ExceptionHandler(IllegalArgumentException.class)
    protected ResponseEntity<ErrorResponse<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("IllegalArgumentException: {}", e.getMessage());

        ErrorResponse<Void> response = ErrorResponse.of(
            ErrorCode.COMMON_INVALID_INPUT,
            e.getMessage()
        );

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 그 외 모든 예외 처리
     */
    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse<Void>> handleException(Exception e) {
        log.error("Unexpected exception: ", e);

        ErrorResponse<Void> response = ErrorResponse.of(ErrorCode.COMMON_INTERNAL_SERVER_ERROR);

        return ResponseEntity.internalServerError().body(response);
    }
}