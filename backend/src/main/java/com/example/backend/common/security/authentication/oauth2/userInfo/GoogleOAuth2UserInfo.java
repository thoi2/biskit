package com.example.backend.common.security.authentication.oauth2.userInfo;

import java.util.Map;

/**
 * Google OAuth2 사용자 정보 구현체
 * Google에서 제공하는 사용자 정보 형식에 맞춰 구현됩니다.
 *
 * Google 응답 예시:
 * {
 *   "id": "123456789",
 *   "email": "user@gmail.com",
 *   "verified_email": true,
 *   "name": "홍길동",
 *   "given_name": "길동",
 *   "family_name": "홍",
 *   "picture": "https://lh3.googleusercontent.com/...",
 *   "locale": "ko"
 * }
 */
public class GoogleOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getId() {
        return (String) attributes.get("id");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getImageUrl() {
        return (String) attributes.get("picture");
    }
}