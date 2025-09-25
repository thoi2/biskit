package com.example.backend.recommend.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.recommend.dto.RecommendResponse;
import com.example.backend.recommend.dto.SingleIndustryRequest;
import com.example.backend.recommend.dto.SingleRequest;
import com.example.backend.recommend.service.RecommendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/v1/ai")
public class RecommendController {
//String userId
    private final RecommendService recommendService;
    @PostMapping("/single")
    public ApiResponse<RecommendResponse> getSingle(
            @Valid @RequestBody SingleRequest req,
            @AuthenticationPrincipal JwtUserInfo userInfo
    ) {
        Long uid;
        try {
            String userId = userInfo.userId();
            uid = Long.valueOf(userId);
        } catch (Exception e) {
            uid = null;
        }
        RecommendResponse res = recommendService.generateSingle(req, uid);
        return ApiResponse.of(res);
    }
    @PostMapping("/single-industry")
    public ApiResponse<RecommendResponse> getSingleIndustry(
            @Valid @RequestBody SingleIndustryRequest req,
            @AuthenticationPrincipal JwtUserInfo userInfo
    ) {
        Long uid;
        try {
            String userId = userInfo.userId();
            uid = Long.valueOf(userId);
        } catch (Exception e) {
            uid = null;
        }
        RecommendResponse res = recommendService.generateSingleIndustry(req, uid);
        return ApiResponse.of(res);
    }
}