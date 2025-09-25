package com.example.backend.common.security.authentication.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

/**
 * JWT 토큰 생성 및 검증을 담당하는 유틸리티 클래스
 * 액세스 토큰과 리프레시 토큰의 생성, 검증, 클레임 추출 기능을 제공합니다.
 */
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    /**
     * JWT 유틸리티 클래스 생성자
     *
     * @param secretKey              JWT 서명에 사용할 비밀키 (최소 256비트 이상)
     * @param accessTokenExpiration  액세스 토큰 만료 시간 (초 단위)
     * @param refreshTokenExpiration 리프레시 토큰 만료 시간 (초 단위)
     */
    public JwtUtil(
        @Value("${jwt.secret}") String secretKey,
        @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
        @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration
    ) {

        if (secretKey == null || secretKey.getBytes().length < 32) {
            throw new IllegalArgumentException("JWT secret key must be at least 256 bits (32 bytes)");
        }

        this.secretKey = Keys.hmacShaKeyFor(secretKey.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    /**
     * 액세스 토큰 생성
     *
     * @param userInfo JWT 사용자 정보
     * @return 생성된 액세스 토큰
     */
    public String generateAccessToken(JwtUserInfo userInfo) {
        return generateToken(userInfo, "ACCESS", accessTokenExpiration);
    }

    /**
     * 리프레시 토큰 생성
     *
     * @param userInfo JWT 사용자 정보
     * @return 생성된 리프레시 토큰
     */
    public String generateRefreshToken(JwtUserInfo userInfo) {
        return generateToken(userInfo, "REFRESH", refreshTokenExpiration);
    }

    /**
     * JWT 토큰 생성 (내부 메서드)
     * 공통 토큰 생성 로직을 처리합니다.
     *
     * @param userInfo   JWT 사용자 정보
     * @param tokenType  토큰 타입 (ACCESS, REFRESH)
     * @param expiration 토큰 만료 시간 (초 단위)
     * @return 생성된 JWT 토큰
     */
    private String generateToken(JwtUserInfo userInfo, String tokenType, long expiration) {
        Instant now = Instant.now();

        return Jwts.builder()
            .subject(userInfo.username())
            .claim("user_id", userInfo.userId())
            .claim("token_type", tokenType)
            .claim("oauth2_provider", userInfo.oauth2Provider())
            .claim("oauth2_provider_id", userInfo.oauth2ProviderId())
            .claim("profile_image_url", userInfo.profileImageUrl())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expiration)))
            .signWith(secretKey)
            .compact();
    }

    /**
     * JWT 토큰 검증 및 클레임 추출
     *
     * @param token 검증할 JWT 토큰
     * @return 토큰의 클레임 정보
     */
    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    /**
     * Claims에서 JwtUserInfo 객체 생성
     *
     * @param claims JWT Claims 객체
     * @return 검증된 JwtUserInfo 객체
     */
    public JwtUserInfo createJwtUserInfo(Claims claims) {
        // 안전한 타입 변환 + null 체크
        Object userIdObj = claims.get("user_id");
        String userId = userIdObj != null ? userIdObj.toString() : null;
        String username = claims.getSubject();
        String oauth2Provider = claims.get("oauth2_provider", String.class);
        String oauth2ProviderId = claims.get("oauth2_provider_id", String.class);
        String profileImageUrl = claims.get("profile_image_url", String.class);

        if (userId == null || username == null || oauth2Provider == null || oauth2ProviderId == null) {
            throw new JwtException("필수 클레임이 누락되었습니다");
        }

        return new JwtUserInfo(
            userId,
            username,
            oauth2Provider,
            oauth2ProviderId,
            profileImageUrl
        );
    }

    /**
     * 리프레시 토큰 검증 및 사용자 정보 추출
     *
     * @param refreshToken 검증할 리프레시 토큰
     * @return 검증된 사용자 정보
     * @throws JwtException 토큰이 유효하지 않거나 REFRESH 타입이 아닌 경우
     */
    public JwtUserInfo validateRefreshToken(String refreshToken) {
        Claims claims = extractClaims(refreshToken);

        // 토큰 타입 검증
        String tokenType = claims.get("token_type", String.class);
        if (!"REFRESH".equals(tokenType)) {
            throw new JwtException("REFRESH 토큰이 아닙니다: " + tokenType);
        }

        return createJwtUserInfo(claims);
    }
}