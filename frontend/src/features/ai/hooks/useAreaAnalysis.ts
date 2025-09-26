import { useState, useCallback } from 'react';
import { useStoreSelectors } from '@/features/stores/store/storesStore';
import { useRecommendationStore } from '@/features/ai/store';

// ✅ RecommendationMarker 타입을 직접 정의
interface RecommendationMarker {
    id: string;
    lat: number;
    lng: number;
    type: 'recommendation';
    title: string;
    category: string;
    survivalRate: number;
    buildingId: number;
    isAreaResult?: boolean;
    isFromBackend?: boolean;
    isHighlighted?: boolean;
}

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

interface AreaAnalysisResult {
    recommendations: Array<{
        lat: number;
        lng: number;
        categoryResults: Array<{
            category: string;
            survivalRate: number;
        }>;
    }>;
    meta: {
        source: string;
        version: string;
        last_at: string;
        totalRecommendations: number;
    };
}

export function useAreaAnalysis(
    drawnArea: PolygonPoint[] | null,
    areaCategory: string,
    areaInfo: AreaInfo | null
) {
    const [isAreaAnalyzing, setIsAreaAnalyzing] = useState(false);
    const { uniqueStoreCoords } = useStoreSelectors();

    // ✅ 추천 스토어에서만 가져오기 (타입 수정)
    const {
        startRequest,
        setRequestSuccess,
        setRequestError,
        setRecommendationMarkers
    } = useRecommendationStore();

    // Point-in-Polygon 알고리즘
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

    // 🎯 범위 내 랜덤 좌표 생성
    const generateRandomPointsInArea = useCallback((polygon: PolygonPoint[], count: number = 10): PolygonPoint[] => {
        if (polygon.length < 3) return [];

        // 바운딩 박스 계산
        const minLat = Math.min(...polygon.map(p => p.lat));
        const maxLat = Math.max(...polygon.map(p => p.lat));
        const minLng = Math.min(...polygon.map(p => p.lng));
        const maxLng = Math.max(...polygon.map(p => p.lng));

        const points: PolygonPoint[] = [];
        let attempts = 0;
        const maxAttempts = count * 10;

        while (points.length < count && attempts < maxAttempts) {
            const randomLat = minLat + Math.random() * (maxLat - minLat);
            const randomLng = minLng + Math.random() * (maxLng - minLng);
            const testPoint = { lat: randomLat, lng: randomLng };

            if (isPointInPolygon(testPoint, polygon)) {
                points.push(testPoint);
            }
            attempts++;
        }

        return points;
    }, [isPointInPolygon]);

    // 🎯 Mock 데이터로 SingleBuildingRecommendationResponse 형태 결과 생성
    const generateMockSingleIndustryResult = useCallback((lat: number, lng: number, category: string, buildingId: number) => {
        const random = () => Math.random();

        return {
            building: {
                building_id: buildingId,
                lat: lat,
                lng: lng
            },
            result: [
                {
                    category: category,
                    survivalRate: 0.65 + random() * 0.3
                },
                {
                    category: "카페",
                    survivalRate: 0.70 + random() * 0.25
                },
                {
                    category: "음식점",
                    survivalRate: 0.60 + random() * 0.3
                },
                {
                    category: "편의점",
                    survivalRate: 0.80 + random() * 0.15
                },
                {
                    category: "미용실",
                    survivalRate: 0.65 + random() * 0.25
                }
            ],
            meta: {
                source: "MOCK",
                version: "v1.0",
                last_at: new Date().toISOString()
            }
        };
    }, []);

    const handleAreaAnalysis = useCallback(async () => {
        if (!drawnArea || !areaInfo?.isValid) return;

        // 🎯 스토어에서 로딩 시작 (기존 마커도 초기화)
        startRequest();
        setIsAreaAnalyzing(true);

        try {
            console.log('🚀 범위 분석 시작 (Mock):', {
                영역면적: `${(areaInfo.area / 10000).toFixed(2)}ha`,
                분석대상업종: areaCategory,
                드로잉영역점수: drawnArea.length
            });

            // 🎯 로딩 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 🎯 범위 내 10개 랜덤 좌표 생성
            const randomPoints = generateRandomPointsInArea(drawnArea, 10);

            console.log(`📍 생성된 분석 지점: ${randomPoints.length}개`);

            // 🎯 각 지점에 대해 SingleBuildingRecommendationResponse 형태로 생성
            const mockRecommendations = randomPoints.map((point, index) =>
                generateMockSingleIndustryResult(point.lat, point.lng, areaCategory, 10000 + index)
            );

            // 🎯 추천 결과 저장 (any 타입으로 캐스팅)
            setRequestSuccess(mockRecommendations as any);

            // ✅ 추천 마커들 생성 및 저장 (타입 명시)
            const markers: RecommendationMarker[] = mockRecommendations.map((rec, index) => ({
                id: `ai-area-${rec.building.building_id}`,
                lat: rec.building.lat,
                lng: rec.building.lng,
                type: 'recommendation' as const,
                title: `범위 분석 #${index + 1}`,
                category: areaCategory,
                survivalRate: rec.result.find(r => r.category === areaCategory)?.survivalRate || 0,
                buildingId: rec.building.building_id,
                isAreaResult: true, // 🎯 범위 분석 결과임을 표시
                isFromBackend: false,
                isHighlighted: false
            }));

            // ✅ 안전한 마커 설정 (타입 단언)
            setRecommendationMarkers(markers as any);

            console.log('🎉 범위 분석 완료 (Mock):', mockRecommendations);
            console.log('🗺️ 추천 마커들 생성:', markers);

            // 🎯 결과 요약
            const targetCategoryResults = mockRecommendations.map(rec =>
                rec.result.find(r => r.category === areaCategory)
            ).filter(Boolean);

            const avgSurvivalRate = targetCategoryResults.reduce((sum, result) =>
                sum + (result?.survivalRate || 0), 0
            ) / targetCategoryResults.length;

            const bestLocation = mockRecommendations.reduce((best, current) => {
                const bestRate = best.result.find(r => r.category === areaCategory)?.survivalRate || 0;
                const currentRate = current.result.find(r => r.category === areaCategory)?.survivalRate || 0;
                return currentRate > bestRate ? current : best;
            });

            const bestRate = bestLocation.result.find(r => r.category === areaCategory)?.survivalRate || 0;

            alert(`✅ 범위 분석 완료! (Mock 데이터)\n\n` +
                `📍 영역: ${(areaInfo.area / 10000).toFixed(2)}ha\n` +
                `🔍 분석 지점: ${mockRecommendations.length}개\n` +
                `🎯 분석 대상: ${areaCategory}\n\n` +
                `📊 결과 요약:\n` +
                `• 평균 생존율: ${(avgSurvivalRate * 100).toFixed(1)}%\n` +
                `• 최고 생존율: ${(bestRate * 100).toFixed(1)}%\n` +
                `• 최적 위치: ${bestLocation.building.lat.toFixed(4)}, ${bestLocation.building.lng.toFixed(4)}\n\n` +
                `🗺️ 지도에서 ${markers.length}개 마커를 확인하세요!\n` +
                `👉 자세한 결과는 결과 탭에서 확인하세요!`);

            return mockRecommendations;

        } catch (error: any) {
            console.error('범위 분석 오류:', error);
            setRequestError('범위 분석 중 오류가 발생했습니다.');
            alert('범위 분석 중 오류가 발생했습니다.');
        } finally {
            setIsAreaAnalyzing(false);
        }
    }, [drawnArea, areaCategory, areaInfo, generateRandomPointsInArea, generateMockSingleIndustryResult, startRequest, setRequestSuccess, setRequestError, setRecommendationMarkers]);

    return {
        isAreaAnalyzing,
        handleAreaAnalysis
    };
}
