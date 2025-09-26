package com.example.backend.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;
import java.util.List;

@Value
@AllArgsConstructor
@Builder
public class ResultGetResponse {
    List<Item> items;

    @Value
    @Builder
    public static class Item {
        int buildingId;
        BigDecimal lat;   // DECIMAL(15,12)
        BigDecimal lng;   // DECIMAL(15,12)
        boolean favorite;
        List<Category> categories;
    }

    @Value
    @Builder
    public static class Category {
        String category;
        List<Double>  survivalRate;
    }
}
