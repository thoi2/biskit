package com.example.backend.recommend.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Value
@Builder
public class RecommendResponse {
    Building building;
    List<CategoryResult> result;
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
    public static class CategoryResult {
        String category;
        Double survivalRate;
    }

    @Value
    @Builder
    public static class RecommendMeta {
        Source source;            // CACHE | DB | AI
        String version;           // e.g. "v1"
        OffsetDateTime last_at; // 생성 시각
    }
}
