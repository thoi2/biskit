package com.example.backend.user.dto;

import lombok.Data;
import java.util.List;

@Data
public class AIRecommendationRequest {
    private String age;
    private List<String> experience;
    private String budget;
    private List<String> interests;
    private String workStyle;
    private String location;
    private String riskTolerance;
}
