package com.example.backend.user.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 사용자 정보 응답 DTO
 */
@Getter
@Builder
public class UserResponse {
    private final Long userId;
    private final String email;
    private final String name;
    private final String profileImageUrl;
    private final String oauth2Provider;
}