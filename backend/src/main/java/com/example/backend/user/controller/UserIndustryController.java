package com.example.backend.user.controller;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import com.example.backend.common.response.ApiResponse;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.user.dto.*;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import com.example.backend.user.service.AIRecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/user/industry")
@RequiredArgsConstructor
@Validated
@Slf4j
public class UserIndustryController {

    private final UserRepository userRepository;
    private final AIRecommendationService aiRecommendationService;

    /**
     * 사용자 업종 확인 (GET /api/v1/user/industry/search)
     * JWT 토큰에서 사용자 ID 추출
     */
    @GetMapping("/search")
    public ApiResponse<UserIndustryResponse> searchUserIndustry() {
        Long userId = getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        UserIndustryResponse response = UserIndustryResponse.builder()
                .userId(user.getId())
                .industry1st(user.getIndustry1st())
                .industry2nd(user.getIndustry2nd())
                .industry3rd(user.getIndustry3rd())
                .surveyCompletedAt(user.getSurveyCompletedAt())
                .hasRecommendation(user.hasRecommendation())
                .build();

        return ApiResponse.of(response);
    }

    /**
     * 사용자 업종 추천 저장 (POST /api/v1/user/industry/survey)
     * JWT 토큰에서 사용자 ID 추출
     */
    @PostMapping("/survey")
    public ApiResponse<String> createIndustrySurvey(
            @Valid @RequestBody IndustrySurveyRequest request) {

        Long userId = getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 기본적인 검증만 수행
        validateBasicIndustryFormat(request.getIndustry1st(), request.getIndustry2nd(), request.getIndustry3rd());
        validateNoDuplicateIndustries(request.getIndustry1st(), request.getIndustry2nd(), request.getIndustry3rd());

        // 추천 결과 저장 (덮어쓰기 허용)
        user.updateRecommendations(
                request.getIndustry1st(),
                request.getIndustry2nd(),
                request.getIndustry3rd()
        );

        userRepository.save(user);

        log.info("사용자 {}의 업종 추천 결과가 저장되었습니다. [1st: {}, 2nd: {}, 3rd: {}]",
                userId, request.getIndustry1st(), request.getIndustry2nd(), request.getIndustry3rd());

        return ApiResponse.of("업종 추천 결과가 성공적으로 저장되었습니다.");
    }

    /**
     * 사용자 업종 수정 (PUT /api/v1/user/industry/update)
     * JWT 토큰에서 사용자 ID 추출
     */
    @PutMapping("/update")
    public ApiResponse<String> updateUserIndustry(
            @Valid @RequestBody IndustryUpdateRequest request) {

        Long userId = getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 기본 형식 검증
        validateBasicIndustryFormat(request.getIndustry1st(), request.getIndustry2nd(), request.getIndustry3rd());

        // 업데이트할 최종 업종 리스트 생성
        String finalIndustry1st = request.getIndustry1st() != null ? request.getIndustry1st() : user.getIndustry1st();
        String finalIndustry2nd = request.getIndustry2nd() != null ? request.getIndustry2nd() : user.getIndustry2nd();
        String finalIndustry3rd = request.getIndustry3rd() != null ? request.getIndustry3rd() : user.getIndustry3rd();

        // 최종 결과에서 중복 검증
        validateNoDuplicateIndustries(finalIndustry1st, finalIndustry2nd, finalIndustry3rd);

        // 실제 업데이트 (null이 아닌 값만)
        if (request.getIndustry1st() != null) {
            user.setIndustry1st(request.getIndustry1st());
        }
        if (request.getIndustry2nd() != null) {
            user.setIndustry2nd(request.getIndustry2nd());
        }
        if (request.getIndustry3rd() != null) {
            user.setIndustry3rd(request.getIndustry3rd());
        }

        userRepository.save(user);

        log.info("사용자 {}의 업종 정보가 업데이트되었습니다.", userId);
        return ApiResponse.of("업종 정보가 성공적으로 업데이트되었습니다.");
    }

