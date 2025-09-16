package com.example.backend.recommend.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.recommend.dto.RecommendResponse;
import com.example.backend.recommend.dto.SingleIndustryRequest;
import com.example.backend.recommend.dto.SingleRequest;
import com.example.backend.recommend.service.RecommendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/v1/ai")
public class RecommendController {

    private final RecommendService recommendService;
    @PostMapping("/single")
    public ResponseEntity<ApiResponse<RecommendResponse>> getSingle(
            @Valid @RequestBody SingleRequest req,
            @RequestHeader(name = "X-Correlation-Id", required = false) String correlationId
    ) {
        RecommendResponse res = recommendService.generateSingle(req, correlationId);
        return ResponseEntity.ok(ApiResponse.of(res));
    }
    @PostMapping("/single-industry")
    public ResponseEntity<ApiResponse<RecommendResponse>> getSingleIndustry(
            @Valid @RequestBody SingleIndustryRequest req,
            @RequestHeader(name = "X-Correlation-Id", required = false) String correlationId
    ) {
        RecommendResponse res = recommendService.generateSingleIndustry(req, correlationId);
        return ResponseEntity.ok(ApiResponse.of(res));
    }
}