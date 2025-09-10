package com.example.backend.store.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "store")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "store_name", length = 64)
    private String storeName;

    @Column(name = "branch_name", length = 12)
    private String branchName;

    @Column(name = "biz_category_code", length = 6, columnDefinition = "CHAR(6)")
    private String bizCategoryCode;

    @Column(name = "dong_code", nullable = false)
    private Integer dongCode;

    @Column(name = "road_address", length = 32)
    private String roadAddress;

    @Column(name = "lat", precision = 15, scale = 12, nullable = false)
    private BigDecimal lat;

    @Column(name = "lng", precision = 15, scale = 12, nullable = false)
    private BigDecimal lng;
}
