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

    @Transactional
    public RecommendResponse generateSingle(SingleRequest req, Long uid) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();

        // 1) 좌표 → 건물 식별
        GeoBuildingService.ResolvedBuilding bld = geoBuildingService.resolve(lat, lng);

        // 2) AI 서버 호출(모든 카테고리)
        JsonNode aiRaw = aiServerClient.requestAll(bld.lat(), bld.lng());
        Map<String, List<Double>> byCat = aiResponseParser.toCategoryMetricListV2(aiRaw);
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
            JsonNode aiRaw = aiServerClient.requestAll(bld.lat(), bld.lng());
            Map<String, List<Double>> byCat = aiResponseParser.toCategoryMetricListV2(aiRaw);
            Map<String, Integer> nameToId = categoryPort.getIdsByNames(byCat.keySet());
            byCat.forEach((name, values) -> {
                Integer catId = nameToId.get(name);
                if (catId == null) {
                    return;
                }
                inOutPort.upsert(bld.id(), catId, values);
            });
            Optional<List<Double>> hit2 = inOutPort.get(bld.id(), categoryId);
            if(hit2.isPresent()) {
                value = hit2.get();
            }
            else {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                        "AI 응답이 틀립니다."
                );
            }
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

    @Transactional
    public RangeResponse getRange(RangeRequest req, Long uid) {
        final String categoryName = req.getCategory();
        final Integer categoryId   = categoryPort.getIdByName(categoryName);

        record R(RangeRequest.Point pt, GeoBuildingService.ResolvedBuilding bld) {}
        List<R> resolved = req.getPoints().stream()
                .map(p -> new R(p, geoBuildingService.resolve(p.getLat(), p.getLng())))
                .toList();

        Set<Integer> ensured = new HashSet<>();
        for (R r : resolved) {
            int bldId = r.bld().id();
            if (!ensured.add(bldId)) continue; // 이미 처리한 건물

            if (inOutPort.get(bldId, categoryId).isEmpty()) {
                // AI 전체 응답 한 번 받아 모든 카테고리 upsert
                JsonNode aiRaw = aiServerClient.requestAll(r.bld().lat(), r.bld().lng());
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

        List<RangeResponse.Item> items = resolved.stream().map(r -> {
            List<Double> v = inOutPort.get(r.bld().id(), categoryId).orElse(null);
            return RangeResponse.Item.builder()
                    .buildingId(r.bld().id())
                    .category(categoryName)
                    .lat(r.pt().getLat())   // 숫자(BigDecimal) 유지
                    .lng(r.pt().getLng())   // 숫자(BigDecimal) 유지
                    .survivalRate(v)
                    .build();
        }).toList();

        return RangeResponse.builder()
                .items(items)
                .build();
    }
}
