package com.example.backend.recommend.port;

import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface CategoryPort {
    Integer getIdByName(String name);
    Map<String, Integer> getIdsByNames(Collection<String> names);
    Map<Integer, String> getNamesByIds(List<Integer> ids);

    // ✅ 추가: Set 버전
    @Transactional(readOnly = true)
    Map<Integer, String> getNamesByIds(Set<Integer> ids);
}