    /**
     * 사용자 업종 삭제 (DELETE /api/v1/user/industry/delete)
     * JWT 토큰에서 사용자 ID 추출
     */
    @DeleteMapping("/delete")
    public ApiResponse<String> deleteUserIndustry() {
        Long userId = getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 업종 정보 초기화
        user.clearRecommendations();
        userRepository.save(user);

        log.info("사용자 {}의 업종 추천 결과가 삭제되었습니다.", userId);
        return ApiResponse.of("업종 추천 결과가 성공적으로 삭제되었습니다.");
    }
    /**
     * AI 기반 업종 추천 (POST /api/v1/user/industry/ai-recommend)
     * RestTemplate + @Async 방식으로 Spring Security 완벽 호환
     */
    @PostMapping("/ai-recommend")
    public DeferredResult<ApiResponse<AIRecommendationResponse>> generateAIRecommendations(
            @Valid @RequestBody AIRecommendationRequest request) {

        Long userId = getCurrentUserId();
        log.info("🎯 컨트롤러 진입! AI 업종 추천 요청: userId={}", userId);

        // DeferredResult 생성 (30초 타임아웃)
        DeferredResult<ApiResponse<AIRecommendationResponse>> deferredResult =
                new DeferredResult<>(30000L);

        // 사용자 존재 확인
        if (!userRepository.existsById(userId)) {
            deferredResult.setResult(ApiResponse.of(AIRecommendationResponse.builder()
                    .success(false)
                    .errorMessage("사용자를 찾을 수 없습니다.")
                    .recommendations(new ArrayList<>())
                    .build()));
            return deferredResult;
        }

        // 비동기 처리
        aiRecommendationService.generateRecommendations(request, userId)
                .thenAccept(response -> {
                    System.out.println("🎯 응답 매핑 시작");
                    // 디버깅 로그들...

                    ApiResponse<AIRecommendationResponse> apiResponse = ApiResponse.of(response);
                    System.out.println("🎯 DeferredResult 설정 완료");
                    deferredResult.setResult(apiResponse);  // ✅ DeferredResult로 결과 설정
                })
                .exceptionally(throwable -> {
                    System.out.println("🚨 예외: " + throwable.getMessage());
                    deferredResult.setResult(ApiResponse.of(AIRecommendationResponse.builder()
                            .success(false)
                            .errorMessage("AI 서비스 일시적 오류입니다.")
                            .recommendations(new ArrayList<>())
                            .build()));
                    return null;
                });

        return deferredResult;  // ✅ DeferredResult 반환
    }








    /**
     * JWT 토큰에서 현재 사용자 ID 추출
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_MISSING);
        }

        try {
            // Principal에서 JwtUserInfo 객체 직접 가져오기
            Object principal = authentication.getPrincipal();
            if (principal instanceof JwtUserInfo userInfo) {
                return Long.parseLong(userInfo.userId());
            }

            // 혹시 문자열로 온 경우 (backup)
            return Long.parseLong(authentication.getName());

        } catch (NumberFormatException e) {
            log.error("사용자 ID 파싱 실패: {}", authentication.getPrincipal(), e);
            throw new BusinessException(ErrorCode.AUTH_INVALID_SIGNATURE);
        }
    }

    /**
     * 기본적인 업종 형식만 검증 (프론트를 신뢰하는 접근)
     */
    private void validateBasicIndustryFormat(String... industryCodes) {
        for (String code : industryCodes) {
            if (code != null) {
                if (code.trim().isEmpty()) {
                    throw new BusinessException(ErrorCode.INDUSTRY_INVALID_CODE, "업종 코드는 빈 값일 수 없습니다.");
                }
                if (code.length() > 20) {
                    throw new BusinessException(ErrorCode.INDUSTRY_CODE_TOO_LONG, "업종 코드가 너무 깁니다.");
                }
                if (containsSuspiciousCharacters(code)) {
                    throw new BusinessException(ErrorCode.INDUSTRY_INVALID_CODE, "유효하지 않은 문자가 포함되어 있습니다.");
                }
            }
        }
    }

    /**
     * 중복 업종 검증 (같은 업종을 여러 번 선택하는 것만 방지)
     */
    private void validateNoDuplicateIndustries(String industry1st, String industry2nd, String industry3rd) {
        String[] industries = {industry1st, industry2nd, industry3rd};

        String[] nonNullIndustries = Arrays.stream(industries)
                .filter(Objects::nonNull)
                .filter(s -> !s.trim().isEmpty())
                .toArray(String[]::new);

        for (int i = 0; i < nonNullIndustries.length; i++) {
            for (int j = i + 1; j < nonNullIndustries.length; j++) {
                if (nonNullIndustries[i].equals(nonNullIndustries[j])) {
                    throw new BusinessException(ErrorCode.INDUSTRY_DUPLICATE_RECOMMENDATION,
                            "같은 업종을 중복으로 선택할 수 없습니다.");
                }
            }
        }
    }

    /**
     * 기본적인 보안 검증 (SQL Injection 등 방지)
     */
    private boolean containsSuspiciousCharacters(String input) {
        String suspiciousPattern = ".*[';\"\\-\\-/\\*].*";
        return input.matches(suspiciousPattern);
    }
}
