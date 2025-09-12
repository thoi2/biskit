package com.example.backend.common.security.authentication.oauth2.provider;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import com.example.backend.common.security.authentication.oauth2.userInfo.OAuth2UserInfo;
import com.example.backend.common.security.authentication.oauth2.userInfo.OAuth2UserInfoFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import java.util.Map;

@Component("google")
@RequiredArgsConstructor
public class GoogleOAuth2Provider implements OAuth2ProviderStrategy {

    private final OAuth2UserInfoFactory oauth2UserInfoFactory;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String redirectUri;

    @Override
    public String getProviderName() {
        return "google";
    }

    @Override
    public String getTokenUrl() {
        return "https://oauth2.googleapis.com/token";
    }

    @Override
    public String getUserInfoUrl() {
        return "https://www.googleapis.com/oauth2/v2/userinfo";
    }

    @Override
    public String getClientId() {
        return clientId;
    }

    @Override
    public String getClientSecret() {
        return clientSecret;
    }

    @Override
    public String getRedirectUri() {
        return redirectUri;
    }

    @Override
    public MultiValueMap<String, String> buildTokenRequestParams(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BusinessException(ErrorCode.AUTH_OAUTH2_INVALID_CODE);
        }

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", getClientId());
        params.add("client_secret", getClientSecret());
        params.add("code", code);
        params.add("grant_type", "authorization_code");
        params.add("redirect_uri", getRedirectUri());

        return params;
    }

    @Override
    public void setAuthHeaders(HttpHeaders headers, String accessToken) {
        if (!StringUtils.hasText(accessToken)) {
            throw new BusinessException(ErrorCode.AUTH_OAUTH2_MISSING_ACCESS_TOKEN);
        }
        headers.setBearerAuth(accessToken);
    }

    @Override
    public OAuth2UserInfo extractUserInfo(Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            throw new BusinessException(ErrorCode.AUTH_OAUTH2_EMPTY_USER_INFO);
        }
        return oauth2UserInfoFactory.getOAuth2UserInfo("google", attributes);
    }
}