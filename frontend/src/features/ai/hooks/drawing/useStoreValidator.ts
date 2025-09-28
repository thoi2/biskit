// src/features/map/hooks/useStoreValidator.ts
import { useCallback } from 'react';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useAreaCalculator } from './useAreaCalculator';

const AREA_LIMITS = {
    MAX_AREA: 5000000, // 5km²
    MAX_STORES: 1000,
    MIN_STORES: 1,
};

interface PolygonPoint {
    lat: number;
    lng: number;
}

export function useStoreValidator() {
    const { stores } = useStoreStore();
    const { calculatePolygonArea } = useAreaCalculator();

    // ✅ 블로그 예제와 동일한 Point-in-Polygon 알고리즘
    // ✅ 완전 수정된 Point-in-Polygon 알고리즘
    const isPointInPolygon = useCallback((point: { lat: number; lng: number }, polygon: PolygonPoint[]): boolean => {
        if (polygon.length < 3) return false;

        // ✅ 올바른 좌표 형식으로 변환
        const testPoint = [point.lat, point.lng]; // [위도, 경도]
        const polygonArray = polygon.map(p => [p.lat, p.lng]); // [[위도, 경도], ...]

        // ✅ 올바른 좌표 순서 사용
        const x = testPoint[1]; // 경도 (longitude)
        const y = testPoint[0]; // 위도 (latitude)
        let inside = false;

        for (let i = 0, j = polygonArray.length - 1; i < polygonArray.length; j = i++) {
            const xi = polygonArray[i][1]; // i번째 점의 경도
            const yi = polygonArray[i][0]; // i번째 점의 위도
            const xj = polygonArray[j][1]; // j번째 점의 경도
            const yj = polygonArray[j][0]; // j번째 점의 위도

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }, []);

    // ✅ Drawing Library 데이터 처리
    const processDrawingLibraryData = useCallback((drawnArea: any[]): PolygonPoint[] => {
        console.log('🎨 [DRAWING] Drawing Library 데이터 처리:', drawnArea);

        if (drawnArea.length === 0) return [];

        // Drawing Library에서 온 데이터인 경우 (x, y 형태)
        if (drawnArea[0].hasOwnProperty('x') && drawnArea[0].hasOwnProperty('y')) {
            console.log('🎨 [DRAWING] Drawing Library 형식 감지 (x,y → lng,lat)');
            return drawnArea.map(point => ({
                lat: point.y,  // y가 위도
                lng: point.x   // x가 경도
            }));
        }

        // 일반 lat/lng 형태인 경우
        if (drawnArea[0].hasOwnProperty('lat') && drawnArea[0].hasOwnProperty('lng')) {
            console.log('🎨 [DRAWING] 일반 lat/lng 형식 감지');
            return drawnArea;
        }

        console.warn('❌ [DRAWING] 인식할 수 없는 좌표 형식:', drawnArea[0]);
        return [];
    }, []);

    // ✅ 블로그 예제 방식으로 테스트
    const testPolygonAlgorithm = useCallback((polygon: PolygonPoint[]) => {
        console.log('🧪 [TEST] 블로그 예제 방식으로 알고리즘 테스트');

        // 블로그 예제 좌표 (제주도)
        const blogTestPolygon = [
            { lat: 33.45133510810506, lng: 126.57159381623066 },
            { lat: 33.44955812811862, lng: 126.5713551811832 },
            { lat: 33.449986291544086, lng: 126.57263296172184 },
            { lat: 33.450682513554554, lng: 126.57321034054742 },
            { lat: 33.451346760004206, lng: 126.57235740081413 }
        ];

        // 블로그의 테스트 포인트
        const outsidePoint = { lat: 33.450701, lng: 126.570667 }; // 외부 (false 예상)
        const insidePoint = { lat: 33.45094828044813, lng: 126.57184309400824 }; // 내부 (true 예상)

        const outsideResult = isPointInPolygon(outsidePoint, blogTestPolygon);
        const insideResult = isPointInPolygon(insidePoint, blogTestPolygon);

        console.log('🧪 [TEST] 블로그 예제 검증:');
        console.log(`외부 점 (${outsidePoint.lat}, ${outsidePoint.lng}) → ${outsideResult} (false 예상)`);
        console.log(`내부 점 (${insidePoint.lat}, ${insidePoint.lng}) → ${insideResult} (true 예상)`);

        if (outsideResult === false && insideResult === true) {
            console.log('✅ [TEST] 알고리즘이 올바르게 작동합니다!');
        } else {
            console.error('❌ [TEST] 알고리즘에 문제가 있습니다!');
        }
    }, [isPointInPolygon]);

    const validateAndGetStoresInArea = useCallback((drawnArea: any[], category: string) => {
        console.log('🔍 [VALIDATOR] 블로그 방식 Point-in-Polygon 시작:', {
            totalStores: stores.length,
            drawnAreaLength: drawnArea.length
        });

        // ✅ 1단계: Drawing Library 데이터 변환
        const polygon = processDrawingLibraryData(drawnArea);

        if (polygon.length === 0) {
            return {
                stores: [],
                area: 0,
                storeCount: 0,
                isValid: false,
                errorMessage: '유효하지 않은 좌표 데이터입니다.',
                shouldDelete: true
            };
        }

        // ✅ 알고리즘 테스트 (첫 실행 시만)
        if (polygon.length > 0) {
            testPolygonAlgorithm(polygon);
        }

        console.log('📐 [POLYGON] 다각형 좌표:', polygon.map(p => `(${p.lat.toFixed(6)}, ${p.lng.toFixed(6)})`).join(', '));

        // ✅ 2단계: 면적 계산
        const areaSize = calculatePolygonArea(polygon);
        console.log('📐 [AREA] 영역 면적:', (areaSize / 10000).toFixed(2), 'ha');

        // ✅ 3단계: 경계 박스 계산
        let minLat = polygon[0].lat, maxLat = polygon[0].lat;
        let minLng = polygon[0].lng, maxLng = polygon[0].lng;

        polygon.forEach(point => {
            minLat = Math.min(minLat, point.lat);
            maxLat = Math.max(maxLat, point.lat);
            minLng = Math.min(minLng, point.lng);
            maxLng = Math.max(maxLng, point.lng);
        });

        console.log('📦 [BBOX] 경계 박스:', {
            위도: `${minLat.toFixed(6)} ~ ${maxLat.toFixed(6)}`,
            경도: `${minLng.toFixed(6)} ~ ${maxLng.toFixed(6)}`
        });

        // ✅ 4단계: 상가 필터링 (블로그 방식)
        const validStores = stores.filter(store => {
            return store.lat && store.lng &&
                typeof store.lat === 'number' &&
                typeof store.lng === 'number' &&
                !isNaN(store.lat) && !isNaN(store.lng) &&
                store.lat >= -90 && store.lat <= 90 &&
                store.lng >= -180 && store.lng <= 180;
        });

        console.log('📍 [STEP1] 유효한 좌표 상가:', validStores.length, '개');

        const boundingBoxFiltered = validStores.filter(store => {
            return store.lat >= minLat && store.lat <= maxLat &&
                store.lng >= minLng && store.lng <= maxLng;
        });

        console.log('📦 [STEP2] 경계 박스 내 상가:', boundingBoxFiltered.length, '개');

        // ✅ 5단계: 블로그 방식 Point-in-Polygon 검사
        console.log('🎯 [STEP3] 블로그 방식 Point-in-Polygon 검사 시작...');

        const storesInArea = [];
        for (let i = 0; i < boundingBoxFiltered.length; i++) {
            const store = boundingBoxFiltered[i];

            const isInside = isPointInPolygon({ lat: store.lat, lng: store.lng }, polygon);

            if (isInside) {
                storesInArea.push(store);
            }

            // 처음 10개는 상세 로그
            if (i < 10) {
                console.log(`${i + 1}. ${store.displayName} (${store.lat.toFixed(6)}, ${store.lng.toFixed(6)}) → ${isInside ? '✅내부' : '❌외부'}`);
            }
        }

        console.log('🎯 [STEP3] 블로그 방식 결과:', {
            내부상가: storesInArea.length,
            총검사: boundingBoxFiltered.length
        });

        // ✅ 6단계: 중복 제거
        const uniqueStores = storesInArea.reduce((acc, store) => {
            const key = `${store.lat.toFixed(6)}_${store.lng.toFixed(6)}`;
            const exists = acc.find(s => `${s.lat.toFixed(6)}_${s.lng.toFixed(6)}` === key);
            if (!exists) {
                acc.push(store);
            }
            return acc;
        }, [] as typeof stores);

        console.log('🔄 [STEP4] 중복 제거 후:', uniqueStores.length, '개');

        // ✅ 7단계: 샘플 출력
        if (uniqueStores.length > 0) {
            console.log('🏪 [SAMPLE] 영역 내 상가 목록 (처음 5개):');
            uniqueStores.slice(0, 5).forEach((store, i) => {
                console.log(`${i + 1}. ${store.displayName} (${store.lat.toFixed(6)}, ${store.lng.toFixed(6)})`);
            });
        } else {
            console.warn('⚠️ [WARNING] 블로그 방식으로도 상가가 0개입니다!');
            console.log('🔍 [DEBUG] 알고리즘 재검토 필요');
        }

        // ✅ 8단계: 유효성 검증
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
            errorMessage = `영역 내 상가가 너무 많습니다 (${uniqueStores.length}개).`;
        }

        const result = {
            stores: uniqueStores,
            area: areaSize,
            storeCount: uniqueStores.length,
            isValid,
            errorMessage,
            shouldDelete
        };

        console.log('✅ [RESULT] 블로그 방식 최종 결과:', {
            영역면적: `${(areaSize / 10000).toFixed(2)}ha`,
            상가수: result.storeCount,
            유효여부: result.isValid
        });

        return result;
    }, [stores, calculatePolygonArea, processDrawingLibraryData, isPointInPolygon, testPolygonAlgorithm]);

    return { validateAndGetStoresInArea };
}
