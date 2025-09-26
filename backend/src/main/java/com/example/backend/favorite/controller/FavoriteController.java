package com.example.backend.favorite.controller;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.response.ApiResponse;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.common.exception.ErrorCode;
import com.example.backend.favorite.service.FavoriteService;
import com.example.backend.favorite.dto.FavoriteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/v1/like")
public class FavoriteController {

    private final FavoriteService favoriteService;
    @PostMapping("/{buildingId}")
    public ApiResponse<FavoriteResponse> likeOn(
            @AuthenticationPrincipal JwtUserInfo userInfo,
            @PathVariable int buildingId
    ) {
        Long uid;
        try {
            String userId = userInfo.userId();
            uid = Long.valueOf(userId);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AUTH_MISSING_REQUIRED_CLAIM);
        }
        FavoriteResponse res = favoriteService.setFavorite(uid, buildingId, true);
        return ApiResponse.of(res);
    }

    @DeleteMapping("/{buildingId}")
    public ApiResponse<FavoriteResponse> likeOff(
            @AuthenticationPrincipal JwtUserInfo userInfo,
            @PathVariable int buildingId
    ) {
        Long uid;
        try {
            String userId = userInfo.userId();
            uid = Long.valueOf(userId);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AUTH_MISSING_REQUIRED_CLAIM);
        }
        FavoriteResponse res = favoriteService.setFavorite(uid, buildingId, false);
        return ApiResponse.of(res);
    }
}