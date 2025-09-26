package com.example.backend.favorite.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class FavoriteRequest {

    @NotNull
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    @Digits(integer = 3, fraction = 12)
    private BigDecimal lat;

    @NotNull
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    @Digits(integer = 3, fraction = 12)
    private BigDecimal lng;

    @NotNull
    @Positive
    private String categoryName;
}
