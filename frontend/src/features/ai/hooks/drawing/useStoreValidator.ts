// src/features/map/hooks/useStoreValidator.ts
import { useCallback } from 'react';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useAreaCalculator } from './useAreaCalculator';

const AREA_LIMITS = {
    MAX_AREA: 5000000, // 5km²
    MAX_STORES: 1000, // ✅ 더 많이 허용 (어차피 서버에서 topk로 처리)
    MIN_STORES: 1,
};

interface PolygonPoint {
    lat: number;
    lng: number;
}

export function useStoreValidator() {
    const { stores } = useStoreStore();
    const { calculatePolygonArea } = useAreaCalculator();

    // ✅ Point-in-Polygon 알고리즘
    const isPointInPolygon = useCallback((point: { lat: number; lng: number }, polygon: PolygonPoint[]): boolean => {
        const x = point.lng;
        const y = point.lat;

        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lng;
            const yi = polygon[i].lat;
            const xj = polygon[j].lng;
            const yj = polygon[j].lat;

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }, []);

    // ✅ 경계 박스 계산
    const getBoundingBox = useCallback((polygon: PolygonPoint[]) => {
        let minLat = polygon[0].lat;
        let maxLat = polygon[0].lat;
        let minLng = polygon[0].lng;
        let maxLng = polygon[0].lng;

        for (const point of polygon) {
            minLat = Math.min(minLat, point.lat);
            maxLat = Math.max(maxLat, point.lat);
            minLng = Math.min(minLng, point.lng);
            maxLng = Math.max(maxLng, point.lng);
        }

        return { minLat, maxLat, minLng, maxLng };
    }, []);

    const validateAndGetStoresInArea = useCallback((polygon: PolygonPoint[], category: string) => {
        console.log('🔍 영역 내 상가 찾기 시작:', {
            totalStores: stores.length,
            polygonPoints: polygon.length
        });

        // ✅ 면적 계산
        const areaSize = calculatePolygonArea(polygon);
        console.log('📐 영역 면적:', (areaSize / 10000).toFixed(2), 'ha');

        // ✅ 경계 박스 계산
        const boundingBox = getBoundingBox(polygon);

        // ✅ 1단계: 유효한 좌표만 필터링
        const validStores = stores.filter(store => {
            return store.lat && store.lng &&
                typeof store.lat === 'number' &&
                typeof store.lng === 'number' &&
                !isNaN(store.lat) && !isNaN(store.lng);
        });

        console.log('📍 유효한 좌표:', validStores.length, '개');

        // ✅ 2단계: 경계 박스 사전 필터링
        const boundingBoxFiltered = validStores.filter(store => {
            return store.lat >= boundingBox.minLat && store.lat <= boundingBox.maxLat &&
                store.lng >= boundingBox.minLng && store.lng <= boundingBox.maxLng;
        });

        console.log('📦 경계 박스 내:', boundingBoxFiltered.length, '개');

        // ✅ 3단계: 정확한 영역 내 필터링
        const storesInArea = boundingBoxFiltered.filter(store => {
            return isPointInPolygon({ lat: store.lat, lng: store.lng }, polygon);
        });

        console.log('🎯 영역 내 상가:', storesInArea.length, '개');

        // ✅ 4단계: 중복 제거 (좌표 기준)
        const uniqueStores = storesInArea.reduce((acc, store) => {
            const key = `${store.lat.toFixed(6)}_${store.lng.toFixed(6)}`;
            const exists = acc.find(s => `${s.lat.toFixed(6)}_${s.lng.toFixed(6)}` === key);

            if (!exists) {
                acc.push(store);
            }

            return acc;
        }, [] as typeof stores);

        console.log('🔄 중복 제거 후:', uniqueStores.length, '개');

        // ✅ 샘플 출력 (처음 5개)
        if (uniqueStores.length > 0) {
            console.log('🏪 영역 내 상가 샘플:');
            for (let i = 0; i < Math.min(5, uniqueStores.length); i++) {
                const store = uniqueStores[i];
                console.log(`${i + 1}. ${store.displayName} (${store.lat.toFixed(6)}, ${store.lng.toFixed(6)})`);
            }
        }

        // ✅ 5단계: 간단한 유효성 검증 (면적과 상가 수만)
        let isValid = true;
        let errorMessage = '';
        let shouldDelete = false;

        if (areaSize > AREA_LIMITS.MAX_AREA) {
            isValid = false;
            shouldDelete = true;
            errorMessage = `영역이 너무 큽니다. 현재: ${(areaSize / 1000000).toFixed(2)}km²`;
        } else if (uniqueStores.length < AREA_LIMITS.MIN_STORES) {
            isValid = false;
            errorMessage = `영역 내 상가가 ${uniqueStores.length}개로 부족합니다.`;
        } else if (uniqueStores.length > AREA_LIMITS.MAX_STORES) {
            isValid = false;
            errorMessage = `영역 내 상가가 너무 많습니다 (${uniqueStores.length}개). 영역을 줄여주세요.`;
        }

        const result = {
            stores: uniqueStores, // ✅ 모든 상가 반환 (제한 없음)
            area: areaSize,
            storeCount: uniqueStores.length,
            isValid,
            errorMessage,
            shouldDelete
        };

        console.log('✅ 최종 결과:', {
            영역면적: `${(areaSize / 10000).toFixed(2)}ha`,
            상가수: result.storeCount,
            유효여부: result.isValid
        });

        return result;
    }, [stores, calculatePolygonArea, isPointInPolygon, getBoundingBox]);

    return { validateAndGetStoresInArea };
}
