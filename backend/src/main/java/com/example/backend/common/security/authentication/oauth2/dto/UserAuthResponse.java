package com.example.backend.common.security.authentication.oauth2.dto;

import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import lombok.Builder;
import lombok.Getter;

/**
 * 인증 상태 확인 응답 DTO
 */
@Getter
@Builder
public class UserAuthResponse {
    private final JwtUserInfo user;
}