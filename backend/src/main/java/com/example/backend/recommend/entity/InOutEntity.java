package com.example.backend.recommend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Objects;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "in_out")
@IdClass(InOutEntity.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class InOutEntity {

    @Id
    @Column(name = "building_id", nullable = false, columnDefinition = "MEDIUMINT UNSIGNED")
    private int buildingId;   // PK1

    @Id
    @Column(name = "category_id", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private int categoryId;   // PK2

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result", columnDefinition = "json", nullable = false)
    private List<Double> result;

    @Column(name = "explanation", columnDefinition = "MEDIUMTEXT")
    private String explanation;

    @Column(name = "frequency", nullable = false, columnDefinition = "INT NOT NULL DEFAULT 0")
    private int frequency = 0;

    @Column(name = "last_at")
    private OffsetDateTime lastAt; // TIMESTAMP NULL

    /** last_at을 UTC 현재 시각으로 갱신 */
    public void touchNow() {
        this.lastAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    // === 복합키 클래스 ===
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Key implements Serializable {
        private int buildingId;
        private int categoryId;

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return buildingId == key.buildingId && categoryId == key.categoryId;
        }
        @Override public int hashCode() {
            return Objects.hash(buildingId, categoryId);
        }
    }
}