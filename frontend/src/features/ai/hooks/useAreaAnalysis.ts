// src/features/ai/hooks/useAreaAnalysis.ts
import { useState, useCallback } from 'react';

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
    analysisId?: string;
    recommendations?: Array<{
        id: string;
        title: string;
        category: string;
        score: number;
        description: string;
        lat: number;
        lng: number;
    }>;
    summary?: {
        totalStores: number;
        averageScore: number;
        riskLevel: 'low' | 'medium' | 'high';
    };
    error?: string;
}

// ✅ export function으로 명시적 export
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

            // 임시 분석 시뮬레이션 (2초 딜레이)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 영역 중심점 계산
            const centerLat = drawnArea.reduce((sum, point) => sum + point.lat, 0) / drawnArea.length;
            const centerLng = drawnArea.reduce((sum, point) => sum + point.lng, 0) / drawnArea.length;

            // Mock 분석 결과
            const mockResult: AnalysisResult = {
                success: true,
                analysisId: `area_${Date.now()}`,
                recommendations: [
                    {
                        id: `rec_1_${Date.now()}`,
                        title: `${areaCategory} 추천 입지 #1`,
                        category: areaCategory,
                        score: 85,
                        description: '높은 유동인구와 접근성이 우수한 위치입니다.',
                        lat: centerLat + (Math.random() - 0.5) * 0.001,
                        lng: centerLng + (Math.random() - 0.5) * 0.001
                    },
                    {
                        id: `rec_2_${Date.now()}`,
                        title: `${areaCategory} 추천 입지 #2`,
                        category: areaCategory,
                        score: 78,
                        description: '경쟁업체가 적고 임대료가 적절한 지역입니다.',
                        lat: centerLat + (Math.random() - 0.5) * 0.001,
                        lng: centerLng + (Math.random() - 0.5) * 0.001
                    },
                    {
                        id: `rec_3_${Date.now()}`,
                        title: `${areaCategory} 추천 입지 #3`,
                        category: areaCategory,
                        score: 72,
                        description: '향후 개발 계획이 있어 성장 가능성이 높습니다.',
                        lat: centerLat + (Math.random() - 0.5) * 0.001,
                        lng: centerLng + (Math.random() - 0.5) * 0.001
                    }
                ],
                summary: {
                    totalStores: areaInfo.storeCount,
                    averageScore: 78,
                    riskLevel: areaInfo.storeCount > 50 ? 'high' : areaInfo.storeCount > 20 ? 'medium' : 'low'
                }
            };

            setAnalysisResult(mockResult);
            console.log('✅ 영역 분석 완료:', mockResult);

        } catch (error) {
            console.error('❌ 영역 분석 실패:', error);
            setAnalysisResult({
                success: false,
                error: '영역 분석 중 오류가 발생했습니다.'
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

// ✅ 추가로 named export도 명시
export { useAreaAnalysis as default };

// ✅ 타입들도 export
export type { PolygonPoint, AreaInfo, AnalysisResult };
