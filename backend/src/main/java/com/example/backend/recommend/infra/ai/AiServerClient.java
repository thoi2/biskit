package com.example.backend.recommend.infra.ai;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;

public interface AiServerClient {
    JsonNode requestAll(int id, BigDecimal lat, BigDecimal lng);
    JsonNode requestCategory(int id, BigDecimal lat, BigDecimal lng, String categoryName);
    JsonNode requestGms(int id, BigDecimal lat, BigDecimal lng, String categoryName);
}
