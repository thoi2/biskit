package com.example.backend.common.security.authentication.oauth2.service;

import com.example.backend.common.enums.OAuth2Provider;
import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.common.security.authentication.jwt.JwtUtil;
import com.example.backend.common.security.authentication.jwt.service.RefreshTokenService;
import com.example.backend.common.security.authentication.oauth2.dto.OAuth2TokenRequest;
import com.example.backend.common.security.authentication.oauth2.dto.OAuth2TokenResponse;
import com.example.backend.common.security.authentication.oauth2.dto.UserAuthResponse;
import com.example.backend.common.security.authentication.oauth2.provider.OAuth2ProviderStrategy;
import com.example.backend.common.security.authentication.oauth2.provider.OAuth2ProviderStrategyFactory;
import com.example.backend.common.security.authentication.oauth2.userInfo.OAuth2UserInfo;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

/**
 * 간소화된 OAuth2 Authorization Code 처리 서비스
 * 단일 사용자 타입을 위한 OAuth2 인증을 처리합니다.
 */
@Slf4j
@RequiredArgsConstructor
@Service
public class OAuth2TokenService {

    private final UserRepository userRepository;
    private final WebClient webClient;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final OAuth2ProviderStrategyFactory providerStrategyFactory;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /**
     * OAuth2 Authorization Code를 JWT 토큰 응답으로 교환
     *
     * @param provider OAuth2 제공자 (google, kakao, naver 등)
     * @return OAuth2TokenResponse 객체 OAuth2 제공자에서 받은 Authorization Code
     */
    @Transactional
    public OAuth2TokenResponse exchangeCodeForToken(OAuth2TokenRequest request, String provider, HttpServletResponse response) {
        User user = exchangeCodeForUser(request.code(), provider);
        return createTokenResponseWithCookies(user, response);
    }

    /**
     * OAuth2 Authorization Code로 사용자 정보를 가져와 User 객체를 반환
     *
     * @param authorizationCode OAuth2 제공자에서 받은 Authorization Code
     * @param provider OAuth2 제공자 식별자
     * @return User 객체
     */
    @Transactional
    public User exchangeCodeForUser(String authorizationCode, String provider) {
        // 1. Provider 전략 가져오기
        OAuth2ProviderStrategy providerStrategy = providerStrategyFactory.getStrategy(provider);

        // 2. Authorization Code를 OAuth2 Access Token으로 교환
        String oauthAccessToken = exchangeCodeForAccessToken(authorizationCode, providerStrategy);

        // 3. OAuth2 Access Token으로 사용자 정보 가져오기
        Map<String, Object> userAttributes = getUserInfo(oauthAccessToken, providerStrategy);

        // 4. OAuth2 사용자 정보 추출
        OAuth2UserInfo userInfo = providerStrategy.extractUserInfo(userAttributes);

        // 5. 사용자 처리 (조회 또는 생성)
        return processUser(userInfo, OAuth2Provider.valueOf(provider.toUpperCase()));
    }

    /**
     * Authorization Code를 OAuth2 Access Token으로 교환
     * 제공자별 전략에 따라 토큰 엔드포인트에 요청을 보내 Access Token을 획득합니다.
     *
     * @param authorizationCode OAuth2 제공자에서 받은 Authorization Code
     * @param providerStrategy OAuth2 제공자 전략
     * @return OAuth2 Access Token
     * @throws BusinessException OAuth2 토큰 교환 실패 시
     */
    private String exchangeCodeForAccessToken(String authorizationCode, OAuth2ProviderStrategy providerStrategy) {

        MultiValueMap<String, String> params = providerStrategy.buildTokenRequestParams(authorizationCode);

        // 요청 파라미터 로그
        log.info("==== OAuth2 Token Request ====");
        params.forEach((key, value) -> log.info("{}: {}", key, value));
        log.info("==============================");

        Map<String, Object> response = Optional.ofNullable(
            webClient.post()
                .uri(providerStrategy.getTokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(params))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnNext(resp -> log.info("==== OAuth2 Token Response ====\n{}", resp))
                .block()
        ).orElseThrow(() -> {
            log.error("{} 토큰 교환 실패", providerStrategy.getProviderName());
            return new BusinessException(ErrorCode.AUTH_OAUTH2_AUTHENTICATION_FAILED,
                providerStrategy.getProviderName() + " 토큰 교환에 실패했습니다.");
        });

        // access_token 존재 확인 및 반환
        if (!response.containsKey("access_token")) {
            log.error("{} 토큰 응답에 access_token 없음: {}", providerStrategy.getProviderName(), response);
            throw new BusinessException(ErrorCode.AUTH_OAUTH2_AUTHENTICATION_FAILED,
                providerStrategy.getProviderName() + " 토큰 교환에 실패했습니다.");
        }

        return (String) response.get("access_token");
    }

