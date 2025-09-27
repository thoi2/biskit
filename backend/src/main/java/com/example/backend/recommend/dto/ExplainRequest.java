package com.example.backend.recommend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExplainRequest {

    @NotNull
    private Integer building_id;

    @NotNull
    private String category;
}
