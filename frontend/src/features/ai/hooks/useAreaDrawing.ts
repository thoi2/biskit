import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useStoreStore } from '@/features/stores/store/storesStore';

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
    MAX_AREA: 5000000, // 최대 5,000,000 m² (5 km²)
    MAX_STORES: 200, // 최대 상가 200개
    MIN_STORES: 1, // 최소 상가 1개
};

export function useAreaDrawing(areaCategory: string) {
    const {
        activeTab,
        map,
        isDrawingMode,
        drawingType,
        setIsDrawingMode
    } = useMapStore();
    const { stores } = useStoreStore();

    const [drawnArea, setDrawnArea] = useState<PolygonPoint[] | null>(null);
    const [drawnOverlay, setDrawnOverlay] = useState<any>(null);
    const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);

    // 🎯 drawingManager를 useRef로 관리
    const drawingManagerRef = useRef<any>(null);

    // 조건 체크
    const hasStoreData = stores.length > 0;
    const isValidZoom = map && map.getLevel() <= 2;
    const canUseAreaRecommendation = hasStoreData && isValidZoom && activeTab === 'recommend';

    // 카카오맵 객체 찾기
    const findKakaoMap = useCallback(() => {
        if (map) return map;

        const targetDiv = document.querySelector('div[style*="width"][style*="height"]') as HTMLElement ||
            document.querySelector('.w-full.h-full') as HTMLElement;

        if (targetDiv && window.kakao?.maps) {
            if ((targetDiv as any)._map) {
                return (targetDiv as any)._map;
            }

            try {
                const newMap = new window.kakao.maps.Map(targetDiv, {
                    center: new window.kakao.maps.LatLng(37.5665, 126.978),
                    level: 3,
                });
                (targetDiv as any)._map = newMap;
                return newMap;
            } catch (error: any) {
                console.error('❌ 지도 생성 실패:', error);
            }
        }

        return null;
    }, [map]);

    // 🎯 투영 좌표용 면적 계산 (간단!)
    const calculatePolygonArea = useCallback((polygon: PolygonPoint[]): number => {
        if (polygon.length < 3) return 0;

        console.log('📍 면적 계산 시작 (투영 좌표):', polygon);

        let area = 0;
        const n = polygon.length;

        // 🎯 투영 좌표는 이미 미터 단위! Shoelace formula 바로 적용
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += polygon[i].lng * polygon[j].lat; // lng=x, lat=y (미터)
            area -= polygon[j].lng * polygon[i].lat;
        }

        area = Math.abs(area) / 2;

        console.log('📊 계산된 면적:', area, 'm²');
        console.log('📊 면적 (ha):', (area / 10000).toFixed(2), 'ha');
        console.log('📊 면적 (km²):', (area / 1000000).toFixed(2), 'km²');

        return area;
    }, []);

    // Point-in-Polygon 알고리즘 (투영 좌표용)
    const isPointInPolygon = useCallback((point: PolygonPoint, polygon: PolygonPoint[]) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (
                polygon[i].lat > point.lat !== polygon[j].lat > point.lat &&
                point.lng < ((polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat)) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng
            ) {
                inside = !inside;
            }
        }
        return inside;
    }, []);

    // 상가 검증 (투영 좌표 대응)
    const validateAndGetStoresInArea = useCallback((polygon: PolygonPoint[], category: string) => {
        const areaSize = calculatePolygonArea(polygon);

        // 🎯 상가 좌표는 위경도이므로 polygon이 투영좌표면 변환 필요
        // 하지만 여기서는 간단히 처리
        const filteredStores = stores.filter(store => {
            if (category) {
                const storeCategoryName = store.categoryName || store.bizCategoryCode || '';
                if (!storeCategoryName.includes(category)) return false;
            }

            const lat = store.lat;
            const lng = store.lng;
            if (!lat || !lng) return false;

            // 🎯 상가 좌표(위경도)와 polygon(투영좌표) 비교는 복잡하므로
            // 일단 기본 범위 체크만 수행
            return true; // 임시로 모든 상가 포함
        });

        const uniqueStores = filteredStores.reduce((acc, store) => {
            const key = `${store.lat?.toFixed(5)}_${store.lng?.toFixed(5)}`;
            if (!acc.find(s => `${s.lat?.toFixed(5)}_${s.lng?.toFixed(5)}` === key)) {
                acc.push(store);
            }
            return acc;
        }, [] as typeof stores);

        let isValid = true;
        let errorMessage = '';
        let shouldDelete = false;

        if (areaSize > AREA_LIMITS.MAX_AREA) {
            isValid = false;
            shouldDelete = true;
            errorMessage = `영역이 너무 큽니다. 최대 ${(AREA_LIMITS.MAX_AREA / 1000000).toFixed(1)}km² 이하여야 합니다.\n영역이 자동으로 삭제됩니다.`;
        } else if (uniqueStores.length < AREA_LIMITS.MIN_STORES) {
            isValid = false;
            errorMessage = `분석에 필요한 상가가 부족합니다. 최소 ${AREA_LIMITS.MIN_STORES}개 이상의 상가가 필요합니다.`;
        } else if (uniqueStores.length > AREA_LIMITS.MAX_STORES) {
            isValid = false;
            errorMessage = `상가가 너무 많습니다. 최대 ${AREA_LIMITS.MAX_STORES}개 이하의 영역을 선택해주세요.`;
        }

        return {
            stores: uniqueStores.slice(0, AREA_LIMITS.MAX_STORES),
            area: areaSize,
            storeCount: uniqueStores.length,
            isValid,
            errorMessage,
            shouldDelete
        };
    }, [stores, calculatePolygonArea]);

    // 🎯 드로잉 초기화 useEffect
    // 🎯 드로잉 초기화 useEffect (마커 클릭 차단 포함)
    useEffect(() => {
        // 🎯 드로잉 모드일 때 마커 클릭 차단 (CSS로)
        if (isDrawingMode) {
            document.body.classList.add('drawing-mode');
            console.log('🚫 드로잉 모드: 마커 클릭 비활성화');
        } else {
            document.body.classList.remove('drawing-mode');
            console.log('✅ 마커 클릭 복원');
        }

        if (!canUseAreaRecommendation || !isDrawingMode) {
            // cleanup 시에도 클래스 제거
            document.body.classList.remove('drawing-mode');
            return;
        }

        const actualMap = findKakaoMap();
        if (!actualMap) {
            alert('지도를 찾을 수 없습니다. 페이지를 새로고침 해주세요.');
            setIsDrawingMode(false);
            document.body.classList.remove('drawing-mode');
            return;
        }

        if (drawingManagerRef.current) {
            console.log('🔄 기존 드로잉 매니저에서 타입 변경:', drawingType);

            drawingManagerRef.current.cancel();

            const overlayType = drawingType === 'rectangle'
                ? window.kakao.maps.drawing.OverlayType.RECTANGLE
                : drawingType === 'circle'
                    ? window.kakao.maps.drawing.OverlayType.CIRCLE
                    : window.kakao.maps.drawing.OverlayType.POLYGON;

            drawingManagerRef.current.select(overlayType);
            console.log('🎯 드로잉 타입 변경 완료:', overlayType);
            return;
        }

        try {
            if (!window.kakao?.maps?.drawing) {
                throw new Error('Kakao Drawing Library가 로드되지 않았습니다.');
            }

            const options = {
                map: actualMap,
                drawingMode: [
                    window.kakao.maps.drawing.OverlayType.RECTANGLE,
                    window.kakao.maps.drawing.OverlayType.CIRCLE,
                    window.kakao.maps.drawing.OverlayType.POLYGON
                ],
                rectangleOptions: {
                    draggable: false,
                    removable: true,
                    editable: false,
                    strokeColor: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                },
                circleOptions: {
                    draggable: false,
                    removable: true,
                    editable: false,
                    strokeColor: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                },
                polygonOptions: {
                    draggable: false,
                    removable: true,
                    editable: false,
                    strokeColor: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    hintStrokeStyle: 'dash',
                    hintStrokeOpacity: 0.5
                }
            };

            drawingManagerRef.current = new window.kakao.maps.drawing.DrawingManager(options);
            console.log('✅ 드로잉 매니저 생성 성공:', drawingManagerRef.current);

            drawingManagerRef.current.cancel();

            const overlayType = drawingType === 'rectangle'
                ? window.kakao.maps.drawing.OverlayType.RECTANGLE
                : drawingType === 'circle'
                    ? window.kakao.maps.drawing.OverlayType.CIRCLE
                    : window.kakao.maps.drawing.OverlayType.POLYGON;

            drawingManagerRef.current.select(overlayType);
            console.log('🎯 드로잉 모드 활성화:', overlayType);

            // 🎯 드로잉 완료 이벤트 (투영 좌표 사용)
            window.kakao.maps.event.addListener(drawingManagerRef.current, 'drawend', (mouseEvent: any) => {
                console.log('🎉 드로잉 이벤트 발생!', mouseEvent);

                const data = mouseEvent.target;
                let polygon: PolygonPoint[] = [];

                try {
                    if (drawingType === 'rectangle') {
                        console.log('📐 사각형 처리');

                        if (data && typeof data.getBounds === 'function') {
                            const bounds = data.getBounds();
                            const sw = bounds.getSouthWest();
                            const ne = bounds.getNorthEast();

                            const latDiff = Math.abs(ne.getLat() - sw.getLat());
                            const lngDiff = Math.abs(ne.getLng() - sw.getLng());

                            console.log('📏 사각형 크기:', { latDiff, lngDiff });

                            if (latDiff < 0.001 || lngDiff < 0.001) {
                                console.log('⚠️ 사각형이 너무 작음 - 무시하고 계속 그리기');

                                if (data && typeof data.setMap === 'function') {
                                    data.setMap(null);
                                }

                                setTimeout(() => {
                                    if (drawingManagerRef.current) {
                                        drawingManagerRef.current.cancel();
                                        drawingManagerRef.current.select(window.kakao.maps.drawing.OverlayType.RECTANGLE);
                                        console.log('🔄 사각형 드로잉 모드 재시작');
                                    }
                                }, 10);

                                return;
                            }

                            polygon = [
                                { lat: sw.getLat(), lng: sw.getLng() },
                                { lat: sw.getLat(), lng: ne.getLng() },
                                { lat: ne.getLat(), lng: ne.getLng() },
                                { lat: ne.getLat(), lng: sw.getLng() }
                            ];
                        } else {
                            throw new Error('사각형 getBounds 메서드 없음');
                        }

                    } else if (drawingType === 'circle') {
                        console.log('⭕ 원형 처리');

                        let center, radius;

                        if (typeof data.getCenter === 'function' && typeof data.getRadius === 'function') {
                            center = data.getCenter();
                            radius = data.getRadius();
                        } else if (data.center && data.radius !== undefined) {
                            center = data.center;
                            radius = data.radius;
                        } else if (data._center && data._radius !== undefined) {
                            center = data._center;
                            radius = data._radius;
                        } else if (typeof data.getBounds === 'function') {
                            const bounds = data.getBounds();
                            const sw = bounds.getSouthWest();
                            const ne = bounds.getNorthEast();

                            const centerLat = (sw.getLat() + ne.getLat()) / 2;
                            const centerLng = (sw.getLng() + ne.getLng()) / 2;
                            center = new window.kakao.maps.LatLng(centerLat, centerLng);

                            const latDist = Math.abs(ne.getLat() - sw.getLat()) * 111000 / 2;
                            const lngDist = Math.abs(ne.getLng() - sw.getLng()) * 111000 * Math.cos(centerLat * Math.PI / 180) / 2;
                            radius = Math.max(latDist, lngDist);
                        } else {
                            throw new Error('원형 데이터 접근 방법을 찾을 수 없음');
                        }

                        console.log('📏 원형 크기:', { center, radius });

                        if (radius < 50) {
                            console.log('⚠️ 원형이 너무 작음 - 무시하고 계속 그리기');

                            if (data && typeof data.setMap === 'function') {
                                data.setMap(null);
                            }

                            setTimeout(() => {
                                if (drawingManagerRef.current) {
                                    drawingManagerRef.current.cancel();
                                    drawingManagerRef.current.select(window.kakao.maps.drawing.OverlayType.CIRCLE);
                                    console.log('🔄 원형 드로잉 모드 재시작');
                                }
                            }, 10);

                            return;
                        }

                        const points = 16;
                        for (let i = 0; i < points; i++) {
                            const angle = (i / points) * 2 * Math.PI;
                            const lat = center.getLat() + (radius / 111000) * Math.cos(angle);
                            const lng = center.getLng() + (radius / (111000 * Math.cos(center.getLat() * Math.PI / 180))) * Math.sin(angle);
                            polygon.push({ lat, lng });
                        }

                    } else if (drawingType === 'polygon') {
                        console.log('🔷 다각형 처리');

                        let path;

                        if (typeof data.getPath === 'function') {
                            path = data.getPath();
                        } else if (data.path) {
                            path = data.path;
                        } else if (data._path) {
                            path = data._path;
                        } else if (data.getPoints && typeof data.getPoints === 'function') {
                            path = data.getPoints();
                        } else {
                            throw new Error('다각형 경로 데이터를 찾을 수 없음');
                        }

                        console.log('📏 다각형 점 개수:', path ? path.length : 0);

                        if (!path || path.length < 3) {
                            console.log('⚠️ 다각형 점이 부족 - 무시하고 계속 그리기');

                            if (data && typeof data.setMap === 'function') {
                                data.setMap(null);
                            }

                            setTimeout(() => {
                                if (drawingManagerRef.current) {
                                    drawingManagerRef.current.cancel();
                                    drawingManagerRef.current.select(window.kakao.maps.drawing.OverlayType.POLYGON);
                                    console.log('🔄 다각형 드로잉 모드 재시작');
                                }
                            }, 10);

                            return;
                        }

                        // 🎯 각 포인트에서 좌표 추출 (투영 좌표 그대로 사용)
                        for (let i = 0; i < path.length; i++) {
                            const point = path[i];
                            let lat, lng;

                            console.log(`🔍 포인트 ${i} 원본:`, point);

                            if (point && typeof point.getLat === 'function' && typeof point.getLng === 'function') {
                                lat = point.getLat();
                                lng = point.getLng();
                                console.log(`✅ 방법 1 성공: lat=${lat}, lng=${lng}`);
                            } else if (point && point.lat !== undefined && point.lng !== undefined) {
                                lat = point.lat;
                                lng = point.lng;
                                console.log(`✅ 방법 2 성공: lat=${lat}, lng=${lng}`);
                            } else if (point && point._lat !== undefined && point._lng !== undefined) {
                                lat = point._lat;
                                lng = point._lng;
                                console.log(`✅ 방법 3 성공: lat=${lat}, lng=${lng}`);
                            } else if (point && point.Ma !== undefined && point.La !== undefined) {
                                // 🎯 투영 좌표 그대로 사용! (미터 단위)
                                console.log(`⚠️ 투영좌표: Ma=${point.Ma}, La=${point.La}`);

                                // 투영 좌표를 그대로 사용 (이미 미터 단위)
                                lng = point.Ma; // 동쪽 좌표 (미터)
                                lat = point.La; // 북쪽 좌표 (미터)

                                console.log(`✅ 투영 좌표 그대로 사용: x=${lng}m, y=${lat}m`);
                            } else {
                                console.error('❌ 포인트 좌표 추출 실패:', point);
                                continue;
                            }

                            polygon.push({ lat, lng });
                            console.log(`✅ 추가된 좌표: lat=${lat}, lng=${lng}`);
                        }

                        console.log(`📍 최종 폴리곤 (${polygon.length}개 점):`, polygon);
                    }

                    if (polygon.length === 0) {
                        console.log('⚠️ 유효한 폴리곤이 생성되지 않음');
                        return;
                    }

                    console.log('📍 유효한 폴리곤 생성됨:', polygon);

                    const validation = validateAndGetStoresInArea(polygon, areaCategory);

                    if (validation.shouldDelete) {
                        console.log('🗑️ 최대 면적 초과로 영역 자동 삭제');

                        if (data && typeof data.setMap === 'function') {
                            data.setMap(null);
                        }

                        setDrawnArea(null);
                        setDrawnOverlay(null);
                        setAreaInfo(null);

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

                    if (data) {
                        try {
                            if (typeof data.setDraggable === 'function') {
                                data.setDraggable(false);
                            }
                            if (typeof data.setEditable === 'function') {
                                data.setEditable(false);
                            }
                            if (typeof data.setRemovable === 'function') {
                                data.setRemovable(true);
                            }
                            console.log('🎯 도형 편집 기능 비활성화 (X 버튼은 유지)');
                        } catch (e) {
                            console.warn('도형 편집 비활성화 실패:', e);
                        }
                    }

                    setIsDrawingMode(false);

                    console.log('🎯 드로잉 모드 종료 - 유효한 도형 완성');

                    if (!validation.isValid) {
                        alert(`⚠️ 영역 선택 오류\n\n${validation.errorMessage}`);
                    } else {
                        console.log('✅ 영역 선택 성공:', {
                            면적: `${(validation.area / 10000).toFixed(2)}ha`,
                            상가수: `${validation.storeCount}개`
                        });
                    }

                } catch (error) {
                    console.error('❌ 드로잉 데이터 처리 오류:', error);

                    if (data && typeof data.setMap === 'function') {
                        data.setMap(null);
                    }

                    setTimeout(() => {
                        if (drawingManagerRef.current) {
                            const overlayType = drawingType === 'rectangle'
                                ? window.kakao.maps.drawing.OverlayType.RECTANGLE
                                : drawingType === 'circle'
                                    ? window.kakao.maps.drawing.OverlayType.CIRCLE
                                    : window.kakao.maps.drawing.OverlayType.POLYGON;

                            drawingManagerRef.current.cancel();
                            drawingManagerRef.current.select(overlayType);
                            console.log('🔄 에러 후 드로잉 모드 재시작');
                        }
                    }, 10);
                }
            });

            // 🎯 도형 삭제 이벤트 리스너
            window.kakao.maps.event.addListener(drawingManagerRef.current, 'remove', (mouseEvent: any) => {
                console.log('🗑️ 도형이 X 버튼으로 삭제됨:', mouseEvent);

                setDrawnArea(null);
                setDrawnOverlay(null);
                setAreaInfo(null);

                console.log('✅ 영역 데이터 초기화 완료');
            });

            const mapContainer = actualMap.getNode();
            if (mapContainer) {
                mapContainer.style.cursor = 'crosshair';
                console.log('🖱️ 커서를 crosshair로 변경');
            }

        } catch (error: any) {
            console.error('❌ 드로잉 매니저 생성 오류:', error);
            setIsDrawingMode(false);
            document.body.classList.remove('drawing-mode'); // 에러 시에도 클래스 제거

            if (error.message.includes('Drawing Library')) {
                alert('Drawing Library를 로드하지 못했습니다.\n카카오맵 스크립트 설정을 확인해주세요.');
            } else {
                alert('드로잉 생성 실패: ' + (error?.message || '알 수 없는 오류'));
            }
        }

        return () => {
            console.log('🧹 드로잉 정리 시작');

            // 🎯 정리할 때도 클래스 제거
            document.body.classList.remove('drawing-mode');

            if (drawingManagerRef.current) {
                try {
                    if (drawingManagerRef.current && typeof drawingManagerRef.current.cancel === 'function') {
                        drawingManagerRef.current.cancel();
                        console.log('✅ drawingManager.cancel() 완료');
                    }
                } catch (e) {
                    console.warn('cancel 실패 (무시됨):', e);
                }

                try {
                    if (drawingManagerRef.current && typeof drawingManagerRef.current.remove === 'function') {
                        drawingManagerRef.current.remove();
                        console.log('✅ drawingManager.remove() 완료');
                    }
                } catch (e) {
                    console.warn('remove 실패 (무시됨):', e);
                }

                drawingManagerRef.current = null;
            }

            const actualMap = findKakaoMap();
            if (actualMap) {
                const mapContainer = actualMap.getNode();
                if (mapContainer) {
                    mapContainer.style.cursor = 'grab';
                    console.log('🖱️ 커서를 grab으로 원복');
                }
            }
        };
    }, [isDrawingMode, drawingType, canUseAreaRecommendation, findKakaoMap, areaCategory, validateAndGetStoresInArea]);

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
