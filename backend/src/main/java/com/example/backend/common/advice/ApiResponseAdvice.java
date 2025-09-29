package com.example.backend.common.advice;

import com.example.backend.common.response.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice
public class ApiResponseAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {

        // Type Erasure로 인해 정확한 타입 감지가 어려우므로 body 내용으로 판단
        boolean isApiResponse = ApiResponse.class.isAssignableFrom(returnType.getParameterType());

        // 모든 응답을 처리하고 beforeBodyWrite에서 실제 타입 확인
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {


        // 실제 body가 ApiResponse인 경우에만 처리
        if (body instanceof ApiResponse<?> apiResponse) {
            response.setStatusCode(HttpStatus.valueOf(apiResponse.status()));
            return body;
        }

        return body;
    }
}
