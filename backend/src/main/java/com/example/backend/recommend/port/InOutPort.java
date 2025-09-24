package com.example.backend.recommend.port;

import java.util.Optional;
import java.util.List;
import java.util.Map;
public interface InOutPort {

    Optional<Double> get(int buildingId, int categoryId);

    void upsert(int buildingId, int categoryId, double result);

    // 필요하면 캐시 제거도 계약에 추가 가능
    // void evict(int buildingId, int categoryId);
    List<InOutResult> findResults(int buildingId, List<Integer> categoryIds);

    Map<Integer, List<InOutResult>> findResultsByBidList(Map<Integer, List<Integer>> BCL);
    record InOutResult(int categoryId, Double result) {}
}
