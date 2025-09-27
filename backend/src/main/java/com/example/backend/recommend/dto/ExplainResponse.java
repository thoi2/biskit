package com.example.backend.recommend.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ExplainResponse {

    int building_id;
    String category;
    String explanation;
}