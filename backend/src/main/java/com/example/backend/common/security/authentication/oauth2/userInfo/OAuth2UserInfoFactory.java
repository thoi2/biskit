package com.example.backend.common.security.authentication.oauth2.userInfo;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * OAuth2 제공자에 따라 적절한 OAuth2UserInfo 구현체를 생성하는 팩토리 클래스
 */
@Slf4j
@Component
public class OAuth2UserInfoFactory {

    /**
     * OAuth2 제공자에 따라 적절한 OAuth2UserInfo 객체를 생성합니다.
     *
     * @param registrationId OAuth2 제공자 식별자 (google, kakao, naver)
     * @param attributes OAuth2 제공자로부터 받은 사용자 정보
     * @return 해당 제공자에 맞는 OAuth2UserInfo 구현체
     * @throws BusinessException 지원하지 않는 OAuth2 제공자인 경우
     */
    public OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        try {
            if (!StringUtils.hasText(registrationId)) {
                throw new BusinessException(ErrorCode.AUTH_OAUTH2_UNSUPPORTED_PROVIDER);
            }

            if (attributes == null || attributes.isEmpty()) {
                log.error("OAuth2 사용자 정보 속성이 비어있습니다: provider={}", registrationId);
                throw new BusinessException(ErrorCode.AUTH_OAUTH2_EMPTY_USER_INFO);
            }

            return switch (registrationId.toLowerCase()) {
                case "google" -> createGoogleUserInfo(attributes);
                default -> {
                    log.warn("지원하지 않는 OAuth2 제공자: {}", registrationId);
                    throw new BusinessException(ErrorCode.AUTH_OAUTH2_UNSUPPORTED_PROVIDER);
                }
            };
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("OAuth2 사용자 정보 변환 중 오류: provider={}, error={}", registrationId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.AUTH_OAUTH2_INVALID_USER_INFO_RESPONSE);
        }
    }

    private OAuth2UserInfo createGoogleUserInfo(Map<String, Object> attributes) {
        try {
            return new GoogleOAuth2UserInfo(attributes);
        } catch (Exception e) {
            log.error("Google 사용자 정보 생성 중 오류: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.AUTH_OAUTH2_INVALID_USER_INFO_RESPONSE);
        }
    }
}
