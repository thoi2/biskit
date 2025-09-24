package com.example.backend.recommend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Size;
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
    @Column(name = "building_id", nullable = false, columnDefinition = "MEDIUMINT UNSIGNED")
    private int id;

    @Column(name = "adr_mng_no", length = 26, nullable = false, unique = true)
    @Size(min=25, max=26)
    private String adrMngNo;

    @Column(name = "lat", nullable = false, precision = 15, scale = 12)
    private BigDecimal lat;

    @Column(name = "lng", nullable = false, precision = 15, scale = 12)
    private BigDecimal lng;
}
