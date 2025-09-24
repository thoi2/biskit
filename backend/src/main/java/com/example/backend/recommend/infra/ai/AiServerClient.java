package com.example.backend.recommend.infra.ai;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;

public interface AiServerClient {
    JsonNode requestAll(BigDecimal lat, BigDecimal lng);
    JsonNode requestCategory(BigDecimal lat, BigDecimal lng, int categoryId);
}
