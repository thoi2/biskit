package com.example.backend.recommend.repository;

import com.example.backend.recommend.repository.entity.BuildingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BuildingRepository extends JpaRepository<BuildingEntity, Integer> {

    // ADR(26자리)로 건물 조회
    Optional<BuildingEntity> findByAdrMngNo(String adrMngNo);
}
