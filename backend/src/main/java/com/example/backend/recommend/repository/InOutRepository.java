package com.example.backend.recommend.repository;

import com.example.backend.recommend.entity.InOutEntity;
import com.example.backend.recommend.entity.InOutEntity.Key;
import com.example.backend.recommend.repository.projection.InOutProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface InOutRepository extends JpaRepository<InOutEntity, Key> {

    Optional<InOutEntity> findByBuildingIdAndCategoryId(Integer buildingId, Integer categoryId);
    List<InOutProjection> findAllByBuildingIdAndCategoryIdIn(int buildingId, List<Integer> categoryIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
       update InOutEntity io
          set io.frequency = io.frequency + 1,
              io.lastAt    = CURRENT_TIMESTAMP
        where io.buildingId = :buildingId
          and io.categoryId = :categoryId
    """)
    void bumpUsage(@Param("buildingId") Integer buildingId, @Param("categoryId") Integer categoryId);

    // ✅ 추가: 캐시 완성도 체크용 메소드들
    @Query("SELECT COUNT(io) FROM InOutEntity io WHERE io.buildingId = :buildingId")
    int countByBuildingId(@Param("buildingId") Integer buildingId);

    List<InOutEntity> findAllByBuildingId(Integer buildingId);
}
