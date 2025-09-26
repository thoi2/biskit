// src/features/map/hooks/useAreaDrawing.ts
import { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useDrawingEventHandler } from './useDrawingEventHandler';

interface PolygonPoint {
    lat: number;
    lng: number;
}

interface AreaInfo {
    area: number;
    storeCount: number;
    isValid: boolean;
    errorMessage?: string;
}

const AREA_LIMITS = {
    MAX_AREA: 5000000,
    MAX_STORES: 200,
    MIN_STORES: 1,
};

export function useAreaDrawing(areaCategory: string) {
    const { activeTab, map, isDrawingMode, drawingType, setIsDrawingMode } = useMapStore();
    const { stores } = useStoreStore();

    const [drawnArea, setDrawnArea] = useState<PolygonPoint[] | null>(null);
    const [drawnOverlay, setDrawnOverlay] = useState<any>(null);
    const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);

    // 🎯 면적 계산 (간단한 버전)
    const calculatePolygonArea = useCallback((polygon: PolygonPoint[]): number => {
        if (polygon.length < 3) return 0;

        let area = 0;
        const n = polygon.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += polygon[i].lng * polygon[j].lat;
            area -= polygon[j].lng * polygon[i].lat;
        }

        return Math.abs(area) / 2;
    }, []);

    // 🎯 상가 검증 (간단한 버전)
    const storeValidator = {
        validateAndGetStoresInArea: useCallback((polygon: PolygonPoint[], category: string) => {
            const areaSize = calculatePolygonArea(polygon);

            const filteredStores = stores.filter(store => {
                if (category) {
                    const storeCategoryName = store.categoryName || store.bizCategoryCode || '';
                    if (!storeCategoryName.includes(category)) return false;
                }
                return store.lat && store.lng;
            });

            let isValid = true;
            let errorMessage = '';
            let shouldDelete = false;

            if (areaSize > AREA_LIMITS.MAX_AREA) {
                isValid = false;
                shouldDelete = true;
                errorMessage = `영역이 너무 큽니다. 최대 ${(AREA_LIMITS.MAX_AREA / 1000000).toFixed(1)}km² 이하여야 합니다.`;
            } else if (filteredStores.length < AREA_LIMITS.MIN_STORES) {
                isValid = false;
                errorMessage = `분석에 필요한 상가가 부족합니다. 최소 ${AREA_LIMITS.MIN_STORES}개 이상의 상가가 필요합니다.`;
            }

            return {
                stores: filteredStores,
                area: areaSize,
                storeCount: filteredStores.length,
                isValid,
                errorMessage,
                shouldDelete
            };
        }, [stores, calculatePolygonArea])
    };

    // 🎯 드로잉 이벤트 핸들러
    const drawingEventHandler = useDrawingEventHandler({
        drawingType,
        areaCategory,
        storeValidator,
        onDrawComplete: (polygon: PolygonPoint[], data: any, validation: any) => {
            setAreaInfo({
                area: validation.area,
                storeCount: validation.storeCount,
                isValid: validation.isValid,
                errorMessage: validation.errorMessage
            });
            setDrawnArea(polygon);
            setDrawnOverlay(data);
            setIsDrawingMode(false);
        },
        onDrawDelete: () => {
            setDrawnArea(null);
            setDrawnOverlay(null);
            setAreaInfo(null);
        }
    });

    // 조건 체크
    const hasStoreData = stores.length > 0;
    const isValidZoom = map && map.getLevel() <= 2;
    const canUseAreaRecommendation = hasStoreData && isValidZoom && activeTab === 'recommend';

    // 🎯 드로잉 초기화
    useEffect(() => {
        if (isDrawingMode) {
            document.body.classList.add('drawing-mode');
        } else {
            document.body.classList.remove('drawing-mode');
            return;
        }

        if (!canUseAreaRecommendation) return;

        try {
            // 간단한 드로잉 매니저 생성
            const options = {
                map: map,
                drawingMode: [
                    window.kakao.maps.drawing.OverlayType.RECTANGLE,
                    window.kakao.maps.drawing.OverlayType.CIRCLE,
                    window.kakao.maps.drawing.OverlayType.POLYGON
                ],
                rectangleOptions: { strokeColor: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2 },
                circleOptions: { strokeColor: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2 },
                polygonOptions: { strokeColor: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2 }
            };

            const drawingManager = new window.kakao.maps.drawing.DrawingManager(options);

            // 타입에 따른 모드 선택
            const overlayType = drawingType === 'rectangle'
                ? window.kakao.maps.drawing.OverlayType.RECTANGLE
                : drawingType === 'circle'
                    ? window.kakao.maps.drawing.OverlayType.CIRCLE
                    : window.kakao.maps.drawing.OverlayType.POLYGON;

            drawingManager.select(overlayType);

            // 이벤트 등록
            drawingEventHandler.attachEvents(drawingManager);

            // 커서 변경
            if (map) {
                const mapContainer = map.getNode();
                if (mapContainer) mapContainer.style.cursor = 'crosshair';
            }

            return () => {
                document.body.classList.remove('drawing-mode');
                drawingManager.cancel();
                drawingManager.remove();

                if (map) {
                    const mapContainer = map.getNode();
                    if (mapContainer) mapContainer.style.cursor = 'grab';
                }
            };

        } catch (error: any) {
            console.error('드로잉 초기화 실패:', error);
            setIsDrawingMode(false);
            document.body.classList.remove('drawing-mode');
            alert('드로잉 생성 실패: ' + error.message);
        }
    }, [isDrawingMode, drawingType, canUseAreaRecommendation, areaCategory, map, drawingEventHandler]);

    const clearDrawnArea = useCallback(() => {
        if (drawnOverlay) {
            drawnOverlay.setMap(null);
            setDrawnOverlay(null);
        }
        setDrawnArea(null);
        setAreaInfo(null);
    }, [drawnOverlay]);

    return {
        drawnArea,
        drawnOverlay,
        areaInfo,
        clearDrawnArea
    };
}
