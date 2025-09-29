package com.example.backend.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
    boolean success,
    int status,
    T body
) {

    public static <T> ApiResponse<T> of(T body) {
        return new ApiResponse<>(true, 200, body);
    }

    public static <T> ApiResponse<T> of(int status, T body) {
        return new ApiResponse<>(true, status, body);
    }

    public static ApiResponse<Void> of() {
        return new ApiResponse<>(true, 200, null);
    }

    public static ApiResponse<Void> of(int status) {
        return new ApiResponse<>(true, status, null);
    }
}