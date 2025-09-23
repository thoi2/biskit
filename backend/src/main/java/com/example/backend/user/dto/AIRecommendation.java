package com.example.backend.user.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AIRecommendation {
    private String industryCode;    // "G20902"
    private String industryName;    // "여성 의류 소매업"
    private String category;        // "소매"
    private String reason;          // 추천 이유
    private Integer score;          // 추천 점수
}