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

                // ✅ 도형별 분기 처리
                window.kakao.maps.event.addListener(drawingManagerRef.current, 'drawend', (mouseEvent: any) => {
                    console.log('🎉 DRAWEND - 타입:', mouseEvent.overlayType);
                    setIsDrawingActive(false);

                    setTimeout(() => {
                        const data = mouseEvent.target;
                        let polygon: PolygonPoint[] = [];

                        try {
                            allOverlays.current.push(data);
                            console.log('🔍 도형 처리 시작:', mouseEvent.overlayType);

                            // ✅ 도형별로 다른 방법 사용
                            if (mouseEvent.overlayType === 'rectangle' || mouseEvent.overlayType === 'circle') {
                                // 사각형과 원형: getBounds() 사용
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
                                // 다각형: 지도 현재 중심으로 사각형 생성
                                console.log('🔺 다각형: 지도 중심 기준 사각형 생성');

                                if (map) {
                                    const center = map.getCenter();
                                    const bounds = map.getBounds();

                                    // 현재 지도 영역의 1/6 크기 사각형 생성
                                    const sw = bounds.getSouthWest();
                                    const ne = bounds.getNorthEast();
                                    const centerLat = center.getLat();
                                    const centerLng = center.getLng();
                                    const latRange = (ne.getLat() - sw.getLat()) / 6;
                                    const lngRange = (ne.getLng() - sw.getLng()) / 6;

                                    polygon = [
                                        { lat: centerLat - latRange, lng: centerLng - lngRange },
                                        { lat: centerLat - latRange, lng: centerLng + lngRange },
                                        { lat: centerLat + latRange, lng: centerLng + lngRange },
                                        { lat: centerLat + latRange, lng: centerLng - lngRange }
                                    ];

                                    console.log('✅ 다각형 → 지도 중심 사각형 생성:', {
                                        center: `(${centerLat.toFixed(6)}, ${centerLng.toFixed(6)})`,
                                        size: `±${latRange.toFixed(6)}, ±${lngRange.toFixed(6)}`,
                                        polygon: polygon.map(p => `(${p.lat.toFixed(6)}, ${p.lng.toFixed(6)})`)
                                    });
                                } else {
                                    throw new Error('지도 객체를 찾을 수 없습니다');
                                }
                            } else {
                                throw new Error(`지원하지 않는 도형 타입: ${mouseEvent.overlayType}`);
                            }

                            // ✅ 폴리곤 검증 및 처리
                            if (polygon.length === 4) {
                                console.log('🔍 폴리곤 검증 시작:', polygon.map(p => `(${p.lat.toFixed(6)}, ${p.lng.toFixed(6)})`));

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
                                    errorMessage: validation.errorMessage
                                });
                                setDrawnArea(polygon);
                                setDrawnOverlay(data);

                                console.log('✅ 최종 처리 완료!', {
                                    area: validation.area,
                                    storeCount: validation.storeCount,
                                    isValid: validation.isValid
                                });

                                if (!validation.isValid) {
                                    alert(`⚠️ 영역 선택 오류\n\n${validation.errorMessage}`);
                                }
                            } else {
                                throw new Error(`폴리곤 생성 실패: 점의 개수가 4개가 아님 (${polygon.length}개)`);
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
                // ✅ 지도 클릭 이벤트 통합 처리 추가
                window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
                    console.log('🔥🔥🔥 통합 지도 클릭 처리! 🔥🔥🔥');

                    const currentState = useMapStore.getState();
                    const { activeTab, isDrawingMode, isDrawingActive } = currentState;

                    console.log('🗺️ 통합 클릭 상태:', { activeTab, isDrawingMode, isDrawingActive });

                    // ✅ 드로잉 진행 중이면 차단
                    if (isDrawingActive) {
                        console.log('🚫 드로잉 진행 중 - 통합 클릭 차단');
                        return;
                    }

                    // ✅ 드로잉 모드이지만 실제 드로잉 안 시작했으면 추천 핀 생성 허용
                    const latlng = mouseEvent.latLng;
                    const lat = latlng.getLat();
                    const lng = latlng.getLng();

                    console.log('📍 통합 클릭 좌표:', { lat, lng });

                    // ✅ 추천 탭에서는 항상 핀 생성
                    if (activeTab === 'recommend') {
                        console.log('📍 통합 처리 - 추천 핀 생성 시작');

                        try {
                            // setCoordinates와 createRecommendPin을 여기서 직접 호출
                            useMapStore.getState().setCoordinates({ lat, lng });

                            // 기존 추천 핀 제거
                            const currentPin = useMapStore.getState().recommendPin;
                            if (currentPin) {
                                currentPin.setMap(null);
                            }

                            // 새 추천 핀 생성
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
                            console.log('✅ 통합 처리 - 추천 핀 생성 완료');

                        } catch (error) {
                            console.error('❌ 통합 처리 - 추천 핀 생성 실패:', error);
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
        clearDrawnArea
    };
}
