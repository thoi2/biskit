package com.example.backend.recommend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RangeRequest {

    @NotEmpty
    @Size(min = 1, max = 2000)
    @Valid
    @JsonProperty("polygon")
    private List<Point> points;

    @NotBlank
    @JsonProperty("category")
    private String category;

    @Data
    public static class Point {
        @NotNull
        @DecimalMin("-90.0")  @DecimalMax("90.0")
        @Digits(integer = 3, fraction = 12)
        private BigDecimal lat;

        @NotNull
        @DecimalMin("-180.0") @DecimalMax("180.0")
        @Digits(integer = 3, fraction = 12)
        private BigDecimal lng;
    }
}
