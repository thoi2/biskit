package com.example.backend.recommend.service;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.dto.*;
import com.example.backend.recommend.exception.RecommendErrorCode;
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
import java.util.HashSet;
import java.util.stream.Stream;
import java.util.stream.Collectors;

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
     * ✅ 단일 검색 - Top 20 업종 반환 및 저장
     */
    @Transactional
    public RecommendResponse generateSingle(SingleRequest req, Long uid) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();

        // 1) 좌표 → 건물 식별
        GeoBuildingService.ResolvedBuilding bld = geoBuildingService.resolve(lat, lng);

        // 2) AI 서버 호출(모든 카테고리)
        JsonNode aiRaw = aiServerClient.requestAll(bld.id(), bld.lat(), bld.lng());
        Map<String, List<Double>> byCat = aiResponseParser.toCategoryMetricListV2(aiRaw);
        Map<String, Integer> nameToId = categoryPort.getIdsByNames(byCat.keySet());

        // ✅ 3) 점수 계산 후 Top 20 선별
        List<RecommendResponse.CategoryResult> resultList = byCat.entrySet().stream()
                .filter(entry -> nameToId.containsKey(entry.getKey()))
                .map(entry -> {
                    String name = entry.getKey();
                    List<Double> value = entry.getValue();
                    Integer catId = nameToId.get(name);

                    // DB 저장
                    inOutPort.upsert(bld.id(), catId, value);

                    // 점수 계산 (평균값)
                    double avgScore = value.stream()
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0.0);

                    return new ScoredCategory(
                            RecommendResponse.CategoryResult.builder()
                                    .category(name)
                                    .survivalRate(value)
                                    .build(),
                            avgScore
                    );
                })
                .sorted((a, b) -> Double.compare(b.score, a.score)) // ✅ 점수 내림차순 정렬
                .limit(20) // ✅ Top 20으로 변경
                .map(scored -> scored.result)
                .collect(Collectors.toList());

        // ✅ 4) Top 20 카테고리 ID 수집
        Set<Integer> cidSet = resultList.stream()
                .map(result -> nameToId.get(result.getCategory()))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (uid != null) {
            loginSearchPort.upsertubid(uid, bld.id());
            searchCategoryPort.upsertubcS(uid, bld.id(), cidSet); // ✅ Top 20 저장
        }

        // 5) 응답
        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .result(resultList) // ✅ Top 20 반환
                .meta(RecommendResponse.RecommendMeta.builder()
                        .source(Source.AI)
                        .version("v1")
                        .last_at(OffsetDateTime.now())
                        .build())
                .build();
    }

    /**
     * ✅ 단일 업종 - 변경 없음 (이미 1개만 반환)
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
        Optional<List<Double>> hit = inOutPort.get(bld.id(), categoryId);

        List<Double> value;
        Source source;
        if (hit.isPresent()) {
            value = hit.get();
            source = Source.DB;
        } else {
            // 3) 없으면 AI 서버 호출 → Double 파싱 후 upsert
            JsonNode aiRaw = aiServerClient.requestCategory(bld.id(), bld.lat(), bld.lng(), categoryId);
            value = aiResponseParser.toCategoryMetricV2(aiRaw, categoryName);
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
        if (uid != null) {
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

    /**
     * ✅ 범위 검색 - Top 10 건물 유지 (변경 없음)
     */
    @Transactional
    public RangeResponse getRange(RangeRequest req, Long uid) {
        final String categoryName = req.getCategory();
        final Integer categoryId = categoryPort.getIdByName(categoryName);

        record R(RangeRequest.Point pt, GeoBuildingService.ResolvedBuilding bld) {}
        List<R> resolved = req.getPoints().stream()
                .flatMap(p -> {
                    try {
                        var b = geoBuildingService.resolve(p.getLat(), p.getLng());
                        return Stream.of(new R(p, b));
                    } catch (Exception e) {
                        return Stream.empty(); // 실패는 제거
                    }
                })
                .toList();

        if (resolved.isEmpty()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "모든 좌표 resolve에 실패했습니다."
            );
        }

        Set<Integer> ensured = new HashSet<>();
        for (R r : resolved) {
            int bldId = r.bld().id();
            if (!ensured.add(bldId)) continue; // 이미 처리한 건물

            if (inOutPort.get(bldId, categoryId).isEmpty()) {
                // AI 전체 응답 한 번 받아 모든 카테고리 upsert
                JsonNode aiRaw = aiServerClient.requestAll(r.bld().id(), r.bld().lat(), r.bld().lng());
                Map<String, List<Double>> byCat = aiResponseParser.toCategoryMetricListV2(aiRaw);
                Map<String, Integer> nameToId = categoryPort.getIdsByNames(byCat.keySet());
                byCat.forEach((name, v) -> {
                    Integer cid = nameToId.get(name);
                    if (cid != null) inOutPort.upsert(bldId, cid, v);
                });
            }

            if (uid != null) {
                loginSearchPort.upsertubid(uid, bldId);
                searchCategoryPort.upsertubcS(uid, bldId, Set.of(categoryId));
            }
        }

        // ✅ Top 10 건물만 선별 (유지)
        List<RangeResponse.Item> items = resolved.stream()
                .map(r -> {
                    List<Double> v = inOutPort.get(r.bld().id(), categoryId).orElse(List.of(0.0));

                    // 점수 계산 (평균값)
                    double avgScore = v.stream()
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0.0);

                    return new ScoredBuilding(
                            RangeResponse.Item.builder()
                                    .buildingId(r.bld().id())
                                    .category(categoryName)
                                    .lat(r.pt().getLat())   // 숫자(BigDecimal) 유지
                                    .lng(r.pt().getLng())   // 숫자(BigDecimal) 유지
                                    .survivalRate(v)
                                    .build(),
                            avgScore
                    );
                })
                .sorted((a, b) -> Double.compare(b.score, a.score)) // ✅ 점수 내림차순 정렬
                .limit(10) // ✅ Top 10 건물 유지
                .map(scored -> scored.item)
                .collect(Collectors.toList());

        return RangeResponse.builder()
                .items(items) // ✅ Top 10 건물만 반환
                .build();
    }

    /**
     * ✅ 정렬용 헬퍼 레코드들
     */
    private record ScoredCategory(RecommendResponse.CategoryResult result, double score) {}
    private record ScoredBuilding(RangeResponse.Item item, double score) {}
}
