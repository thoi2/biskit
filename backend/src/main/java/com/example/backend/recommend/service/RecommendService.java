package com.example.backend.recommend.service;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.dto.*;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.example.backend.recommend.infra.ai.AiResponseParser;
import com.example.backend.recommend.infra.ai.AiServerClient;
import com.example.backend.recommend.port.BuildingPort;
import com.example.backend.recommend.port.CategoryPort;
import com.example.backend.recommend.port.InOutPort;
import com.example.backend.search.port.LoginSearchPort;
import com.example.backend.search.port.SearchCategoryPort;
import com.fasterxml.jackson.databind.JsonNode;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.concurrent.CompletableFuture;
import java.util.stream.Stream;
import java.util.stream.Collectors;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendService {

    private final BuildingPort buildingPort;
    private final InOutPort inOutPort;
    private final AiServerClient aiServerClient;
    private final AiResponseParser aiResponseParser;
    private final GeoBuildingService geoBuildingService;
    private final CategoryPort categoryPort;
    private final SearchCategoryPort searchCategoryPort;
    private final LoginSearchPort loginSearchPort;
    private final UserRepository userRepository; // UserRepository 주입

    private static final Logger log = LoggerFactory.getLogger(RecommendService.class);

    /**
     * ✅ 단일 검색: 247개 완전 캐시 → 동기, 불완전 → 비동기 AI 호출
     */
    public CompletableFuture<RecommendResponse> generateSingle(SingleRequest req, Long uid) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();

        log.info("🌟 단일 검색 시작: lat={}, lng={}, uid={}", lat, lng, uid);

        try {
            // 1) 좌표 → 건물 식별
            GeoBuildingService.ResolvedBuilding bld = geoBuildingService.resolve(lat, lng);
            log.debug("건물 식별 완료: building_id={}", bld.id());

            // 2) ✅ 캐시 완성도 체크 (247개인지만 확인)
            int cachedCount = inOutPort.getCachedCategoryCount(bld.id());

            if (cachedCount == 247) {
                // ✅ 완전 캐시 → 즉시 동기 반환
                log.info("⚡ [COMPLETE CACHE] 즉시 응답: building={} (247/247)", bld.id());

                RecommendResponse response = buildCompleteCacheResponse(bld, uid);
                return CompletableFuture.completedFuture(response);

            } else {
                // ✅ 불완전 캐시 → 비동기 AI 호출
                log.info("🚀 [INCOMPLETE CACHE] AI 호출: building={} ({}/247)", bld.id(), cachedCount);

                return CompletableFuture.supplyAsync(() -> {
                    try {
                        // AI 서버 전체 호출
                        JsonNode aiRaw = aiServerClient.requestAll(bld.id(), bld.lat(), bld.lng());
                        Map<String, List<Double>> byCat = aiResponseParser.toCategoryMetricListV2(aiRaw);
                        Map<String, Integer> nameToId = categoryPort.getIdsByNames(byCat.keySet());

                        return processFullAiResponse(bld, byCat, nameToId, uid);

                    } catch (Exception e) {
                        log.error("❌ AI 서버 호출 실패: building={}", bld.id(), e);
                        throw new BusinessException(
                                RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                                "AI 서버 오류: " + e.getMessage()
                        );
                    }
                });
            }

        } catch (BusinessException e) {
            return CompletableFuture.failedFuture(e); // ✅ throw → failedFuture로 변경
        } catch (Exception e) {
            log.error("❌ 단일 검색 처리 실패: lat={}, lng={}", lat, lng, e);
            return CompletableFuture.failedFuture(
                    new BusinessException(RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(), e.getMessage())
            );
        }
    }

    /**
     * ✅ 단일 업종: 캐시 히트 → 동기, 캐시 미스 → 비동기 AI 호출
     */
    public CompletableFuture<RecommendResponse> generateSingleIndustry(SingleIndustryRequest req, Long uid) {
        final BigDecimal lat = req.getLat();
        final BigDecimal lng = req.getLng();
        final String categoryName = req.getCategory();

        log.info("🎯 단일 업종 검색 시작: lat={}, lng={}, category={}, uid={}", lat, lng, categoryName, uid);

        try {
            final Integer categoryId = categoryPort.getIdByName(categoryName);
            if (categoryId == null) {
                return CompletableFuture.failedFuture(new BusinessException( // ✅ throw → failedFuture
                        RecommendErrorCode.INVALID_RECOMMEND_TYPE.getCommonCode(),
                        "업종을 찾을 수 없습니다: " + categoryName
                ));
            }

            // 1) 좌표 → 건물 식별
            GeoBuildingService.ResolvedBuilding bld = geoBuildingService.resolve(lat, lng);

            // 2) ✅ 캐시 체크
            Optional<List<Double>> cached = inOutPort.get(bld.id(), categoryId);

            if (cached.isPresent()) {
                // ✅ 캐시 히트 → 즉시 동기 반환
                log.info("⚡ [CACHE HIT] 즉시 응답: building={}, category={}", bld.id(), categoryName);

                RecommendResponse response = buildCacheResponse(bld, categoryName, categoryId, cached.get(), uid);
                return CompletableFuture.completedFuture(response);

            } else {
                // ✅ 캐시 미스 → 비동기 AI 호출
                log.info("🚀 [CACHE MISS] AI 호출: building={}, category={}", bld.id(), categoryName);

                return CompletableFuture.supplyAsync(() -> {
                    try {
                        JsonNode aiRaw = aiServerClient.requestCategory(bld.id(), bld.lat(), bld.lng(), categoryName);
                        List<Double> value = aiResponseParser.toCategoryMetricV2(aiRaw, categoryName);

                        // 캐시 저장
                        inOutPort.upsert(bld.id(), categoryId, value);

                        return buildAiResponse(bld, categoryName, categoryId, value, uid);

                    } catch (Exception e) {
                        log.error("❌ AI 서버 호출 실패: building={}, category={}", bld.id(), categoryName, e);
                        throw new BusinessException(
                                RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                                "AI 서버 오류: " + e.getMessage()
                        );
                    }
                });
            }

        } catch (BusinessException e) {
            return CompletableFuture.failedFuture(e); // ✅ throw → failedFuture
        } catch (Exception e) {
            log.error("❌ 단일 업종 검색 처리 실패: category={}", categoryName, e);
            return CompletableFuture.failedFuture(
                    new BusinessException(RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(), e.getMessage())
            );
        }
    }

    /**
     * ✅ 범위 검색: 캐시 최대한 활용 후 부족한 것만 비동기 AI 호출
     */
    public CompletableFuture<RangeResponse> getRange(RangeRequest req, Long uid) {
        final String categoryName = req.getCategory();

        log.info("🗺️ 범위 검색 시작: category={}, points={}, uid={}", categoryName, req.getPoints().size(), uid);

        try {
            final Integer categoryId = categoryPort.getIdByName(categoryName);
            if (categoryId == null) {
                return CompletableFuture.failedFuture(new BusinessException( // ✅ throw → failedFuture
                        RecommendErrorCode.INVALID_RECOMMEND_TYPE.getCommonCode(),
                        "업종을 찾을 수 없습니다: " + categoryName
                ));
            }

            // 1) 좌표들 resolve
            List<ResolvedPoint> resolved = req.getPoints().stream()
                    .flatMap(p -> {
                        try {
                            var b = geoBuildingService.resolve(p.getLat(), p.getLng());
                            return Stream.of(new ResolvedPoint(p, b));
                        } catch (Exception e) {
                            log.warn("좌표 resolve 실패: lat={}, lng={}", p.getLat(), p.getLng());
                            return Stream.empty();
                        }
                    })
                    .toList();

            if (resolved.isEmpty()) {
                return CompletableFuture.failedFuture(new BusinessException( // ✅ throw → failedFuture
                        RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(),
                        "모든 좌표 resolve에 실패했습니다."
                ));
            }

            // 2) ✅ 캐시/미스 분류
            List<ResolvedPoint> cached = new ArrayList<>();
            List<ResolvedPoint> needsAI = new ArrayList<>();

            for (ResolvedPoint point : resolved) {
                if (inOutPort.get(point.building().id(), categoryId).isPresent()) {
                    cached.add(point);
                } else {
                    needsAI.add(point);
                }
            }

            log.info("🎯 [RANGE] 캐시={}개, AI호출={}개, 총={}개", cached.size(), needsAI.size(), resolved.size());

            if (needsAI.isEmpty()) {
                // ✅ 모두 캐시 → 즉시 반환
                log.info("⚡ [ALL CACHED] 모든 데이터 캐시됨");

                RangeResponse response = buildCachedRangeResponse(resolved, categoryName, categoryId, uid);
                return CompletableFuture.completedFuture(response);

            } else {
                // ✅ 일부 AI 호출 필요 → 비동기 병렬 처리
                return CompletableFuture.supplyAsync(() -> {
                    try {
                        // 병렬로 AI 호출
                        processParallelAiCalls(needsAI, categoryName, categoryId);

                        // 최종 결과 구성 (캐시 + AI)
                        return buildFinalRangeResponse(resolved, categoryName, categoryId, uid);

                    } catch (Exception e) {
                        // ✅ AI 실패 시 캐시된 것만 반환
                        log.warn("⚠️ AI 일부 실패, 캐시 데이터로 응답: cached={}개", cached.size());
                        return buildCachedRangeResponse(cached, categoryName, categoryId, uid);
                    }
                });
            }

        } catch (BusinessException e) {
            return CompletableFuture.failedFuture(e); // ✅ throw → failedFuture
        } catch (Exception e) {
            log.error("❌ 범위 검색 처리 실패: category={}", categoryName, e);
            return CompletableFuture.failedFuture(
                    new BusinessException(RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(), e.getMessage())
            );
        }
    }

    /**
     * ✅ GMS 설명: 캐시 히트 → 동기, 캐시 미스 → 비동기 AI 호출
     */
    public CompletableFuture<ExplainResponse> SingleIndustryExplain(ExplainRequest req) {
        final Integer buildingId = req.getBuilding_id();
        final String categoryName = req.getCategory();

        log.info("💬 GMS 설명 시작: buildingId={}, category={}", buildingId, categoryName);

        try {
            final Integer categoryId = categoryPort.getIdByName(categoryName);
            if (categoryId == null) {
                return CompletableFuture.failedFuture(new BusinessException( // ✅ throw → failedFuture
                        RecommendErrorCode.INVALID_RECOMMEND_TYPE.getCommonCode(),
                        "업종을 찾을 수 없습니다: " + categoryName
                ));
            }

            Optional<String> cachedExplanation = inOutPort.findExplanation(buildingId, categoryId);

            if (cachedExplanation.isPresent()) {
                // ✅ 캐시 히트 → 즉시 반환
                log.info("⚡ [EXPLANATION CACHE HIT] buildingId={}, categoryId={}", buildingId, categoryId);

                ExplainResponse response = ExplainResponse.builder()
                        .building_id(buildingId)
                        .category(categoryName)
                        .explanation(cachedExplanation.get())
                        .build();

                return CompletableFuture.completedFuture(response);

            } else {
                // ✅ 캐시 미스 → 비동기 AI 호출
                log.info("🚀 [EXPLANATION CACHE MISS] AI GMS 호출: buildingId={}, category={}", buildingId, categoryName);

                return CompletableFuture.supplyAsync(() -> {
                    try {
                        var bld = buildingPort.findByIdsList(List.of(buildingId)).getFirst();

                        JsonNode aiRaw = aiServerClient.requestGms(buildingId, bld.lat(), bld.lng(), categoryName);
                        String explanation = aiResponseParser.toCategoryGMSV2(aiRaw);

                        // 캐시 저장
                        inOutPort.upsertexplain(bld.id(), categoryId, explanation);

                        return ExplainResponse.builder()
                                .building_id(buildingId)
                                .category(categoryName)
                                .explanation(explanation)
                                .build();

                    } catch (Exception e) {
                        log.error("❌ AI GMS 호출 실패: buildingId={}, category={}", buildingId, categoryName, e);
                        throw new BusinessException(
                                RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                                "AI GMS 서비스 오류: " + e.getMessage()
                        );
                    }
                });
            }

        } catch (BusinessException e) {
            return CompletableFuture.failedFuture(e); // ✅ throw → failedFuture
        } catch (Exception e) {
            log.error("❌ GMS 설명 처리 실패: buildingId={}, category={}", buildingId, categoryName, e);
            return CompletableFuture.failedFuture(
                    new BusinessException(RecommendErrorCode.NO_RECOMMENDATION.getCommonCode(), e.getMessage())
            );
        }
    }

    // ============================================
    // ✅ 헬퍼 메소드들 (@Transactional 제거)
    // ============================================

    /**
     * ✅ 완전 캐시 응답 구성 (247개 → Top 20)
     */
    // @Transactional 제거 - 이미 위 메소드에서 트랜잭션 처리됨
    private RecommendResponse buildCompleteCacheResponse(GeoBuildingService.ResolvedBuilding bld, Long uid) {
        // ✅ InOutPort.CachedCategoryData 사용
        List<InOutPort.CachedCategoryData> allCached = inOutPort.getAllCachedCategories(bld.id());

        // 폐업률 기준 정렬 후 Top 20 선별
        List<RecommendResponse.CategoryResult> top20 = allCached.stream()
                .map(data -> new ScoredCategory(
                        RecommendResponse.CategoryResult.builder()
                                .category(data.categoryName())
                                .survivalRate(data.survivalRate())
                                .build(),
                        calculateFailureRate(data.survivalRate())
                ))
                .sorted((a, b) -> Double.compare(a.score(), b.score())) // 폐업률 낮은 순
                .limit(20)
                .map(ScoredCategory::result)
                .collect(Collectors.toList());

        // 사용자 기록 저장
        if (uid != null) {
            loginSearchPort.upsertubid(uid, bld.id());

            Set<Integer> top20CategoryIds = top20.stream()
                    .map(result -> categoryPort.getIdByName(result.getCategory()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            searchCategoryPort.upsertubcS(uid, bld.id(), top20CategoryIds);
        }

        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .result(top20)
                .meta(RecommendResponse.RecommendMeta.builder()
                        .source(Source.DB) // 캐시 사용
                        .version("v1")
                        .last_at(OffsetDateTime.now())
                        .build())
                .build();
    }

    /**
     * ✅ AI 응답 전체 처리 (247개 저장 → Top 20 반환)
     */
    // @Transactional 제거
    private RecommendResponse processFullAiResponse(GeoBuildingService.ResolvedBuilding bld,
                                                    Map<String, List<Double>> byCat,
                                                    Map<String, Integer> nameToId, Long uid) {
        log.info("AI 응답 수신: 총 {}개 카테고리", byCat.size());

        // 사용자 기록 시작
        if (uid != null) {
            loginSearchPort.upsertubid(uid, bld.id());
        }

        List<RecommendResponse.CategoryResult> resultList = new ArrayList<>();
        int count = 0;

        // 모든 카테고리를 한 번의 for문으로 처리
        for (Map.Entry<String, List<Double>> entry : byCat.entrySet()) {
            String name = entry.getKey();
            List<Double> value = entry.getValue();
            Integer catId = nameToId.get(name);

            if (catId == null) continue;

            // 모든 카테고리 InOut 저장 (캐시용)
            inOutPort.upsert(bld.id(), catId, value);

            if (count < 20) {
                // Top 20: SearchCategory 저장 + API 응답에 포함
                if (uid != null) {
                    searchCategoryPort.upsertubcS(uid, bld.id(), Set.of(catId));
                }

                resultList.add(
                        RecommendResponse.CategoryResult.builder()
                                .category(name)
                                .survivalRate(value)
                                .build()
                );

                count++;
            }
        }

        log.info("처리 완료: Top {}개 업종 반환, 총 {}개 캐시 저장", resultList.size(), byCat.size());

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
     * ✅ 캐시 기반 단일 업종 응답
     */
    // @Transactional 제거
    private RecommendResponse buildCacheResponse(GeoBuildingService.ResolvedBuilding bld, String categoryName,
                                                 Integer categoryId, List<Double> value, Long uid) {
        if (uid != null) {
            loginSearchPort.upsertubid(uid, bld.id());
            searchCategoryPort.upsertubcS(uid, bld.id(), Set.of(categoryId));
        }

        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .result(List.of(
                        RecommendResponse.CategoryResult.builder()
                                .category(categoryName)
                                .survivalRate(value)
                                .build()
                ))
                .meta(RecommendResponse.RecommendMeta.builder()
                        .source(Source.DB) // 캐시 사용
                        .version("v1")
                        .last_at(OffsetDateTime.now())
                        .build())
                .build();
    }

    /**
     * ✅ AI 기반 단일 업종 응답
     */
    // @Transactional 제거
    private RecommendResponse buildAiResponse(GeoBuildingService.ResolvedBuilding bld, String categoryName,
                                              Integer categoryId, List<Double> value, Long uid) {
        if (uid != null) {
            loginSearchPort.upsertubid(uid, bld.id());
            searchCategoryPort.upsertubcS(uid, bld.id(), Set.of(categoryId));
        }

        return RecommendResponse.builder()
                .building(RecommendResponse.Building.builder()
                        .building_id(bld.id())
                        .lat(bld.lat())
                        .lng(bld.lng())
                        .build())
                .result(List.of(
                        RecommendResponse.CategoryResult.builder()
                                .category(categoryName)
                                .survivalRate(value)
                                .build()
                ))
                .meta(RecommendResponse.RecommendMeta.builder()
                        .source(Source.AI) // AI 호출
                        .version("v1")
                        .last_at(OffsetDateTime.now())
                        .build())
                .build();
    }

    /**
     * ✅ 병렬 AI 호출 처리
     */
    private void processParallelAiCalls(List<ResolvedPoint> needsAI, String categoryName, Integer categoryId) {
        List<CompletableFuture<Void>> aiFutures = needsAI.stream()
                .map(point -> CompletableFuture.runAsync(() -> {
                    try {
                        JsonNode aiRaw = aiServerClient.requestCategory(
                                point.building().id(),
                                point.building().lat(),
                                point.building().lng(),
                                categoryName
                        );
                        List<Double> value = aiResponseParser.toCategoryMetricV2(aiRaw, categoryName);
                        inOutPort.upsert(point.building().id(), categoryId, value);

                    } catch (Exception e) {
                        log.error("AI 호출 실패: building={}", point.building().id(), e);
                    }
                }))
                .collect(Collectors.toList());

        // 모든 AI 호출 완료 대기
        CompletableFuture.allOf(aiFutures.toArray(new CompletableFuture[0])).join();
    }

    /**
     * ✅ 캐시된 범위 검색 결과 구성
     */
    // @Transactional 제거
    private RangeResponse buildCachedRangeResponse(List<ResolvedPoint> resolved, String categoryName,
                                                   Integer categoryId, Long uid) {
        List<RangeResponse.Item> items = resolved.stream()
                .map(r -> {
                    List<Double> v = inOutPort.get(r.building().id(), categoryId).orElse(List.of());

                    // 폐업률 계산 (5년차 우선, 없으면 평균)
                    double failureRate = calculateFailureRate(v);

                    // 사용자 기록
                    if (uid != null) {
                        loginSearchPort.upsertubid(uid, r.building().id());
                        searchCategoryPort.upsertubcS(uid, r.building().id(), Set.of(categoryId));
                    }

                    return new ScoredBuilding(
                            RangeResponse.Item.builder()
                                    .buildingId(r.building().id())
                                    .category(categoryName)
                                    .lat(r.original().getLat())
                                    .lng(r.original().getLng())
                                    .survivalRate(v)
                                    .build(),
                            failureRate
                    );
                })
                .sorted((a, b) -> Double.compare(a.score(), b.score())) // 폐업률 오름차순
                .limit(10) // Top 10 건물만
                .map(ScoredBuilding::item)
                .collect(Collectors.toList());

        return RangeResponse.builder()
                .items(items)
                .build();
    }

    /**
     * ✅ 최종 범위 검색 결과 구성 (캐시 + AI 혼합)
     */
    // @Transactional 제거
    private RangeResponse buildFinalRangeResponse(List<ResolvedPoint> resolved, String categoryName,
                                                  Integer categoryId, Long uid) {
        // 모든 건물 데이터 조회 후 Top 10 선별
        return buildCachedRangeResponse(resolved, categoryName, categoryId, uid);
    }

    /**
     * ✅ 폐업률 계산 헬퍼
     */
    private double calculateFailureRate(List<Double> survivalRate) {
        if (survivalRate.isEmpty()) {
            return 0.0;
        }
        if (survivalRate.size() >= 5) {
            return survivalRate.get(4); // 5년차 (인덱스 4)
        } else {
            return survivalRate.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
        }
    }

    /**
     * ✅ 헬퍼 레코드들
     */
    private record ResolvedPoint(RangeRequest.Point original, GeoBuildingService.ResolvedBuilding building) {}
    // ✅ CachedCategoryData 레코드 제거 - InOutPort.CachedCategoryData 사용
    private record ScoredCategory(RecommendResponse.CategoryResult result, double score) {}
    private record ScoredBuilding(RangeResponse.Item item, double score) {}
}
