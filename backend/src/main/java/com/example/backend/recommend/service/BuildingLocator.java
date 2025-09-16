package com.example.backend.recommend.service;

import java.math.BigDecimal;
import java.util.Optional;

public interface BuildingLocator {
    Optional<ResolvedBuilding> resolve(BigDecimal lat, BigDecimal lng);

    record ResolvedBuilding(int id, BigDecimal lat, BigDecimal lng) {}
}
