package com.example.backend.recommend.repository.projection;

import java.math.BigDecimal;
public interface BuildingProjection {
    Integer getId();
    BigDecimal getLat();
    BigDecimal getLng();
}
