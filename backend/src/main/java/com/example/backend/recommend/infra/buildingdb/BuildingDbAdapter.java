package com.example.backend.recommend.infra.buildingdb;

import com.example.backend.recommend.repository.BuildingRepository;
import com.example.backend.recommend.repository.entity.BuildingEntity;
import com.example.backend.recommend.service.GeoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Repository
@RequiredArgsConstructor
public class BuildingDbAdapter implements GeoRepository {

    private final BuildingRepository buildingRepository;

    @Override
    @Transactional
    public int upsertAndGetIdByAdr(String adrMngNo, BigDecimal lat, BigDecimal lng) {
        final BigDecimal nlat = normalize(lat);
        final BigDecimal nlng = normalize(lng);

        // 1) ADR로 조회
        return buildingRepository.findByAdrMngNo(adrMngNo)
                .map(e -> {
                    boolean dirty = false;
                    if (e.getLat() == null || e.getLat().compareTo(nlat) != 0) {
                        e.setLat(nlat);
                        dirty = true;
                    }
                    if (e.getLng() == null || e.getLng().compareTo(nlng) != 0) {
                        e.setLng(nlng);
                        dirty = true;
                    }
                    if (dirty) buildingRepository.save(e);
                    return e.getId();
                })
                .orElseGet(() -> {
                    // 2) 없으면 insert
                    BuildingEntity ne = new BuildingEntity();
                    ne.setAdrMngNo(adrMngNo); // CHAR(26) UNIQUE
                    ne.setLat(nlat);
                    ne.setLng(nlng);
                    try {
                        BuildingEntity saved = buildingRepository.save(ne);
                        return saved.getId();
                    } catch (DataIntegrityViolationException race) {
                        // ADR UNIQUE 레이스 → 재조회로 멱등 보장
                        return buildingRepository.findByAdrMngNo(adrMngNo)
                                .map(BuildingEntity::getId)
                                .orElseThrow(() -> race);
                    }
                });
    }

    private BigDecimal normalize(BigDecimal v) {
        return v == null ? null : v.setScale(12, RoundingMode.HALF_UP);
    }
}
