package com.example.backend.common.security.authentication.oauth2.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.common.security.authentication.oauth2.dto.OAuth2TokenRequest;
import com.example.backend.common.security.authentication.oauth2.service.OAuth2TokenService;
import com.example.backend.common.security.authentication.oauth2.dto.OAuth2TokenResponse;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class TokenController {
    private final OAuth2TokenService oauth2TokenService;

    /**
     * OAuth2 Authorization Code를 JWT 토큰으로 교환
     * 응답으로 JSON 반환 + 쿠키에 토큰 설정
     */
    @PostMapping("/oauth2/{provider}/token")
    public ApiResponse<OAuth2TokenResponse> exchangeToken(
        @PathVariable String provider,
        @Valid @RequestBody OAuth2TokenRequest request,
        HttpServletResponse response) {

        OAuth2TokenResponse tokenResponse = oauth2TokenService.exchangeCodeForToken(request, provider, response);
        
        return ApiResponse.of(tokenResponse);
    }

    /**
     * 리프레시 토큰으로 새로운 액세스 토큰 발급
     * 쿠키에서 리프레시 토큰을 추출하여 새로운 액세스 토큰을 발급합니다.
     */
    @PostMapping("/refresh")
    public ApiResponse<OAuth2TokenResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        OAuth2TokenResponse tokenResponse = oauth2TokenService.refreshAccessToken(request, response);
        return ApiResponse.of(tokenResponse);
    }

    /**
     * 사용자 로그아웃 - 리프레시 토큰 무효화
     * 인증된 사용자의 리프레시 토큰을 Redis에서 삭제합니다.
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal JwtUserInfo userInfo, HttpServletResponse response) {
        oauth2TokenService.logout(userInfo, response);
        return ApiResponse.of();
    }
}
