// src/features/ai/hooks/useAreaAnalysis.ts
import { useState, useCallback } from 'react';
import { getRangeRecommendation } from '@/features/ai/api';
// ✅ 타입과 함수를 분리해서 import
import type { RangeApiResponse } from '@/features/ai/types'; // 타입만
import { isRangeApiResponse } from '@/features/ai/types';    // 함수는 일반 import

// 또는 간단하게 타입 가드를 사용하지 않고 any로 처리
// ✅ 좌표 포맷팅 유틸리티 함수
const formatCoordinateForDB = (coord: number): number => {
    return parseFloat(coord.toFixed(12));
};

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

interface AnalysisResult {
    success: boolean;
    recommendations?: Array<{
        id: string;
        category: string;
        lat: number;
        lng: number;
        survivalRate: number[];
        buildingId: number;
        score: number;
    }>;
    summary?: {
        totalStores: number;
        averageScore: number;
        riskLevel: 'low' | 'medium' | 'high';
    };
    error?: string;
}

export function useAreaAnalysis(
    drawnArea: PolygonPoint[] | null,
    areaCategory: string,
    areaInfo: AreaInfo | null
) {
    const [isAreaAnalyzing, setIsAreaAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    const handleAreaAnalysis = useCallback(async () => {
        if (!drawnArea || !areaInfo || !areaInfo.isValid) {
            console.warn('🚫 영역 분석: 유효하지 않은 영역 데이터', {
                hasDrawnArea: !!drawnArea,
                hasAreaInfo: !!areaInfo,
                isValid: areaInfo?.isValid
            });
            return;
        }

        setIsAreaAnalyzing(true);
        setAnalysisResult(null);

        try {
            console.log('🔍 영역 분석 시작:', {
                area: areaInfo.area,
                storeCount: areaInfo.storeCount,
                category: areaCategory,
                polygonPoints: drawnArea.length
            });

            // ✅ 좌표 포맷팅 적용
            const formattedPolygon = drawnArea.map(point => {
                const formattedLat = formatCoordinateForDB(point.lat);
                const formattedLng = formatCoordinateForDB(point.lng);

                if (formattedLat < -90 || formattedLat > 90) {
                    throw new Error(`위도는 -90.0 ~ 90.0 범위여야 합니다: ${formattedLat}`);
                }
                if (formattedLng < -180 || formattedLng > 180) {
                    throw new Error(`경도는 -180.0 ~ 180.0 범위여야 합니다: ${formattedLng}`);
                }

                return {
                    lat: formattedLat,
                    lng: formattedLng
                };
            });

            console.log('📍 좌표 포맷팅 완료');

            const rangeRequest = {
                polygon: formattedPolygon,
                category: areaCategory
            };

            console.log('📤 Range API 요청:', rangeRequest);

            const apiResponse = await getRangeRecommendation(rangeRequest);

            console.log('📥 [RAW] 전체 응답:', apiResponse);

            // ✅ 간단하게 any로 처리 (타입 가드 사용하지 않음)
            let items: any[] = [];
            const responseData = apiResponse as any;

            if (responseData?.body?.items && Array.isArray(responseData.body.items)) {
                items = responseData.body.items;
                console.log('📥 [PARSE] body.items 구조 감지, items 개수:', items.length);
            } else if (responseData?.body && Array.isArray(responseData.body)) {
                items = responseData.body;
                console.log('📥 [PARSE] body 배열 구조 감지, items 개수:', items.length);
            } else if (responseData?.items && Array.isArray(responseData.items)) {
                items = responseData.items;
                console.log('📥 [PARSE] 직접 items 구조 감지, items 개수:', items.length);
            } else if (Array.isArray(responseData)) {
                items = responseData;
                console.log('📥 [PARSE] 직접 배열 구조 감지, items 개수:', items.length);
            } else {
                console.error('❌ [ERROR] 알 수 없는 응답 구조:', {
                    response: responseData,
                    hasBody: !!responseData?.body,
                    bodyType: typeof responseData?.body,
                    hasBodyItems: !!(responseData?.body?.items),
                    bodyItemsType: typeof responseData?.body?.items
                });
                throw new Error('범위 분석 응답 구조를 인식할 수 없습니다.');
            }

            console.log('📥 [SUCCESS] 파싱된 items:', items);

            if (!Array.isArray(items)) {
                console.error('❌ [ERROR] items가 배열이 아님:', typeof items, items);
                throw new Error('범위 분석 응답에 올바른 items가 없습니다.');
            }

            if (items.length === 0) {
                console.warn('⚠️ [WARNING] 검색 결과가 비어있음');
                setAnalysisResult({
                    success: true,
                    recommendations: [],
                    summary: {
                        totalStores: 0,
                        averageScore: 0,
                        riskLevel: 'high'
                    }
                });
                return;
            }

            // ✅ API 응답을 AnalysisResult 형태로 변환
            const recommendations = items.map((item: any, index: number) => {
                console.log(`📝 [CONVERT] ${index + 1}/${items.length}:`, {
                    building_id: item.building_id || item.buildingId,
                    category: item.category,
                    lat: item.lat,
                    lng: item.lng,
                    survival_rate: item.survival_rate || item.survivalRate
                });

                const buildingId = item.building_id || item.buildingId;
                const survivalRate = item.survival_rate || item.survivalRate || [];
                const score = calculateScoreFromSurvivalRate(survivalRate);

                if (!buildingId) {
                    console.warn('⚠️ [WARNING] building_id가 없는 항목:', item);
                }

                return {
                    id: `${buildingId || `unknown-${index}`}`,
                    category: item.category || areaCategory,
                    lat: Number(item.lat) || 0,
                    lng: Number(item.lng) || 0,
                    survivalRate: survivalRate,
                    buildingId: buildingId || 0,
                    score: score
                };
            });

            const analysisResult: AnalysisResult = {
                success: true,
                recommendations: recommendations,
                summary: {
                    totalStores: items.length,
                    averageScore: calculateAverageScore(items),
                    riskLevel: determineRiskLevel(items.length, areaInfo.storeCount)
                }
            };

            setAnalysisResult(analysisResult);
            console.log('✅ 영역 분석 완료:', {
                totalRecommendations: recommendations.length,
                averageScore: analysisResult.summary?.averageScore,
                riskLevel: analysisResult.summary?.riskLevel
            });

        } catch (error: any) {
            console.error('❌ 영역 분석 실패:', error);
            console.error('❌ 에러 스택:', error.stack);

            let errorMessage = '영역 분석 중 오류가 발생했습니다.';

            if (error.message.includes('위도') || error.message.includes('경도')) {
                errorMessage = `좌표 범위 오류: ${error.message}`;
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || '잘못된 요청입니다.';
            } else if (error.response?.status === 500) {
                errorMessage = '서버 내부 오류가 발생했습니다.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setAnalysisResult({
                success: false,
                error: errorMessage
            });
        } finally {
            setIsAreaAnalyzing(false);
        }
    }, [drawnArea, areaCategory, areaInfo]);

    const resetAnalysis = useCallback(() => {
        setAnalysisResult(null);
        setIsAreaAnalyzing(false);
        console.log('🔄 영역 분석 결과 초기화');
    }, []);

    return {
        isAreaAnalyzing,
        analysisResult,
        handleAreaAnalysis,
        resetAnalysis
    };
}

