package com.example.backend.search.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "login_search")
@IdClass(LoginSearchEntity.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class LoginSearchEntity {

    @Id
    @Column(name = "user_id", nullable = false, columnDefinition = "BIGINT")
    private long userId;

    @Id
    @Column(name = "building_id", nullable = false, columnDefinition = "MEDIUMINT UNSIGNED")
    private int buildingId;

    @Column(name = "favorite", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean favorite;

    /** 복합 키 클래스 */
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Key implements Serializable {
        private long userId;
        private int buildingId;

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return userId == key.userId && buildingId == key.buildingId;
        }
        @Override public int hashCode() {
            return Objects.hash(userId, buildingId);
        }
    }
}
