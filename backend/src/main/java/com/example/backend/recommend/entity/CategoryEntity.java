package com.example.backend.recommend.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "category")
@Getter
@Setter
@NoArgsConstructor
public class CategoryEntity {

    @Id
    @Column(name = "category_id", nullable = false, columnDefinition = "SMALLINT UNSIGNED")
    private int categoryId;

    @Column(name = "name", nullable = false, length = 100, unique = true)
    private String name;
}