package com.example.backend.recommend.infra.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RedisResultCache implements ResultCache {

    private final StringRedisTemplate redis;
    private static final String KEY_FMT = "reco:result:%d:%d";
    private static final Duration DEFAULT_TTL = Duration.ofHours(24); // 안전망

    private String key(int b, int c) {
        return String.format(KEY_FMT, b, c);
    }

    @Override
    public Optional<Double> get(int buildingId, int categoryId) {
        try {
            String v = redis.opsForValue().get(key(buildingId, categoryId));
            if (v == null) return Optional.empty();
            try {
                return Optional.of(Double.parseDouble(v));
            } catch (NumberFormatException e) {
                redis.delete(key(buildingId, categoryId)); // 깨진 값 정리
                return Optional.empty();
            }
        } catch (RuntimeException e) {
            // Redis 장애 시 캐시 미스로 취급하여 상위 로직 진행
            return Optional.empty();
        }
    }

    @Override
    public void set(int buildingId, int categoryId, double value, Duration ttl) {
        // NaN/Infinity는 저장하지 않음
        if (Double.isNaN(value) || Double.isInfinite(value)) return;

        Duration effectiveTtl =
                (ttl == null || ttl.isZero() || ttl.isNegative()) ? DEFAULT_TTL : ttl;

        try {
            redis.opsForValue().set(key(buildingId, categoryId),
                    Double.toString(value),
                    effectiveTtl);
        } catch (RuntimeException e) {
            // 캐시는 베스트에포트: 실패해도 예외 전파하지 않음
        }
    }

    @Override
    public void evict(int buildingId, int categoryId) {
        try {
            redis.delete(key(buildingId, categoryId));
        } catch (RuntimeException ignored) { }
    }
}
