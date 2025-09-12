package com.example.backend.common.security.authentication.oauth2.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * OAuth2 Authorization Code를 JWT 토큰으로 교환하기 위한 요청 DTO
 */
public record OAuth2TokenRequest(
    @NotBlank(message = "Authorization code는 필수입니다.")
    String code
) { }