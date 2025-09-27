package com.example.backend.recommend.adapter;

import com.example.backend.recommend.entity.BuildingEntity;
import com.example.backend.recommend.repository.BuildingRepository;
import com.example.backend.recommend.repository.projection.BuildingProjection;
import com.example.backend.recommend.port.BuildingPort;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.math.RoundingMode;

@Repository
@RequiredArgsConstructor
public class BuildingAdapter implements BuildingPort {

    private final BuildingRepository buildingRepository;

    @Override
    public BuildingPoint findByAdr(String adrMngNo) {
        return buildingRepository.findByAdrMngNo(adrMngNo)
                .map(e -> new BuildingPoint(e.getId(), e.getLat(), e.getLng()))
                .orElse(null); // ★ 없으면 null
    }

    @Override
    @Transactional
    public int insert(String adrMngNo, BigDecimal lat, BigDecimal lng) {
        Integer existingId = buildingRepository.findByAdrMngNo(adrMngNo)
                .map(BuildingEntity::getId)
                .orElse(null);
        if (existingId != null) return existingId;
        BuildingEntity ne = new BuildingEntity();
        ne.setAdrMngNo(adrMngNo);
        ne.setLat(normalize(lat));
        ne.setLng(normalize(lng));
        try {
            return buildingRepository.saveAndFlush(ne).getId();
        } catch (DataIntegrityViolationException race) {
            return buildingRepository.findByAdrMngNo(adrMngNo)
                    .map(BuildingEntity::getId)
                    .orElseThrow(() -> race);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BuildingPoint> findByIdsList(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        List<BuildingProjection> rows = buildingRepository.findAllByIdIn(ids);

        Map<Integer, BuildingPoint> byId = rows.stream()
                .collect(Collectors.toMap(
                        BuildingProjection::getId,
                        r -> new BuildingPoint(r.getId(), r.getLat(), r.getLng())
                ));

        return ids.stream()
                .map(id -> byId.getOrDefault(id, new BuildingPoint(id, null, null)))
                .toList();
    }
    private BigDecimal normalize(BigDecimal v) {
        return v == null ? null : v.setScale(12, RoundingMode.HALF_UP);
    }
}
