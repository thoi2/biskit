package com.example.backend.common.enums;

/**
 * OAuth2 제공자 열거형
 */
public enum OAuth2Provider {
    GOOGLE("google");

    private final String registrationId;

    private OAuth2Provider(String registrationId) {
        this.registrationId = registrationId;
    }

    public String getRegistrationId() {
        return registrationId;
    }

    public static OAuth2Provider fromRegistrationId(String registrationId) {
        for (OAuth2Provider provider : values()) {//values() : 이넘 배열로 가져오는 이넘 기본 함수
            if (provider.getRegistrationId().equals(registrationId)) {
                return provider;
            }
        }
        throw new IllegalArgumentException("Unknown OAuth2 provider: " + registrationId);
    }
}