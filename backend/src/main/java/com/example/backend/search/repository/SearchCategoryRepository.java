package com.example.backend.search.repository;

import com.example.backend.search.entity.SearchCategoryEntity;
import com.example.backend.search.repository.projection.SearchCategoryProjection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SearchCategoryRepository
        extends JpaRepository<SearchCategoryEntity, SearchCategoryEntity.Key> {

    int deleteByUserIdAndBuildingIdAndCategoryIdIn(long userId, int buildingId, List<Integer> categoryIds);

    List<SearchCategoryProjection> findAllByUserIdAndBuildingId(long userId, int buildingId);
}