    /**
     * OAuth2 Access Token으로 사용자 정보 가져오기
     * 제공자별 사용자 정보 엔드포인트에 요청을 보내 사용자 정보를 획득합니다.
     *
     * @param oauthAccessToken OAuth2 Access Token
     * @param providerStrategy OAuth2 제공자 전략
     * @return 사용자 정보 Map
     * @throws BusinessException 사용자 정보 조회 실패 시
     */
    private Map<String, Object> getUserInfo(String oauthAccessToken, OAuth2ProviderStrategy providerStrategy) {
        return Optional.ofNullable(
                webClient.get()
                    .uri(providerStrategy.getUserInfoUrl())
                    .headers(headers -> providerStrategy.setAuthHeaders(headers, oauthAccessToken))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block()
            )
            .orElseThrow(() -> {
                log.error("{} 사용자 정보 조회 실패", providerStrategy.getProviderName());
                return new BusinessException(ErrorCode.AUTH_OAUTH2_USER_INFO_FAILED,
                    providerStrategy.getProviderName() + " 사용자 정보 조회에 실패했습니다.");
            });
    }

    /**
     * OAuth2 정보를 기반으로 기존 사용자를 조회하거나 새로운 사용자를 생성합니다.
     *
     * @param userInfo OAuth2 사용자 정보
     * @param provider OAuth2 제공자
     * @return 생성되거나 조회된 User 엔티티
     */
    private User processUser(OAuth2UserInfo userInfo, OAuth2Provider provider) {
        return userRepository.findByOauth2ProviderAndOauth2ProviderId(provider, userInfo.getId())
            .map(existingUser -> {
                log.info("기존 사용자 로그인 - Email: {}", userInfo.getEmail());

                boolean needsUpdate = false;

                // 프로필 이미지 업데이트 체크
                if (userInfo.getImageUrl() != null && !userInfo.getImageUrl().equals(existingUser.getProfileImageUrl())) {
                    existingUser.setProfileImageUrl(userInfo.getImageUrl());
                    needsUpdate = true;
                    log.info("프로필 이미지 업데이트 - Email: {}", userInfo.getEmail());
                }

                // 이름 업데이트 체크
                if (userInfo.getName() != null && !userInfo.getName().equals(existingUser.getName())) {
                    existingUser.setName(userInfo.getName());
                    needsUpdate = true;
                    log.info("이름 업데이트 - Email: {}", userInfo.getEmail());
                }

                if (needsUpdate) {
                    return userRepository.save(existingUser);
                }

                return existingUser;
            })
            .orElseGet(() -> {
                log.info("새로운 사용자 회원가입 - Email: {}", userInfo.getEmail());
                return createUser(userInfo, provider);
            });
    }

    /**
     * User 엔티티 생성
     * OAuth2 사용자 정보를 기반으로 새로운 User 엔티티를 생성합니다.
     *
     * @param userInfo OAuth2 사용자 정보
     * @param provider OAuth2 제공자
     * @return 생성된 User 엔티티
     */
    private User createUser(OAuth2UserInfo userInfo, OAuth2Provider provider) {
        User user = User.builder()
            .email(userInfo.getEmail())
            .name(userInfo.getName())
            .profileImageUrl(userInfo.getImageUrl())
            .oauth2Provider(provider)
            .oauth2ProviderId(userInfo.getId())
            .build();

        return userRepository.save(user);
    }

