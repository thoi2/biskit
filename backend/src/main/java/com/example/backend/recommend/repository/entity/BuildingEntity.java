package com.example.backend.recommend.repository.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "building")
@Getter
@Setter
@NoArgsConstructor
public class BuildingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "building_id")
    private Integer id;

    @Column(name = "adr_mng_no", length = 26, nullable = false, unique = true)
    private String adrMngNo;

    @Column(name = "lat", nullable = false, precision = 15, scale = 12)
    private BigDecimal lat;

    @Column(name = "lng", nullable = false, precision = 15, scale = 12)
    private BigDecimal lng;
}
