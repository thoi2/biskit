package com.example.backend.recommend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SingleIndustryRequest {

    @NotNull
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    @Digits(integer = 3, fraction = 12)
    private BigDecimal lat;

    @NotNull
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    @Digits(integer = 3, fraction = 12)
    private BigDecimal lng;

    @NotNull
    @NotBlank  // ✅ @Positive 제거, @NotBlank 사용
    @Size(min = 1, max = 100)  // ✅ 길이 제한 추가 (선택사항)
    private String categoryName;
}