    /**
     * RTR 방식으로 리프레시 토큰을 사용하여 새로운 액세스 토큰 발급
     * 기존 리프레시 토큰을 즉시 무효화하고 새로운 리프레시 토큰을 발급합니다.
     *
     * @param request HTTP 요청 객체 (쿠키에서 리프레시 토큰 추출)
     * @param response HTTP 응답 객체 (쿠키 설정용)
     * @return 새로운 JWT 토큰 응답
     * @throws BusinessException 리프레시 토큰이 유효하지 않거나 사용자를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public OAuth2TokenResponse refreshAccessToken(jakarta.servlet.http.HttpServletRequest request, HttpServletResponse response) {
        // 0. 쿠키에서 리프레시 토큰 추출 및 검증
        String refreshToken = extractRefreshTokenFromCookie(request);
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            log.warn("리프레시 토큰이 제공되지 않았습니다.");
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID, "리프레시 토큰이 제공되지 않았습니다.");
        }
        
        // 1. JWT 형식 및 서명 검증
        JwtUserInfo jwtUserInfo;
        try {
            jwtUserInfo = jwtUtil.validateRefreshToken(refreshToken);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.error("리프레시 토큰이 만료됨: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED);
        } catch (io.jsonwebtoken.SignatureException e) {
            log.error("리프레시 토큰 서명 검증 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            log.error("리프레시 토큰 형식 오류: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
        } catch (Exception e) {
            log.error("리프레시 토큰 JWT 검증 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
        }

        // 2. RTR: Redis에서 토큰 검증 및 즉시 무효화 (원자적 연산)
        if (!refreshTokenService.validateAndInvalidateRefreshToken(jwtUserInfo.userId(), refreshToken)) {
            log.error("RTR 토큰 검증 및 무효화 실패. userId: {} - 토큰이 이미 사용되었거나 저장되지 않음", jwtUserInfo.userId());
            // Redis에 토큰이 없으면 이미 사용되었거나 만료됨
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_ALREADY_USED);
        }

        // 3. 데이터베이스에서 사용자 존재 확인
        User user = userRepository.findById(Long.valueOf(jwtUserInfo.userId()))
            .orElseThrow(() -> {
                log.error("사용자를 찾을 수 없습니다. userId: {}", jwtUserInfo.userId());
                return new BusinessException(ErrorCode.AUTH_USER_NOT_FOUND, "사용자를 찾을 수 없습니다.");
            });

        // 4. 새로운 액세스 토큰과 리프레시 토큰 발급 (RTR)
        OAuth2TokenResponse tokenResponse = createTokenResponseWithCookies(user, response);
        
        log.info("RTR 토큰 재발급 완료. userId: {} - 기존 토큰 무효화 및 새 토큰 발급", jwtUserInfo.userId());
        return tokenResponse;
    }

    /**
     * JWT 토큰 응답 생성 (쿠키 포함)
     * 사용자 정보를 기반으로 JWT Access Token과 Refresh Token을 생성하고 Redis에 저장하여 응답 객체를 구성합니다.
     *
     * @param user 인증된 사용자 엔티티
     * @param response HTTP 응답 객체 (쿠키 설정용)
     * @return OAuth2TokenResponse 객체
     */
    private OAuth2TokenResponse createTokenResponseWithCookies(User user, HttpServletResponse response) {
        String userId = user.getId().toString();
        
        // 새 로그인 시 기존 리프레시 토큰 정리 (쿠키 만료로 남겨진 토큰들)
        refreshTokenService.deleteRefreshToken(userId);
        log.debug("새 로그인으로 인한 기존 리프레시 토큰 정리 완료. userId: {}", userId);
        
        JwtUserInfo jwtUserInfo = new JwtUserInfo(
            userId,
            user.getName(),
            user.getOauth2Provider().name(),
            user.getOauth2ProviderId(),
            user.getProfileImageUrl()
        );

        String jwtAccessToken = jwtUtil.generateAccessToken(jwtUserInfo);
        String jwtRefreshToken = jwtUtil.generateRefreshToken(jwtUserInfo);

        // Redis에 새로운 리프레시 토큰 저장
        refreshTokenService.saveRefreshToken(userId, jwtRefreshToken);

        // 쿠키 설정
        setCookies(response, jwtAccessToken, jwtRefreshToken);

        return OAuth2TokenResponse.builder()
            .user(OAuth2TokenResponse.UserInfo.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .build())
            .build();
    }

