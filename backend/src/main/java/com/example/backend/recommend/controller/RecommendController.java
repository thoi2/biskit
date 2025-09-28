package com.example.backend.recommend.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.recommend.dto.*;
import com.example.backend.recommend.service.RecommendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/v1/ai")
@Slf4j
public class RecommendController {

    private final RecommendService recommendService;

    /**
     * ✅ 단일 검색 - 캐시 기반 동적 처리
     */
    @PostMapping("/single")
    public DeferredResult<ApiResponse<RecommendResponse>> getSingle(
            @Valid @RequestBody SingleRequest req,
            @AuthenticationPrincipal JwtUserInfo userInfo
    ) {
        Long uid = extractUserId(userInfo);
        log.info("🌟 단일 검색 시작: lat={}, lng={}, uid={}", req.getLat(), req.getLng(), uid);

        DeferredResult<ApiResponse<RecommendResponse>> deferredResult =
                new DeferredResult<>(120000L); // 30초 타임아웃

        // ✅ 캐시 기반 동적 처리 (Async 제거)
        recommendService.generateSingle(req, uid)
                .thenAccept(response -> {
                    log.info("✅ 단일 검색 완료: uid={}, categories={}", uid, response.getResult().size());
                    deferredResult.setResult(ApiResponse.of(response));
                })
                .exceptionally(throwable -> {
                    log.error("❌ 단일 검색 실패: uid={}, error={}", uid, throwable.getMessage(), throwable);
                    deferredResult.setErrorResult(throwable);
                    return null;
                });

        return deferredResult;
    }

    /**
     * ✅ 단일 업종 검색 - 캐시 기반 동적 처리
     */
    @PostMapping("/single-industry")
    public DeferredResult<ApiResponse<RecommendResponse>> getSingleIndustry(
            @Valid @RequestBody SingleIndustryRequest req,
            @AuthenticationPrincipal JwtUserInfo userInfo
    ) {
        Long uid = extractUserId(userInfo);
        log.info("🎯 단일 업종 검색 시작: lat={}, lng={}, category={}, uid={}",
                req.getLat(), req.getLng(), req.getCategory(), uid);

        DeferredResult<ApiResponse<RecommendResponse>> deferredResult =
                new DeferredResult<>(120000L);

        // ✅ 캐시 기반 동적 처리
        recommendService.generateSingleIndustry(req, uid)
                .thenAccept(response -> {
                    log.info("✅ 단일 업종 검색 완료: uid={}, category={}, source={}",
                            uid, req.getCategory(), response.getMeta().getSource());
                    deferredResult.setResult(ApiResponse.of(response));
                })
                .exceptionally(throwable -> {
                    log.error("❌ 단일 업종 검색 실패: uid={}, category={}, error={}",
                            uid, req.getCategory(), throwable.getMessage(), throwable);
                    deferredResult.setErrorResult(throwable);
                    return null;
                });

        return deferredResult;
    }

    /**
     * ✅ 범위 검색 - 캐시 기반 동적 처리
     */
    @PostMapping("/range")
    public DeferredResult<ApiResponse<RangeResponse>> getRange(
            @Valid @RequestBody RangeRequest req,
            @AuthenticationPrincipal JwtUserInfo userInfo
    ) {
        Long uid = extractUserId(userInfo);
        log.info("🗺️ 범위 검색 시작: category={}, points={}, uid={}",
                req.getCategory(), req.getPoints().size(), uid);

        DeferredResult<ApiResponse<RangeResponse>> deferredResult =
                new DeferredResult<>(120000L); // 60초 타임아웃 (범위 검색은 더 오래 걸림)

        // ✅ 캐시 기반 동적 처리
        recommendService.getRange(req, uid)
                .thenAccept(response -> {
                    log.info("✅ 범위 검색 완료: uid={}, category={}, buildings={}",
                            uid, req.getCategory(), response.getItems().size());
                    deferredResult.setResult(ApiResponse.of(response));
                })
                .exceptionally(throwable -> {
                    log.error("❌ 범위 검색 실패: uid={}, category={}, error={}",
                            uid, req.getCategory(), throwable.getMessage(), throwable);
                    deferredResult.setErrorResult(throwable);
                    return null;
                });

        return deferredResult;
    }

    /**
     * ✅ GMS 설명 - 캐시 기반 동적 처리
     */
    @PostMapping("/single-industry-explanation")
    public DeferredResult<ApiResponse<ExplainResponse>> getSingleIndustryExplanation(
            @Valid @RequestBody ExplainRequest req
    ) {
        log.info("💬 GMS 설명 시작: buildingId={}, category={}", req.getBuilding_id(), req.getCategory());

        DeferredResult<ApiResponse<ExplainResponse>> deferredResult =
                new DeferredResult<>(45000L); // 45초 타임아웃 (LLM 생성)

        // ✅ 캐시 기반 동적 처리
        recommendService.SingleIndustryExplain(req)
                .thenAccept(response -> {
                    log.info("✅ GMS 설명 완료: buildingId={}, category={}",
                            req.getBuilding_id(), req.getCategory());
                    deferredResult.setResult(ApiResponse.of(response));
                })
                .exceptionally(throwable -> {
                    log.error("❌ GMS 설명 실패: buildingId={}, category={}, error={}",
                            req.getBuilding_id(), req.getCategory(), throwable.getMessage(), throwable);
                    deferredResult.setErrorResult(throwable);
                    return null;
                });

        return deferredResult;
    }

    /**
     * ✅ JWT에서 사용자 ID 추출 헬퍼
     */
    private Long extractUserId(JwtUserInfo userInfo) {
        try {
            return userInfo != null ? Long.valueOf(userInfo.userId()) : null;
        } catch (Exception e) {
            log.warn("JWT에서 사용자 ID 추출 실패: {}", e.getMessage());
            return null;
        }
    }
}
