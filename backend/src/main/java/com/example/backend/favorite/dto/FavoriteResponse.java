package com.example.backend.favorite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class FavoriteResponse {
    int buildingId;

    @JsonProperty("isLiked")
    boolean liked;

    public static FavoriteResponse of(int buildingId, boolean liked) {
        return FavoriteResponse.builder()
                .buildingId(buildingId)
                .liked(liked)
                .build();
    }
}
