package com.example.backend.recommend.service;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.example.backend.recommend.infra.geocoder.GeocoderPort;
import com.example.backend.recommend.port.BuildingPort;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
@Service
@RequiredArgsConstructor
public class GeoBuildingService {

    private final BuildingPort buildingPort;       // ADR 기준 upsert/get
    private final GeocoderPort geocoderPort;       // 역지오코더 포트
    private final TransactionTemplate transactionTemplate; // DB 블록만 트랜잭션

    public ResolvedBuilding resolve(@NonNull BigDecimal lat, @NonNull BigDecimal lng) {
        // 1) 트랜잭션 밖에서 역지오코딩
        final String adr;
        final String address;
        final boolean useAdr;
        try {
            GeocoderPort.ReverseResult result = geocoderPort.reverseToAdr(lat, lng);
            adr = result.adr();
            address = result.address();
            useAdr = result.useAdr();
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            // 예기치 못한 예외 → BAD_GATEWAY로 정규화
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        }

        // 2) DB에 이미 있으면: DB의 id/좌표 그대로 반환
        if (useAdr && adr != null && !adr.isBlank()) {
            var existing = buildingPort.findByAdr(adr);
            if (existing != null) {
                return new ResolvedBuilding(existing.id(), existing.lat(), existing.lng());
            }
        }

        // 3) 없으면: address로 지오코딩해서 표준 좌표 확보
        if (address == null || address.isBlank()) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(),
                    RecommendErrorCode.GEO_NOT_FOUND.getMessage()
            );
        }

        final GeocoderPort.GeoPoint stdPoint;
        try {
            stdPoint = geocoderPort.getPointByAdr(address); // address → (lat,lng)
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        }

        final String keyForDb = useAdr ? adr : stdPoint.bldMgtNo();
        if (keyForDb == null || keyForDb.isBlank()) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(),
                    RecommendErrorCode.GEO_NOT_FOUND.getMessage()
            );
        }

        // 4) 트랜잭션: 표준 좌표로 INSERT
        int buildingId = transactionTemplate.execute(status -> {
            try {
                return buildingPort.insert(keyForDb, stdPoint.lat(), stdPoint.lng());
            } catch (org.springframework.dao.DataIntegrityViolationException dup) {
                var existing = buildingPort.findByAdr(keyForDb); // adr인지 bld인지는 포트 내부에서 처리
                if (existing != null) {
                    return existing.id();
                }
                throw dup;
            }
        });
        // 5) 신규 레코드의 표준 좌표 반환
        return new ResolvedBuilding(buildingId, stdPoint.lat(), stdPoint.lng());
    }
    public record ResolvedBuilding(int id, BigDecimal lat, BigDecimal lng) {}
}
