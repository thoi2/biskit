package com.example.backend.recommend.repository;

import com.example.backend.recommend.entity.CategoryEntity;
import com.example.backend.recommend.repository.projection.CategoryProjection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;
import java.util.List;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Integer> {
    Optional<CategoryEntity> findByName(String name);
    List<CategoryProjection> findAllByCategoryIdIn(Collection<Integer> ids);
    List<CategoryProjection> findAllByNameIn(Collection<String> names);
}