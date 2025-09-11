package com.example.backend.store.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

// 좌표 범위 요청 DTO
@Data
public class BoundsRequest {
    @NotNull(message = "bounds는 필수입니다")
    @Valid
    private Bounds bounds;

    @Data
    public static class Bounds {
        @NotNull(message = "southwest는 필수입니다")
        @Valid
        private Coordinate southwest;

        @NotNull(message = "northeast는 필수입니다")
        @Valid
        private Coordinate northeast;
    }

    @Data
    public static class Coordinate {
        @NotNull(message = "lat는 필수입니다")
        private BigDecimal lat;

        @NotNull(message = "lng는 필수입니다")
        private BigDecimal lng;
    }
}

