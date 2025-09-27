package com.example.backend.recommend.adapter;

import com.example.backend.recommend.infra.cache.ResultCache;
import com.example.backend.recommend.entity.InOutEntity;
import com.example.backend.recommend.entity.InOutEntity.Key;
import com.example.backend.recommend.repository.InOutRepository;
import com.example.backend.recommend.repository.projection.InOutProjection;
import com.example.backend.recommend.port.InOutPort;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
@Component
@RequiredArgsConstructor
public class InOutAdapter implements InOutPort {

    private static final Duration DEFAULT_TTL = Duration.ofHours(24);

    private final InOutRepository inOutRepository;
    private final ResultCache cache;

    /** 캐시→DB 조회. DB 히트 시 frequency/last_at 갱신 + 캐시 set */
    @Override
    @Transactional
    public Optional<List<Double>> get(int buildingId, int categoryId) {
        // 1) cache
//        var cached = cache.get(buildingId, categoryId);
//        if (cached.isPresent()) return cached;

        // 2) db
        var db = inOutRepository.findByBuildingIdAndCategoryId(buildingId, categoryId);
        if (db.isEmpty()) return Optional.empty();

        // 조회 성공: 사용량 증가 + 캐시 set
        inOutRepository.bumpUsage(buildingId, categoryId);
        var vals = db.get().getResult();
//        cache.set(buildingId, categoryId, val, DEFAULT_TTL);
        return Optional.ofNullable(vals);
    }

    /** AI 결과 업서트 + 캐시 set (write-through) */
    @Override
    @Transactional
    public void upsert(int buildingId, int categoryId, List<Double> result) {
        var id = new Key(buildingId, categoryId);

        InOutEntity entity = inOutRepository.findById(id).orElseGet(() -> {
            var e = new InOutEntity();
            e.setBuildingId(buildingId);
            e.setCategoryId(categoryId);
            e.setFrequency(0);
            return e;
        });

        entity.setResult(result);
        Integer freq = entity.getFrequency();
        entity.setFrequency((freq == null ? 0 : freq) + 1);
        entity.touchNow();
        inOutRepository.save(entity);

//        cache.set(buildingId, categoryId, result, DEFAULT_TTL);
    }

    @Override
    public List<InOutResult> findResults(int buildingId, List<Integer> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return List.of();
        }

        List<InOutProjection> rows = inOutRepository
                .findAllByBuildingIdAndCategoryIdIn(buildingId, categoryIds);

        Map<Integer, List<Double>> resultMap = rows.stream()
                .collect(Collectors.toMap(
                        InOutProjection::getCategoryId,
                        InOutProjection::getResult,
                        (a, b) -> a,
                        java.util.LinkedHashMap::new
                ));

        // 3) 입력 순서대로 리스트 생성, 없으면 기본값(null 또는 0.0)
        return categoryIds.stream()
                .map(cid -> new InOutResult(cid, resultMap.get(cid))) // 없으면 null
                .toList();
    }

    @Override
    public Map<Integer, List<InOutResult>> findResultsByBidList(Map<Integer, List<Integer>> BCL) {
        if (BCL == null || BCL.isEmpty()) {
            return Map.of();
        }

        Map<Integer, List<InOutResult>> result = new LinkedHashMap<>();

        for (Map.Entry<Integer, List<Integer>> entry : BCL.entrySet()) {
            int bid = entry.getKey();
            List<Integer> cids = entry.getValue();

            List<InOutResult> rows = findResults(bid, cids);
            result.put(bid, rows);
        }

        return result;
    }

    @Override
    public Optional<String> findExplanation(int buildingId, int categoryId) {
        return inOutRepository.findByBuildingIdAndCategoryId(buildingId, categoryId)
                .map(InOutEntity::getExplanation);
    }

    @Override
    @Transactional
    public void upsertexplain(int buildingId, int categoryId, String explanation) {
        var id = new Key(buildingId, categoryId);

        InOutEntity entity = inOutRepository.findById(id).orElseGet(() -> {
            var e = new InOutEntity();
            e.setBuildingId(buildingId);
            e.setCategoryId(categoryId);
            return e;
        });
        entity.setExplanation(explanation);
        inOutRepository.save(entity);
    }
}
