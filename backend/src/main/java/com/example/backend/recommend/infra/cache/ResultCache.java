package com.example.backend.recommend.infra.cache;

import java.time.Duration;
import java.util.Optional;

public interface ResultCache {
    Optional<Double> get(int buildingId, int categoryId);
    void set(int buildingId, int categoryId, double resultJson, Duration ttl);
    void evict(int buildingId, int categoryId);
}
