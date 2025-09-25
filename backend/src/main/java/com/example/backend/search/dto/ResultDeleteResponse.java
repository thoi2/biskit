package com.example.backend.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;

@Value
@AllArgsConstructor
@Builder
public class ResultDeleteResponse {
    int buildingId;
    int deletedCount;   // login_search 1건 삭제 시 1
}
