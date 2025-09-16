package com.example.backend.recommend.repository;

import com.example.backend.recommend.repository.entity.InOutEntity;
import com.example.backend.recommend.repository.entity.InOutEntity.Key;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InOutRepository extends JpaRepository<InOutEntity, Key> {

    Optional<InOutEntity> findByBuildingIdAndCategory(Integer buildingId, Integer categoryId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
       update InOutEntity io
          set io.frequency = io.frequency + 1,
              io.lastAt    = CURRENT_TIMESTAMP
        where io.buildingId = :buildingId
          and io.categoryId = :categoryId
    """)
    int bumpUsage(@Param("buildingId") Integer buildingId, @Param("categoryId") Integer categoryId);
}
