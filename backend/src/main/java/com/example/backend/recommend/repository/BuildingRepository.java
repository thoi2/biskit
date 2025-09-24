package com.example.backend.recommend.repository;

import com.example.backend.recommend.entity.BuildingEntity;
import com.example.backend.recommend.repository.projection.BuildingProjection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BuildingRepository extends JpaRepository<BuildingEntity, Integer> {

    Optional<BuildingEntity> findByAdrMngNo(String adrMngNo);
    List<BuildingProjection> findAllByIdIn(Collection<Integer> ids);
}
