package com.example.backend.recommend.port;

import java.util.Collection;
import java.util.List;
import java.util.Map;
public interface CategoryPort {
    Integer getIdByName(String name);
    Map<String, Integer> getIdsByNames(Collection<String> names);
    Map<Integer, String> getNamesByIds(List<Integer> ids);
}
