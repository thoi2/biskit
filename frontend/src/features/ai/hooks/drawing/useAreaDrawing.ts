// src/features/ai/hooks/drawing/useAreaDrawing.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useStoreValidator } from './useStoreValidator';
import { useStoreStore } from "@/features/stores/store/storesStore";

interface PolygonPoint {
    lat: number;
    lng: number;
}

interface AreaInfo {
    area: number;
    storeCount: number;
    isValid: boolean;
    errorMessage?: string;
    stores?: any[];
}

export function useAreaDrawing(areaCategory: string) {
    const { activeTab, map, isDrawingMode, drawingType, setIsDrawingActive } = useMapStore();
    const { validateAndGetStoresInArea } = useStoreValidator();

    const [drawnArea, setDrawnArea] = useState<PolygonPoint[] | null>(null);
    const [drawnOverlay, setDrawnOverlay] = useState<any>(null);
    const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
    const [isClient, setIsClient] = useState(false);

    const drawingManagerRef = useRef<any>(null);
    const eventListenersAttached = useRef(false);
    const allOverlays = useRef<any[]>([]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // ✅ 기존 도형들 모두 삭제
    const clearAllOverlays = useCallback(() => {
        allOverlays.current.forEach(overlay => {
            try {
                overlay.setMap(null);
            } catch (e) {
                console.warn('오버레이 삭제 실패:', e);
            }
        });
        allOverlays.current = [];
        setDrawnArea(null);
        setDrawnOverlay(null);
        setAreaInfo(null);
        console.log('✅ 모든 기존 도형 삭제 완료');
    }, []);

    const hasStoreData = useStoreStore.getState().stores.length > 0;
    const isValidZoom = map && map.getLevel() <= 2;
    const canUseAreaRecommendation = hasStoreData && isValidZoom && activeTab === 'recommend';

    // 🎯 드로잉 매니저 초기화
    useEffect(() => {
        if (!isClient || !map || !canUseAreaRecommendation) return;
        if (typeof window === 'undefined' || !window.kakao?.maps?.drawing?.DrawingManager) return;

        if (drawingManagerRef.current) return;

        console.log('🎯 드로잉 매니저 최초 생성 시작');

        try {
            const options = {
                map: map,
                drawingMode: [
                    window.kakao.maps.drawing.OverlayType.RECTANGLE,
                    window.kakao.maps.drawing.OverlayType.CIRCLE,
                    window.kakao.maps.drawing.OverlayType.POLYGON
                ],
                guideTooltip: ['draw', 'drag', 'edit'],
                rectangleOptions: {
                    draggable: true,
                    removable: true,
                    editable: true,
                    strokeColor: '#39f',
                    fillColor: '#39f',
                    fillOpacity: 0.5
                },
                circleOptions: {
                    draggable: true,
                    removable: true,
                    editable: true,
                    strokeColor: '#39f',
                    fillColor: '#39f',
                    fillOpacity: 0.5
                },
                polygonOptions: {
                    draggable: true,
                    removable: true,
                    editable: true,
                    strokeColor: '#39f',
                    fillColor: '#39f',
                    fillOpacity: 0.5,
                    hintStrokeStyle: 'dash',
                    hintStrokeOpacity: 0.5
                }
            };

            drawingManagerRef.current = new window.kakao.maps.drawing.DrawingManager(options);
            console.log('✅ 드로잉 매니저 생성 완료');

            if (!eventListenersAttached.current) {
                console.log('🎧 이벤트 리스너 등록 시작');

                window.kakao.maps.event.addListener(drawingManagerRef.current, 'drawstart', (mouseEvent: any) => {
                    console.log('🚀 DRAWSTART');
                    setIsDrawingActive(true);
                    clearAllOverlays();
                });

                window.kakao.maps.event.addListener(drawingManagerRef.current, 'drawend', (mouseEvent: any) => {
                    console.log('🎉 DRAWEND - 타입:', mouseEvent.overlayType);
                    setIsDrawingActive(false);

                    setTimeout(() => {
                        const data = mouseEvent.target || mouseEvent.overlay;
                        let polygon: PolygonPoint[] = [];

                        try {
                            allOverlays.current.push(data);
                            console.log('🔍 도형 처리 시작:', mouseEvent.overlayType);

                            // ✅ 도형별로 다른 방법 사용
                            if (mouseEvent.overlayType === 'rectangle' || mouseEvent.overlayType === 'circle') {
                                console.log('📐 사각형/원형: getBounds() 사용');

                                if (typeof data.getBounds === 'function') {
                                    const bounds = data.getBounds();
                                    const sw = bounds.getSouthWest();
                                    const ne = bounds.getNorthEast();

                                    polygon = [
                                        { lat: sw.getLat(), lng: sw.getLng() },
                                        { lat: sw.getLat(), lng: ne.getLng() },
                                        { lat: ne.getLat(), lng: ne.getLng() },
                                        { lat: ne.getLat(), lng: sw.getLng() }
                                    ];

                                    console.log('✅ getBounds() 성공:', {
                                        type: mouseEvent.overlayType,
                                        sw: `(${sw.getLat().toFixed(6)}, ${sw.getLng().toFixed(6)})`,
                                        ne: `(${ne.getLat().toFixed(6)}, ${ne.getLng().toFixed(6)})`
                                    });
                                } else {
                                    throw new Error('getBounds 메서드를 찾을 수 없습니다');
                                }
                            }
                            else if (mouseEvent.overlayType === 'polygon') {
                                console.log('🔺 다각형: 실제 그린 좌표 추출');

                                let polygonPath = [];

                                if (drawingManagerRef.current) {
                                    console.log('🔄 [POLYGON] Drawing Manager getData() 사용');

                                    try {
                                        const drawnData = drawingManagerRef.current.getData();
                                        console.log('📊 [POLYGON] Drawing Manager 전체 데이터:', drawnData);

                                        if (drawnData && drawnData[window.kakao.maps.drawing.OverlayType.POLYGON]) {
                                            const polygonData = drawnData[window.kakao.maps.drawing.OverlayType.POLYGON];
                                            console.log('📊 [POLYGON] 다각형 데이터:', polygonData);

                                            if (Array.isArray(polygonData) && polygonData.length > 0) {
                                                const latestPolygon = polygonData[polygonData.length - 1];
                                                console.log('📊 [POLYGON] 최신 다각형:', latestPolygon);

                                                if (latestPolygon && latestPolygon.points && Array.isArray(latestPolygon.points)) {
                                                    polygonPath = latestPolygon.points.map((point: any, index: number) => {
                                                        console.log(`📍 [DRAWING] Point ${index}:`, point);

                                                        if (point && typeof point === 'object') {
                                                            const lat = typeof point.y === 'number' ? point.y : point.lat;
                                                            const lng = typeof point.x === 'number' ? point.x : point.lng;

                                                            if (typeof lat === 'number' && typeof lng === 'number') {
                                                                return { lat, lng };
                                                            }
                                                        }
                                                        return null;
                                                    }).filter(Boolean);

                                                    console.log('✅ [POLYGON] Drawing Manager 데이터 성공:', polygonPath.length, '개 점');
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        console.error('❌ [POLYGON] Drawing Manager 데이터 추출 실패:', error);
                                    }
                                }

                                if (polygonPath.length >= 3) {
                                    polygon = polygonPath;
                                    console.log('✅ [POLYGON] 실제 다각형 좌표 사용:', polygon.length, '개 점');
                                } else {
                                    throw new Error(`다각형 좌표 추출 실패: ${polygonPath.length}개 점`);
                                }
                            }

                            // ✅ 폴리곤 검증 및 처리 (백엔드 호출 없음)
                            if (polygon.length >= 3) {
                                console.log('🔍 폴리곤 검증 시작:', polygon.length, '개 점');

                                const validation = validateAndGetStoresInArea(polygon, areaCategory);
                                console.log('🔍 검증 결과:', validation);

                                if (validation.shouldDelete) {
                                    data.setMap(null);
                                    allOverlays.current = allOverlays.current.filter(o => o !== data);
                                    alert(validation.errorMessage);
                                    return;
                                }

                                setAreaInfo({
                                    area: validation.area,
                                    storeCount: validation.storeCount,
                                    isValid: validation.isValid,
                                    errorMessage: validation.errorMessage,
                                    stores: validation.stores  // ✅ 상가 데이터 저장
                                });
                                setDrawnArea(polygon);
                                setDrawnOverlay(data);

                                console.log('✅ 영역 그리기 완료!', {
                                    area: validation.area,
                                    storeCount: validation.storeCount,
                                    isValid: validation.isValid
                                });

                                if (!validation.isValid) {
                                    alert(`⚠️ 영역 선택 오류\n\n${validation.errorMessage}`);
                                } else {
                                    console.log('ℹ️ 범위 분석 버튼을 눌러서 분석을 시작하세요.');
                                }
                            } else {
                                throw new Error(`폴리곤 생성 실패: 점의 개수가 부족함 (${polygon.length}개)`);
                            }

                        } catch (error: unknown) {
                            console.error('❌ 드로잉 처리 오류:', error);

                            try {
                                data.setMap(null);
                                allOverlays.current = allOverlays.current.filter(o => o !== data);
                            } catch (e) {
                                console.warn('오류 오버레이 제거 실패:', e);
                            }

                            if (error instanceof Error) {
                                console.error('❌ 에러 내용:', error.message);
                                alert(`드로잉 처리 실패: ${error.message}`);
                            } else {
                                alert('드로잉 처리 중 알 수 없는 오류가 발생했습니다.');
                            }
                        }
                    }, 100);
                });

                // ✅ 지도 클릭 이벤트
                window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
                    const currentState = useMapStore.getState();
                    const { activeTab, isDrawingMode, isDrawingActive } = currentState;

                    if (isDrawingActive) {
                        console.log('🚫 드로잉 진행 중 - 클릭 차단');
                        return;
                    }

                    const latlng = mouseEvent.latLng;
                    const lat = latlng.getLat();
                    const lng = latlng.getLng();

                    if (activeTab === 'recommend') {
                        try {
                            useMapStore.getState().setCoordinates({ lat, lng });

                            const currentPin = useMapStore.getState().recommendPin;
                            if (currentPin) {
                                currentPin.setMap(null);
                            }

                            const position = new window.kakao.maps.LatLng(lat, lng);
                            const pinSvg = `
              <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0C8.954 0 0 8.954 0 20c0 11.045 20 30 20 30s20-18.955 20-30C40 8.954 31.046 0 20 0z" 
                      fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
                <circle cx="20" cy="20" r="4" fill="#1E40AF"/>
              </svg>
            `;

                            const marker = new window.kakao.maps.Marker({
                                position: position,
                                map: map,
                                image: new window.kakao.maps.MarkerImage(
                                    'data:image/svg+xml;base64,' + btoa(pinSvg),
                                    new window.kakao.maps.Size(40, 50),
                                    { offset: new window.kakao.maps.Point(20, 50) }
                                ),
                                zIndex: 400
                            });

                            useMapStore.getState().setRecommendPin(marker);
                            console.log('✅ 추천 핀 생성 완료');

                        } catch (error) {
                            console.error('❌ 추천 핀 생성 실패:', error);
                        }
                    }
                });

                window.kakao.maps.event.addListener(drawingManagerRef.current, 'remove', () => {
                    console.log('🗑️ 도형 삭제됨');
                    setIsDrawingActive(false);
                    setDrawnArea(null);
                    setDrawnOverlay(null);
                    setAreaInfo(null);
                });

                eventListenersAttached.current = true;
                console.log('✅ 이벤트 리스너 등록 완료');
            }

        } catch (error: any) {
            console.error('❌ 드로잉 매니저 생성 실패:', error);
        }

        return () => {
            if (drawingManagerRef.current) {
                try {
                    clearAllOverlays();
                    drawingManagerRef.current.cancel();
                    drawingManagerRef.current = null;
                    eventListenersAttached.current = false;
                    setIsDrawingActive(false);
                    console.log('🧹 드로잉 매니저 정리 완료');
                } catch (e) {
                    console.warn('드로잉 매니저 정리 실패:', e);
                }
            }
        };
    }, [isClient, map, canUseAreaRecommendation, areaCategory, validateAndGetStoresInArea, setIsDrawingActive, clearAllOverlays]);

    // 드로잉 모드 제어
    useEffect(() => {
        if (!drawingManagerRef.current) return;

        if (isDrawingMode) {
            console.log('🎯 드로잉 모드 활성화:', drawingType);
            document.body.classList.add('drawing-mode');

            drawingManagerRef.current.cancel();

            let overlayType;
            if (drawingType === 'rectangle') {
                overlayType = window.kakao.maps.drawing.OverlayType.RECTANGLE;
            } else if (drawingType === 'circle') {
                overlayType = window.kakao.maps.drawing.OverlayType.CIRCLE;
            } else {
                overlayType = window.kakao.maps.drawing.OverlayType.POLYGON;
            }

            drawingManagerRef.current.select(overlayType);

            const mapContainer = map?.getNode();
            if (mapContainer) {
                mapContainer.style.cursor = 'crosshair';
            }

            console.log('✅ 드로잉 준비 완료!');

        } else {
            console.log('🛑 드로잉 모드 비활성화');
            document.body.classList.remove('drawing-mode');

            setIsDrawingActive(false);

            if (drawingManagerRef.current) {
                drawingManagerRef.current.cancel();
            }

            const mapContainer = map?.getNode();
            if (mapContainer) {
                mapContainer.style.cursor = 'grab';
            }
        }
    }, [isDrawingMode, drawingType, map, setIsDrawingActive]);

    const clearDrawnArea = useCallback(() => {
        clearAllOverlays();
    }, [clearAllOverlays]);

    return {
        drawnArea,
        drawnOverlay,
        areaInfo,
        clearDrawnArea,
        canUseAreaRecommendation,
        hasStoreData,
        isValidZoom
    };
}
