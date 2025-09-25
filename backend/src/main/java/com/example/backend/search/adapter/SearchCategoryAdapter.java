package com.example.backend.search.adapter;

import com.example.backend.search.entity.SearchCategoryEntity;
import com.example.backend.search.port.SearchCategoryPort;
import com.example.backend.search.repository.SearchCategoryRepository;
import com.example.backend.search.repository.projection.SearchCategoryProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Collection;
import java.util.Objects;

@Repository
@RequiredArgsConstructor
public class SearchCategoryAdapter implements SearchCategoryPort {

    private final SearchCategoryRepository repo;

    @Override
    @Transactional(readOnly = true)
    public List<SearchCategoryProjection> find(long userId, int buildingId) {
        return repo.findAllByUserIdAndBuildingId(userId, buildingId);
    }

    @Override
    @Transactional
    public int delete(long userId, int buildingId, List<Integer> categoryId) {
        return repo.deleteByUserIdAndBuildingIdAndCategoryIdIn(userId, buildingId, categoryId);
    }

    @Override
    @Transactional
    public void upsertubcS(long userId, int buildingId, Collection<Integer> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) return;

        // 중복 방지
        List<SearchCategoryEntity> entities = categoryIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .map(cid -> {
                    SearchCategoryEntity e = new SearchCategoryEntity();
                    e.setUserId(userId);
                    e.setBuildingId(buildingId);
                    e.setCategoryId(cid);
                    return e;
                })
                .toList();

        // JPA 내장: 존재하면 update, 없으면 insert
        repo.saveAll(entities);
    }
}
