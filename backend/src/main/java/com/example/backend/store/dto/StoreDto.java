package com.example.backend.store.dto;

import lombok.Data;

import java.math.BigDecimal;

// 매장 응답 DTO
@Data
public class StoreDto {
    private Long id;
    private String storeName;
    private String branchName;
    private String bizCategoryCode;
    private Integer dongCode;
    private String roadAddress;
    private BigDecimal lat;
    private BigDecimal lng;
}
