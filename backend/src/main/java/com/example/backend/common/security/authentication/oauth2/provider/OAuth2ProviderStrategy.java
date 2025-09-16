package com.example.backend.common.security.authentication.oauth2.provider;

import com.example.backend.common.security.authentication.oauth2.userInfo.OAuth2UserInfo;
import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;

import java.util.Map;

public interface OAuth2ProviderStrategy {
    String getProviderName();
    String getTokenUrl();
    String getUserInfoUrl();
    String getClientId();
    String getClientSecret();
    String getRedirectUri();
    MultiValueMap<String, String> buildTokenRequestParams(String code);
    void setAuthHeaders(HttpHeaders headers, String accessToken);
    OAuth2UserInfo extractUserInfo(Map<String, Object> attributes);
}