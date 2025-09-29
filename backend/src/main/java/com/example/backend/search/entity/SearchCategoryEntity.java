package com.example.backend.search.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "search_category")
@IdClass(SearchCategoryEntity.Key.class)
@Getter @Setter
@NoArgsConstructor
public class SearchCategoryEntity {

    @Id
    @Column(name = "user_id", nullable = false, columnDefinition = "BIGINT")
    private long userId;

    @Id
    @Column(name = "building_id", nullable = false, columnDefinition = "MEDIUMINT UNSIGNED")
    private int buildingId;

    @Id
    @Column(name = "category_id", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private int categoryId;

    /** 복합 키 클래스 */
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Key implements Serializable {
        private long userId;
        private int buildingId;
        private int categoryId;

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return userId == key.userId &&
                    buildingId == key.buildingId &&
                    categoryId == key.categoryId;
        }
        @Override public int hashCode() {
            return Objects.hash(userId, buildingId, categoryId);
        }
    }
}
