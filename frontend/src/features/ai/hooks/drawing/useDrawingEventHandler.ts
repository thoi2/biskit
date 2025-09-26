// src/features/map/hooks/useDrawingEventHandler.ts
import { useCallback } from 'react';

interface PolygonPoint {
    lat: number;
    lng: number;
}

interface ValidationResult {
    area: number;
    storeCount: number;
    isValid: boolean;
    errorMessage?: string;
    shouldDelete?: boolean;
}

interface UseDrawingEventHandlerProps {
    drawingType: string;
    areaCategory: string;
    storeValidator: {
        validateAndGetStoresInArea: (polygon: PolygonPoint[], category: string) => ValidationResult;
    };
    onDrawComplete: (polygon: PolygonPoint[], data: any, validation: ValidationResult) => void;
    onDrawDelete: () => void;
}

export function useDrawingEventHandler({
                                           drawingType,
                                           areaCategory,
                                           storeValidator,
                                           onDrawComplete,
                                           onDrawDelete
                                       }: UseDrawingEventHandlerProps) {

    const attachEvents = useCallback((drawingManager: any) => {
        if (!drawingManager) return;

        // 🎯 드로잉 완료 이벤트
        window.kakao.maps.event.addListener(drawingManager, 'drawend', (mouseEvent: any) => {
            console.log('🎉 드로잉 이벤트 발생!', mouseEvent);

            const data = mouseEvent.target;
            let polygon: PolygonPoint[] = [];

            try {
                if (drawingType === 'rectangle') {
                    // 사각형 처리
                    if (data && typeof data.getBounds === 'function') {
                        const bounds = data.getBounds();
                        const sw = bounds.getSouthWest();
                        const ne = bounds.getNorthEast();

                        polygon = [
                            { lat: sw.getLat(), lng: sw.getLng() },
                            { lat: sw.getLat(), lng: ne.getLng() },
                            { lat: ne.getLat(), lng: ne.getLng() },
                            { lat: ne.getLat(), lng: sw.getLng() }
                        ];
                    }
                } else if (drawingType === 'circle') {
                    // 원형 처리 (16각형으로 근사)
                    let center, radius;

                    if (typeof data.getCenter === 'function' && typeof data.getRadius === 'function') {
                        center = data.getCenter();
                        radius = data.getRadius();
                    } else if (data.center && data.radius !== undefined) {
                        center = data.center;
                        radius = data.radius;
                    }

                    if (center && radius) {
                        const points = 16;
                        for (let i = 0; i < points; i++) {
                            const angle = (i / points) * 2 * Math.PI;
                            const lat = center.getLat() + (radius / 111000) * Math.cos(angle);
                            const lng = center.getLng() + (radius / (111000 * Math.cos(center.getLat() * Math.PI / 180))) * Math.sin(angle);
                            polygon.push({ lat, lng });
                        }
                    }
                } else if (drawingType === 'polygon') {
                    // 다각형 처리
                    let path;

                    if (typeof data.getPath === 'function') {
                        path = data.getPath();
                    } else if (data.path) {
                        path = data.path;
                    }

                    if (path && path.length >= 3) {
                        for (let i = 0; i < path.length; i++) {
                            const point = path[i];
                            let lat, lng;

                            if (point && typeof point.getLat === 'function' && typeof point.getLng === 'function') {
                                lat = point.getLat();
                                lng = point.getLng();
                            } else if (point && point.lat !== undefined && point.lng !== undefined) {
                                lat = point.lat;
                                lng = point.lng;
                            }

                            if (lat !== undefined && lng !== undefined) {
                                polygon.push({ lat, lng });
                            }
                        }
                    }
                }

                if (polygon.length === 0) {
                    console.log('⚠️ 유효한 폴리곤이 생성되지 않음');
                    return;
                }

                // 검증
                const validation = storeValidator.validateAndGetStoresInArea(polygon, areaCategory);

                if (validation.shouldDelete) {
                    console.log('🗑️ 최대 면적 초과로 영역 자동 삭제');
                    if (data && typeof data.setMap === 'function') {
                        data.setMap(null);
                    }
                    alert(validation.errorMessage);
                    return;
                }

                // 완료 콜백 호출
                onDrawComplete(polygon, data, validation);

                if (!validation.isValid) {
                    alert(`⚠️ 영역 선택 오류\n\n${validation.errorMessage}`);
                }

            } catch (error) {
                console.error('❌ 드로잉 데이터 처리 오류:', error);
                if (data && typeof data.setMap === 'function') {
                    data.setMap(null);
                }
            }
        });

        // 🎯 도형 삭제 이벤트
        window.kakao.maps.event.addListener(drawingManager, 'remove', (mouseEvent: any) => {
            console.log('🗑️ 도형이 X 버튼으로 삭제됨:', mouseEvent);
            onDrawDelete();
        });

    }, [drawingType, areaCategory, storeValidator, onDrawComplete, onDrawDelete]);

    return { attachEvents };
}
