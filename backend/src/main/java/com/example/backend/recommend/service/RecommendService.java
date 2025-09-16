package com.example.backend.recommend.service;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import com.example.backend.recommend.dto.RecommendResponse;
import com.example.backend.recommend.dto.SingleRequest;
import com.example.backend.recommend.dto.SingleIndustryRequest;
import com.example.backend.recommend.dto.Source;
import com.example.backend.recommend.infra.ai.AiResponseParser;
import com.example.backend.recommend.infra.ai.AiServerClient;
import com.example.backend.recommend.repository.InOutStore;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecommendService {

    private final InOutStore inOutStore;
    private final AiServerClient aiServerClient;
    private final AiResponseParser aiResponseParser;
    private final BuildingLocator buildingLocator;

    /**
     * 일반(single): 좌표만 받아 모든 카테고리 데이터 반환
     * - 카테고리별로 행 단위 저장하는 현재 스키마에서는
     *   전체를 DB에서 한 번에 모으기 어렵기 때문에,
     *   AI의 전체 응답을 받아 카테고리별로 upsert 하는 방식으로 단순화.
     */
    @Transactional
    public RecommendResponse generateSingle(SingleRequest req, String correlationId) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();

        // 1) 좌표 → 건물 식별
        BuildingLocator.ResolvedBuilding bld = buildingLocator.resolve(lat, lng)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.COMMON_NOT_FOUND, "해당 좌표에서 건물을 찾지 못했습니다."));

        // 2) AI 서버 호출(모든 카테고리)
        JsonNode aiRaw = aiServerClient.requestAll(bld.lat(), bld.lng(), correlationId);
        Map<Integer, Double> byCat = aiResponseParser.toCategoryDoubleMap(aiRaw);

        // 3) 저장
        byCat.forEach((categoryId, value) -> inOutStore.upsert(bld.id(), categoryId, value));

        // 4) 응답: String 키(카테고리 키명)로 변환
        Map<String, Double> data = new LinkedHashMap<>();
        byCat.forEach((categoryId, value) -> {
            String key = safeCatKey(categoryId);
            data.put(key, value);
        });

        // 5) 응답
        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .data(data)
                .meta(RecommendResponse.RecommendMeta.builder()
                        .source(Source.AI)
                        .version("v1")
                        .last_at(OffsetDateTime.now())
                        .build())
                .build();
    }

    /**
     * 인더스트리(single-industry): 좌표 + categoryId 한 개만 반환
     * - (building, category) 단건을 캐시→DB에서 조회,
     *   없으면 AI 호출 후 upsert.
     */
    @Transactional
    public RecommendResponse generateSingleIndustry(SingleIndustryRequest req, String correlationId) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();
        final Integer categoryId = req.getCategoryId();

        // 1) 좌표 → 건물 식별
        BuildingLocator.ResolvedBuilding bld = buildingLocator.resolve(lat, lng)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.COMMON_NOT_FOUND, "해당 좌표에서 건물을 찾지 못했습니다."));

        // 2) 캐시 → DB 조회
        Optional<Double> hit = inOutStore.get(bld.id(), categoryId);

        double value;
        Source source;
        if (hit.isPresent()) {
            value = hit.get();
            source = Source.DB;
        } else {
            // 3) 없으면 AI 서버 호출 → Double 파싱 후 upsert
            JsonNode aiRaw = aiServerClient.requestCategory(bld.lat(), bld.lng(), categoryId, correlationId);
            value = aiResponseParser.toCategoryDouble(aiRaw, categoryId);
            inOutStore.upsert(bld.id(), categoryId, value);
            source = Source.AI;
        }

        Map<String, Double> data = Map.of(safeCatKey(categoryId), value);

        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .data(data)
                .meta(RecommendResponse.RecommendMeta.builder()
                        .source(source)
                        .version("v1")
                        .last_at(OffsetDateTime.now())
                        .build())
                .build();
    }

    // --- 내부 유틸 ---
    private String safeCatKey(Integer categoryId) {
        try {
            String k = aiResponseParser.categoryKey(categoryId);
            return (k == null || k.isBlank()) ? String.valueOf(categoryId) : k;
        } catch (Exception ignore) {
            return String.valueOf(categoryId);
        }
    }
}
