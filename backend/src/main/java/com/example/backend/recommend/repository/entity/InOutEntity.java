package com.example.backend.recommend.repository.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "in_out")
@IdClass(InOutEntity.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class InOutEntity {

    @Id
    @Column(name = "building_id", nullable = false)
    private Integer buildingId;

    @Id
    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

    @Column(name = "result", nullable = false)
    private Double result;

    @Column(name = "frequency", nullable = false)
    private Integer frequency;

    @Column(name = "last_at")
    private OffsetDateTime lastAt;

    /** last_at을 현재 시각으로 갱신 */
    public void touchNow() {
        this.lastAt = OffsetDateTime.from(Instant.now());
    }

    // === 내부 static 키 클래스 ===
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Key implements Serializable {
        private Integer buildingId;
        private Integer categoryId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key)) return false;
            Key key = (Key) o;
            return Objects.equals(buildingId, key.buildingId) &&
                    Objects.equals(categoryId, key.categoryId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(buildingId, categoryId);
        }
    }
}
