package com.example.backend.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;
import java.util.List;

@Value
@AllArgsConstructor
@Builder
public class ResultDeleteCategoriesResponse {
    int buildingId;
    List<String> deletedCategoryNames;
    int deletedCount;
}
