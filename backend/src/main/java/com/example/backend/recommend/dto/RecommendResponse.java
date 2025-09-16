package com.example.backend.recommend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

/**
 {
 "building": { "building_id": 101, "lat": 37.123456, "lng": 127.123456 },
 "data": {
 "11441111": 66.66666,
 "23553353": 99.99999
 },
 "meta": {
 "source": "DB",
 "version": "v1",
 "udatetime": "2025-09-10T17:30:00+09:00"
 }
 }
 */
@Value
@AllArgsConstructor
@Builder
public class RecommendResponse {
    Building building;
    Map<String, Double> data;
    RecommendMeta meta;

    @Value
    @Builder
    public static class Building {
        int building_id;
        BigDecimal lat;
        BigDecimal lng;
    }

    @Value
    @Builder
    public static class RecommendMeta {
        Source source;            // CACHE | DB | AI
        String version;           // e.g. "v1"
        OffsetDateTime last_at; // 생성 시각
    }
}
