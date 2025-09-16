package com.example.backend.recommend.service;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * 정책:
 *  - 좌표 -> ADR(도로명주소관리번호) : 외부 지오코더 호출(역지오코딩)
 *  - ADR -> building_id : DB에서 조회 또는 없으면 업서트
 *  - 병합 없음, ADR 하나 = 우리 시스템의 한 건물
 */
@Service
@RequiredArgsConstructor
public class DefaultBuildingLocator implements BuildingLocator {

    private final GeoRepository geoRepository;       // ADR 기준 upsert/get
    private final ExternalGeocoder externalGeocoder; // 역지오코더 포트

    @Override
    @Transactional // DB insert/update 가능성 있음
    public Optional<ResolvedBuilding> resolve(@NonNull BigDecimal lat, @NonNull BigDecimal lng) {
        // 1) 좌표 -> ADR
        final String adr;
        try {
            adr = externalGeocoder.reverseToAdr(lat, lng).orElse(null);
        } catch (ExternalGeocoder.CommunicationException ce) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        }
        if (adr == null) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(),
                    RecommendErrorCode.GEO_NOT_FOUND.getMessage()
            );
        }

        // 2) ADR 기준으로 building 조회/생성 후 id 반환
        int buildingId = geoRepository.upsertAndGetIdByAdr(adr, lat, lng);

        // 3) 최종 반환 (좌표는 입력값 사용; 정규화는 GeoRepository에서 수행)
        return Optional.of(new ResolvedBuilding(buildingId, lat, lng));
    }
}
