package com.example.backend.user.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserIndustryResponse {
    private Long userId;
    private String industry1st;
    private String industry2nd;
    private String industry3rd;
    private LocalDateTime surveyCompletedAt;
    private boolean hasRecommendation;
}
