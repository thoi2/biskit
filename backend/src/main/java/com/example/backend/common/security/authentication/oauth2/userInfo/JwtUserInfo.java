package com.example.backend.common.security.authentication.oauth2.userInfo;

/**
 * JWT 토큰에 담을 사용자 정보를 정의하는 레코드 클래스입니다.
 * 이 정보는 인증된 사용자의 주요 식별 정보를 나타냅니다.
 */
// Java 17+의 record를 사용하면 Getter, 생성자 등을 자동으로 만들어주어 코드가 간결해집니다.
public record JwtUserInfo(
        Long userId,
        String email,
        String name,
        String profileImageUrl) {
}
