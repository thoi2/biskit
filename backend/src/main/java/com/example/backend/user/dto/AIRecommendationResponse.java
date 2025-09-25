package com.example.backend.user.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AIRecommendationResponse {
    private boolean success;
    private List<AIRecommendation> recommendations;
    private String summary;
    private String errorMessage;
}


