package com.example.backend.recommend.repository;

import com.example.backend.recommend.infra.cache.ResultCache;
import com.example.backend.recommend.repository.entity.InOutEntity;
import com.example.backend.recommend.repository.entity.InOutEntity.Key;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class InOutStore {

    private static final Duration DEFAULT_TTL = Duration.ofHours(24);

    private final InOutRepository repository;
    private final ResultCache cache;

    /** 캐시→DB 조회. DB 히트 시 frequency/last_at 갱신 + 캐시 set */
    @Transactional
    public Optional<Double> get(int buildingId, int categoryId) {
        // 1) cache
//        var cached = cache.get(buildingId, categoryId);
//        if (cached.isPresent()) return cached;

        // 2) db
        var db = repository.findByBuildingIdAndCategory(buildingId, categoryId);
        if (db.isEmpty()) return Optional.empty();

        // 조회 성공: 사용량 증가 + 캐시 set
        repository.bumpUsage(buildingId, categoryId);
        Double val = db.get().getResult();
        cache.set(buildingId, categoryId, val, DEFAULT_TTL);
        return Optional.ofNullable(val);
    }

    /** AI 결과 업서트 + 캐시 set (write-through) */
    @Transactional
    public void upsert(int buildingId, int categoryId, double result) {
        var id = new Key(buildingId, categoryId);

        InOutEntity entity = repository.findById(id).orElseGet(() -> {
            var e = new InOutEntity();
            e.setBuildingId(buildingId);
            e.setCategoryId(categoryId);
            e.setFrequency(0);
            return e;
        });

        entity.setResult(result);
        entity.setFrequency(entity.getFrequency() + 1);
        entity.touchNow();
        repository.save(entity);

//        cache.set(buildingId, categoryId, result, DEFAULT_TTL);
    }

//    public void evict(int buildingId, int categoryId) {
//        cache.evict(buildingId, categoryId);
//    }
}