    /**
     * 응답에 JWT 토큰을 쿠키로 설정
     * HttpOnly, Secure, SameSite 설정으로 보안 강화
     */
    private void setCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        // ResponseCookie로 SameSite 설정 가능
        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", accessToken)
            .httpOnly(true) // 개발환경에서는 false로 설정
            .secure(true) // 개발환경에서는 false
            .path("/")
            .maxAge(-1) // 세션 쿠키
            .sameSite("Strict") // SameSite 설정
            .build();

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
            .httpOnly(true) // 개발환경에서는 false로 설정
            .secure(true) // 개발환경에서는 false
            .path("/")
            .maxAge(-1) // 세션 쿠키
            .sameSite("Strict") // SameSite 설정
            .build();

        response.addHeader("Set-Cookie", accessTokenCookie.toString());
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
    }

    /**
     * 사용자 로그아웃 - 리프레시 토큰 무효화
     *
     * @param request HTTP 요청 객체 (쿠키에서 토큰 추출용)
     * @param response HTTP 응답 객체 (쿠키 삭제용)
     */
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            // 쿠키에서 액세스 토큰 추출하여 사용자 ID 획득
            String accessToken = extractTokenFromCookie(request);
            if (accessToken != null) {
                // 토큰에서 사용자 ID 추출
                Claims claims = jwtUtil.extractClaims(accessToken);
                String userId = claims.get("user_id", String.class);
                if (userId != null) {
                    refreshTokenService.deleteRefreshToken(userId);
                    log.info("사용자 로그아웃 완료. userId: {}", userId);
                }
            } else {
                log.warn("액세스 토큰이 없는 상태로 로그아웃 시도");
            }
        } catch (Exception e) {
            log.warn("로그아웃 처리 중 오류 발생: {}", e.getMessage());
        } finally {
            // 토큰이 유효하지 않아도 쿠키는 삭제
            clearCookies(response);
        }
    }

    /**
     * HTTP 요청의 쿠키에서 JWT 토큰을 추출
     *
     * @param request HTTP 요청 객체
     * @return 추출된 JWT 토큰, 없으면 null
     */
    private String extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }

        return Arrays.stream(request.getCookies())
            .filter(cookie -> "accessToken".equals(cookie.getName()))
            .findFirst()
            .map(Cookie::getValue)
            .orElse(null);
    }

    /**
     * 쿠키 삭제 (로그아웃 시)
     */
    private void clearCookies(HttpServletResponse response) {
        // Access Token 쿠키 삭제
        Cookie accessTokenCookie = new Cookie("accessToken", "");
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0); // 즉시 만료
        response.addCookie(accessTokenCookie);

        // Refresh Token 쿠키 삭제
        Cookie refreshTokenCookie = new Cookie("refreshToken", "");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // 즉시 만료
        response.addCookie(refreshTokenCookie);
    }

    /**
     * HTTP 요청의 쿠키에서 리프레시 토큰을 추출
     */
    private String extractRefreshTokenFromCookie(jakarta.servlet.http.HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }

        return java.util.Arrays.stream(request.getCookies())
            .filter(cookie -> "refreshToken".equals(cookie.getName()))
            .findFirst()
            .map(Cookie::getValue)
            .orElse(null);
    }

    /**
     * JwtUserInfo를 UserAuthResponse로 감싸는 메서드
     */
    public UserAuthResponse buildUserAuthResponse(JwtUserInfo userInfo) {
        return UserAuthResponse.builder()
            .user(userInfo)
            .build();
    }

}