// ✅ 헬퍼 함수들
function calculateScoreFromSurvivalRate(survivalRate: number[]): number {
    if (!survivalRate || survivalRate.length === 0) return 0;

    const failureRate = survivalRate.length >= 5
        ? survivalRate[4]
        : survivalRate.reduce((sum, rate) => sum + rate, 0) / survivalRate.length;

    const score = Math.max(0, Math.min(100, 100 - failureRate));
    return Math.round(score * 10) / 10;
}

function calculateAverageScore(items: any[]): number {
    if (!items || items.length === 0) return 0;

    const totalScore = items.reduce((sum, item) => {
        return sum + calculateScoreFromSurvivalRate(item.survival_rate || item.survivalRate || []);
    }, 0);

    return Math.round(totalScore / items.length);
}

function determineRiskLevel(recommendedCount: number, totalStoreCount: number): 'low' | 'medium' | 'high' {
    if (recommendedCount === 0) return 'high';

    const ratio = totalStoreCount > 0 ? recommendedCount / totalStoreCount : 0;

    if (ratio > 0.3 || recommendedCount >= 10) return 'low';
    if (ratio > 0.1 || recommendedCount >= 5) return 'medium';
    return 'high';
}

export { useAreaAnalysis as default };
export type { PolygonPoint, AreaInfo, AnalysisResult };
