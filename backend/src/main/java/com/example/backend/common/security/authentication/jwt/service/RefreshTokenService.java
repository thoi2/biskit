package com.example.backend.common.security.authentication.jwt.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis 기반 리프레시 토큰 관리 서비스
 * 리프레시 토큰의 저장, 조회, 삭제, 검증 기능을 제공합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String REFRESH_TOKEN_KEY_PREFIX = "refresh_token:";
    
    private final StringRedisTemplate redisTemplate;
    
    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /**
     * 리프레시 토큰을 Redis에 저장
     *
     * @param userId 사용자 ID
     * @param refreshToken 리프레시 토큰
     */
    public void saveRefreshToken(String userId, String refreshToken) {
        String key = REFRESH_TOKEN_KEY_PREFIX + userId;
        
        try {
            redisTemplate.opsForValue().set(
                key, 
                refreshToken, 
                Duration.ofSeconds(refreshTokenExpiration)
            );
            log.debug("리프레시 토큰 저장 성공. userId: {}", userId);
        } catch (Exception e) {
            log.error("리프레시 토큰 저장 실패. userId: {}, error: {}", userId, e.getMessage());
            throw new RuntimeException("리프레시 토큰 저장 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * Redis에서 리프레시 토큰 조회
     *
     * @param userId 사용자 ID
     * @return 저장된 리프레시 토큰 (없으면 null)
     */
    public String getRefreshToken(String userId) {
        String key = REFRESH_TOKEN_KEY_PREFIX + userId;
        
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("리프레시 토큰 조회 실패. userId: {}, error: {}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * 리프레시 토큰 삭제 (로그아웃 시 사용)
     *
     * @param userId 사용자 ID
     */
    public void deleteRefreshToken(String userId) {
        String key = REFRESH_TOKEN_KEY_PREFIX + userId;
        
        try {
            redisTemplate.delete(key);
            log.debug("리프레시 토큰 삭제 성공. userId: {}", userId);
        } catch (Exception e) {
            log.error("리프레시 토큰 삭제 실패. userId: {}, error: {}", userId, e.getMessage());
            throw new RuntimeException("리프레시 토큰 삭제 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * RTR(Refresh Token Rotation) - 토큰 검증 후 즉시 무효화
     * 리프레시 토큰 사용 시 기존 토큰을 즉시 삭제하여 재사용을 방지합니다.
     *
     * @param userId 사용자 ID
     * @param refreshToken 검증할 리프레시 토큰
     * @return 토큰이 유효하고 삭제되었으면 true, 그렇지 않으면 false
     */
    public boolean validateAndInvalidateRefreshToken(String userId, String refreshToken) {
        if (userId == null || refreshToken == null) {
            return false;
        }

        String key = REFRESH_TOKEN_KEY_PREFIX + userId;
        
        try {
            // Redis 6.2 미만 버전 호환성을 위한 분리된 연산
            String storedToken = redisTemplate.opsForValue().get(key);
            
            if (storedToken == null) {
                log.warn("저장된 리프레시 토큰이 없거나 이미 사용됨. userId: {}", userId);
                return false;
            }

            boolean isValid = storedToken.equals(refreshToken);
            
            if (isValid) {
                // 토큰이 유효한 경우 삭제 (RTR 적용)
                redisTemplate.delete(key);
                log.info("리프레시 토큰 검증 및 무효화 완료. userId: {}", userId);
                return true;
            } else {
                // 토큰이 일치하지 않는 경우, 보안을 위해 삭제
                redisTemplate.delete(key);
                log.error("리프레시 토큰 불일치 - 잠재적 공격 시도. userId: {}", userId);
                return false;
            }
        } catch (Exception e) {
            log.error("리프레시 토큰 검증 및 무효화 실패. userId: {}, error: {}", userId, e.getMessage());
            // 오류 발생 시 보안을 위해 토큰 삭제
            deleteRefreshToken(userId);
            return false;
        }
    }

}