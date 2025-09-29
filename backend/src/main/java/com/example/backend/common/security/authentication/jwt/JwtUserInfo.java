package com.example.backend.common.security.authentication.jwt;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;

import java.security.Principal;
import java.util.Optional;

/**
 * JWT 사용자 정보를 담는 레코드 클래스
 * 필수 필드에 대한 검증을 수행합니다.
 */
public record JwtUserInfo (
    String userId,
    String username,
    String oauth2Provider,
    String oauth2ProviderId,
    String profileImageUrl
) implements Principal {
    public JwtUserInfo {
        validateRequired(userId, "User ID");
        validateRequired(username, "Username");
        validateRequired(oauth2Provider, "OAuth2 provider");
        validateRequired(oauth2ProviderId, "OAuth2 provider ID");
        // profileImageUrl은 선택적 필드이므로 검증하지 않음
    }

    private static void validateRequired(String value, String fieldName) {
        Optional.ofNullable(value)
            .filter(s -> !s.trim().isEmpty())
            .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_MISSING_REQUIRED_CLAIM));
    }

    @Override
    public String getName() {
        return username;
    }
}
