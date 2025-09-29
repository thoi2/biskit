package com.example.backend.common.security.authentication.oauth2.dto;

import lombok.Builder;

@Builder
public record OAuth2TokenResponse(
    UserInfo user
) {
    @Builder
    public record UserInfo(
        Long userId,
        String email,
        String name,
        String profileImageUrl
    ) {
    }

}