package com.example.backend.recommend.infra.geocoder;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
class ParsedGeoPoint {
    private final BigDecimal lat;
    private final BigDecimal lng;
    private final String bldMgtNo;
}
