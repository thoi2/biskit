package com.example.backend.recommend.adapter;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.example.backend.recommend.repository.CategoryRepository;
import com.example.backend.recommend.repository.projection.CategoryProjection;
import com.example.backend.recommend.port.CategoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
import java.util.Collection;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class CategoryAdapter implements CategoryPort {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public Integer getIdByName(String name) {
        return categoryRepository.findByName(name)
                .map(c -> c.getCategoryId())
                .orElseThrow(() -> new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                        "알 수 없는 카테고리: " + name
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Integer> getIdsByNames(Collection<String> names) {
        if (names == null || names.isEmpty()) return Collections.emptyMap();

        List<CategoryProjection> rows = categoryRepository.findAllByNameIn(names);
        return rows.stream()
                .collect(Collectors.toMap(
                        CategoryProjection::getName,
                        CategoryProjection::getCategoryId,
                        (a, b) -> a,                     // 중복 이름 시 첫 값 유지
                        LinkedHashMap::new               // 예측 가능한 순서
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Integer, String> getNamesByIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();

        List<Integer> cleaned = ids.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (cleaned.isEmpty()) return Map.of();

        List<CategoryProjection> rows = categoryRepository.findAllByCategoryIdIn(cleaned);

        return rows.stream()
                .collect(Collectors.toMap(
                        CategoryProjection::getCategoryId,
                        CategoryProjection::getName,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    // ✅ 추가: Set 버전
    @Transactional(readOnly = true)
    @Override
    public Map<Integer, String> getNamesByIds(Set<Integer> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();

        List<CategoryProjection> rows = categoryRepository.findAllByCategoryIdIn(ids);

        return rows.stream()
                .collect(Collectors.toMap(
                        CategoryProjection::getCategoryId,
                        CategoryProjection::getName,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }
}
