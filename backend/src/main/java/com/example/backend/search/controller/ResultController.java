package com.example.backend.search.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.search.dto.ResultDeleteResponse;
import com.example.backend.search.dto.ResultDeleteCategoriesResponse;
import com.example.backend.search.dto.ResultDeleteCategoriesRequest;
import com.example.backend.search.dto.ResultGetResponse;
import com.example.backend.search.service.ResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/v1/result")
public class ResultController {

    private final ResultService resultService;

    /**
     * 조회: 유저의 검색 결과 목록 가져오기
     */
    @GetMapping
    public ApiResponse<ResultGetResponse> getResults(
            @AuthenticationPrincipal JwtUserInfo userInfo
    ) {
        Long uid;
        try {
            String userId = userInfo.userId();
            uid = Long.valueOf(userId);
        } catch (Exception e) {
            uid = null;
        }
        ResultGetResponse res = resultService.getMyResults(uid);
        return ApiResponse.of(res);
    }

    /**
     * 삭제: 특정 건물 검색 기록 전체 삭제
     */
    @DeleteMapping("/{buildingId}")
    public ApiResponse<ResultDeleteResponse> deleteBuilding(
            @AuthenticationPrincipal JwtUserInfo userInfo,
            @PathVariable int buildingId
    ) {
        Long uid;
        try {
            String userId = userInfo.userId();
            uid = Long.valueOf(userId);
        } catch (Exception e) {
            uid = null;
        }

        ResultDeleteResponse res = resultService.deleteBuilding(uid, buildingId);
        return ApiResponse.of(res);
    }

    /**
     * 삭제: 특정 건물의 일부 카테고리 기록 삭제
     */
    @DeleteMapping("/{buildingId}/categories")
    public ApiResponse<ResultDeleteCategoriesResponse> deleteCategories(
            @AuthenticationPrincipal JwtUserInfo userInfo,
            @PathVariable int buildingId,
            @Valid @RequestBody ResultDeleteCategoriesRequest req
    ) {
        Long uid;
        try {
            String userId = userInfo.userId();
            uid = Long.valueOf(userId);
        } catch (Exception e) {
            uid = null;
        }
        ResultDeleteCategoriesResponse res = resultService.deleteCategories(uid, buildingId, req);
        return ApiResponse.of(res);
    }
}