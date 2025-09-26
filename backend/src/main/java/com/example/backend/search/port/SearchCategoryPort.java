package com.example.backend.search.port;

import com.example.backend.search.repository.projection.SearchCategoryProjection;
import java.util.List;
import java.util.Collection;

public interface SearchCategoryPort {
    List<SearchCategoryProjection> find(long userId, int buildingId);
    int delete(long userId, int buildingId, List<Integer> categoryId);

    void upsertubcS(long userId, int buildingId, Collection<Integer> categoryIds);
}