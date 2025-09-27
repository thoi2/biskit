// com.example.backend.recommend.dto.ItemsResponse.java
package com.example.backend.recommend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.List;

@Value
@Builder
public class RangeResponse {
    List<Item> items;

    @Value
    @Builder
    public static class Item {
        @JsonProperty("building_id")
        Integer buildingId;
        String category;
        BigDecimal lat;
        BigDecimal lng;

        @JsonProperty("survival_rate")
        List<Double> survivalRate;
    }
}
