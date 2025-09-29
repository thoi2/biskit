package com.example.backend.common.response;

import com.example.backend.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse<T>(
    boolean success,
    int status,
    String code,
    String message,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime timestamp,
    T body
) {

    public static <T> ErrorResponse<T> of(int status, String code, String message, T body) {
        return new ErrorResponse<>(false, status, code, message, LocalDateTime.now(), body);
    }

    public static ErrorResponse<Void> of(int status, String code, String message) {
        return new ErrorResponse<>(false, status, code, message, LocalDateTime.now(), null);
    }

    public static ErrorResponse<Void> of(ErrorCode errorCode) {
        return new ErrorResponse<>(false, errorCode.getStatus().value(), errorCode.getCode(), errorCode.getMessage(), LocalDateTime.now(), null);
    }

    public static <T> ErrorResponse<T> of(ErrorCode errorCode, T body) {
        return new ErrorResponse<>(false, errorCode.getStatus().value(), errorCode.getCode(), errorCode.getMessage(), LocalDateTime.now(), body);
    }

    public static ErrorResponse<Void> of(ErrorCode errorCode, String message) {
        return new ErrorResponse<>(false, errorCode.getStatus().value(), errorCode.getCode(), message, LocalDateTime.now(), null);
    }

    public static <T> ErrorResponse<T> of(ErrorCode errorCode, String message, T body) {
        return new ErrorResponse<>(false, errorCode.getStatus().value(), errorCode.getCode(), message, LocalDateTime.now(), body);
    }
}
