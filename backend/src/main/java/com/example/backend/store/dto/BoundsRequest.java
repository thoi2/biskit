package com.example.backend.store.dto;

import lombok.Data;

import java.math.BigDecimal;

// 좌표 범위 요청 DTO
@Data
public class BoundsRequest {
    private Bounds bounds;
    
    @Data
    public static class Bounds {
        private Coordinate southwest;
        private Coordinate northeast;
    }
    
    @Data
    public static class Coordinate {
        private BigDecimal lat;
        private BigDecimal lng;
    }
}

