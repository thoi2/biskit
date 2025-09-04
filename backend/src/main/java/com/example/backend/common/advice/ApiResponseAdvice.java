package com.example.backend.common.advice;

import com.example.backend.common.response.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * ApiResponse의 status 필드를 읽어서 HTTP 상태 코드를 자동으로 설정하는 Advice
 *
 * @RestController에서 ApiResponse를 반환할 때,
 * status 필드 값에 따라 적절한 HTTP 상태 코드로 변환하여 응답한다.
 */
@RestControllerAdvice
public class ApiResponseAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        return ApiResponse.class.isAssignableFrom(returnType.getParameterType());
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class selectedConverterType, ServerHttpRequest request,
                                  ServerHttpResponse response) {

        response.setStatusCode(HttpStatus.valueOf(((ApiResponse<?>) body).status()));

        return body;
    }
}