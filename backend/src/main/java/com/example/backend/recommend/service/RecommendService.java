package com.example.backend.recommend.service;

import com.example.backend.recommend.dto.RecommendResponse;
import com.example.backend.recommend.dto.SingleRequest;
import com.example.backend.recommend.dto.SingleIndustryRequest;
import com.example.backend.recommend.dto.Source;
import com.example.backend.recommend.infra.ai.AiResponseParser;
import com.example.backend.recommend.infra.ai.AiServerClient;
import com.example.backend.recommend.port.CategoryPort;
import com.example.backend.recommend.port.InOutPort;
import com.example.backend.search.port.LoginSearchPort;
import com.example.backend.search.port.SearchCategoryPort;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Set;
import java.util.LinkedHashSet;
@Service
@RequiredArgsConstructor
public class RecommendService {

    private final InOutPort inOutPort;
    private final AiServerClient aiServerClient;
    private final AiResponseParser aiResponseParser;
    private final GeoBuildingService geoBuildingService;
    private final CategoryPort categoryPort;
    private final SearchCategoryPort searchCategoryPort;
    private final LoginSearchPort loginSearchPort;

    /**
     * 일반(single): 좌표만 받아 모든 카테고리 데이터 반환
     * - 카테고리별로 행 단위 저장하는 현재 스키마에서는
     *   전체를 DB에서 한 번에 모으기 어렵기 때문에,
     *   AI의 전체 응답을 받아 카테고리별로 upsert 하는 방식으로 단순화.
     */
    @Transactional
    public RecommendResponse generateSingle(SingleRequest req, Long uid) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();

        // 1) 좌표 → 건물 식별
        GeoBuildingService.ResolvedBuilding bld = geoBuildingService.resolve(lat, lng);

        // 2) AI 서버 호출(모든 카테고리)
        JsonNode aiRaw = aiServerClient.requestAll(bld.lat(), bld.lng());
        Map<String, Double> byCat = aiResponseParser.toCategoryDoubleMap(aiRaw);
//        Map<String, List<Double>> aijson = aiResponseParser.toCategoryMetricListV2(aiRaw);
        // category table에 없는건 skip
        Map<String, Integer> nameToId = categoryPort.getIdsByNames(byCat.keySet());

        List<RecommendResponse.CategoryResult> resultList = new ArrayList<>();
        Set<Integer> cidSet = new LinkedHashSet<>();
        byCat.forEach((name, value) -> {
            Integer catId = nameToId.get(name);
            if (catId == null) {
                return;
            }

            inOutPort.upsert(bld.id(), catId, value);

            cidSet.add(catId);
            resultList.add(
                    RecommendResponse.CategoryResult.builder()
                            .category(name)
                            .survivalRate(value)
                            .build()
            );
        });
        if(uid != null) {
            loginSearchPort.upsertubid(uid, bld.id());
            searchCategoryPort.upsertubcS(uid, bld.id(), cidSet);
        }

        // 5) 응답
        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .result(resultList)
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
    public RecommendResponse generateSingleIndustry(SingleIndustryRequest req, Long uid) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();
        final String categoryName = req.getCategoryName();
        final Integer categoryId = categoryPort.getIdByName(categoryName);

        // 1) 좌표 → 건물 식별
        GeoBuildingService.ResolvedBuilding bld = geoBuildingService.resolve(lat, lng);

        // 2) 캐시 → DB 조회
        Optional<Double> hit = inOutPort.get(bld.id(), categoryId);

        double value;
        Source source;
        if (hit.isPresent()) {
            value = hit.get();
            source = Source.DB;
        } else {
            // 3) 없으면 AI 서버 호출 → Double 파싱 후 upsert
            JsonNode aiRaw = aiServerClient.requestCategory(bld.lat(), bld.lng(), categoryId);
            value = aiResponseParser.toCategoryDouble(aiRaw, categoryName);
            inOutPort.upsert(bld.id(), categoryId, value);
            source = Source.AI;
        }

        List<RecommendResponse.CategoryResult> result = List.of(
                RecommendResponse.CategoryResult.builder()
                        .category(categoryName)
                        .survivalRate(value)
                        .build()
        );

        Set<Integer> cidSet = Set.of(categoryId);
        if(uid != null) {
            loginSearchPort.upsertubid(uid, bld.id());
            searchCategoryPort.upsertubcS(uid, bld.id(), cidSet);
        }

        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .result(result)
                .meta(RecommendResponse.RecommendMeta.builder()
                        .source(source)
                        .version("v1")
                        .last_at(OffsetDateTime.now())
                        .build())
                .build();
    }
}
