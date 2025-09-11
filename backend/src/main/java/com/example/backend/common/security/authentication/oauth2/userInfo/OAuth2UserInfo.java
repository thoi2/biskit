package com.example.backend.common.security.authentication.oauth2.userInfo;

/**
 * OAuth2 제공자로부터 받은 사용자 정보를 추상화한 인터페이스
 * 각 OAuth2 제공자(Google, Kakao, Naver 등)마다 다른 응답 형식을 통일된 인터페이스로 제공합니다.
 */
public interface OAuth2UserInfo {

    /**
     * OAuth2 제공자에서 제공하는 사용자 고유 ID
     * @return 사용자 고유 ID
     */
    String getId();

    /**
     * 사용자 이메일 주소
     * @return 이메일 주소
     */
    String getEmail();

    /**
     * 사용자 이름
     * @return 사용자 이름
     */
    String getName();

    /**
     * 사용자 프로필 이미지 URL
     * @return 프로필 이미지 URL, 없으면 null
     */
    String getImageUrl();
}
