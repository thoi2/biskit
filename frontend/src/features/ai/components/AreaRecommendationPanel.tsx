// src/features/ai/components/AreaRecommendationPanel.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Label } from '@/lib/components/ui/label';
import { Square, AlertTriangle } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useIndustryStore } from '@/features/survey/store/industryStore';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import DrawingToolSelector from './drawing/DrawingToolSelector';
import AreaLimitsInfo from './drawing/AreaLimitsInfo';
import DrawingControls from './drawing/DrawingControls';
import AreaInfoDisplay from './drawing/AreaInfoDisplay';
import AnalysisButton from './AnalysisButton';
import IndustrySelectModal from '@/features/survey/components/IndustrySelectModal';
import { useAreaDrawing } from '../hooks/drawing/useAreaDrawing';
import { useAreaAnalysis } from '@/features/ai/hooks/useAreaAnalysis';
import storeCategories from '@/lib/data/store_categories.json';

interface CategoryData {
    상권업종대분류코드: string;
    상권업종대분류명: string;
    상권업종중분류코드: string;
    상권업종중분류명: string;
    상권업종소분류코드: string;
    상권업종소분류명: string;
}

export function AreaRecommendationPanel() {
    const {
        activeTab,
        map,
        isDrawingMode,
        isDrawingActive, // ✅ 추가
        drawingType,
        setDrawingType,
        setActiveTab, // ✅ 추가
        addRecommendationMarker, // ✅ 추가
        clearRecommendationMarkers // ✅ 추가
    } = useMapStore();
    const { userIndustries, fetchUserIndustries } = useIndustryStore();
    const { stores } = useStoreStore();
    const { user } = useAuth();

    // 상태 관리
    const [areaCategory, setAreaCategory] = useState('');
    const [showAreaIndustryModal, setShowAreaIndustryModal] = useState(false);

    // ✅ 커스텀 훅 사용 (반응성 개선)
    const {
        drawnArea,
        drawnOverlay,
        areaInfo,
        clearDrawnArea
    } = useAreaDrawing(areaCategory);

    const {
        isAreaAnalyzing,
        analysisResult,
        handleAreaAnalysis,
        resetAnalysis
    } = useAreaAnalysis(drawnArea, areaCategory, areaInfo);

    // ✅ 분석 완료 시 결과 처리
    useEffect(() => {
        if (analysisResult?.success && analysisResult.recommendations) {
            console.log('🎯 범위 분석 완료 - 결과 처리 시작');

            // 기존 추천 마커 제거
            clearRecommendationMarkers();

            // 새로운 추천 마커 추가
            analysisResult.recommendations.forEach((rec, index) => {
                addRecommendationMarker({
                    id: rec.id,
                    lat: rec.lat,
                    lng: rec.lng,
                    type: 'recommendation',
                    title: rec.title,
                    category: rec.category,
                    survivalRate: rec.score,
                    buildingId: index + 1,
                    isAreaResult: true // ✅ 범위 분석 결과임을 표시
                });
            });

            // 결과 탭으로 이동
            setTimeout(() => {
                setActiveTab('result');
                console.log('📍 결과 탭으로 이동 완료');
            }, 500);
        }
    }, [analysisResult, clearRecommendationMarkers, addRecommendationMarker, setActiveTab]);

    // 사용자 업종 정보 로드
    useEffect(() => {
        if (user) {
            fetchUserIndustries();
        }
    }, [user, fetchUserIndustries]);

    // 내 추천 업종 변환
    const myRecommendationsForModal = useMemo(() => {
        if (!user || !userIndustries?.hasRecommendation) return [];

        const categories = storeCategories as CategoryData[];
        const recommendations = [
            { code: userIndustries.industry1st, rank: 1, emoji: '🥇' },
            { code: userIndustries.industry2nd, rank: 2, emoji: '🥈' },
            { code: userIndustries.industry3rd, rank: 3, emoji: '🥉' }
        ].filter(item => item.code);

        return recommendations.map(item => {
            const category = categories.find(cat => cat.상권업종소분류코드 === item.code);
            if (!category) return null;

            return {
                industryCode: item.code!,
                industryName: category.상권업종소분류명,
                category: category.상권업종중분류명,
                reason: `${item.emoji} ${item.rank}순위 추천 업종`,
                score: 0
            };
        }).filter(Boolean) as Array<{
            industryCode: string;
            industryName: string;
            category: string;
            reason: string;
            score: number;
        }>;
    }, [user, userIndustries]);

    // 범위 분석 조건 체크
    const hasStoreData = stores.length > 0;
    const isValidZoom = map && map.getLevel() <= 2;
    const canUseAreaRecommendation = hasStoreData && isValidZoom && activeTab === 'recommend';

    const handleAreaIndustrySelect = (categoryData: CategoryData) => {
        setAreaCategory(categoryData.상권업종소분류명);
        setShowAreaIndustryModal(false);
        console.log('✅ 범위 분석 업종 선택:', categoryData.상권업종소분류명);
    };

    const handleClearAreaCategory = () => {
        setAreaCategory('');
        resetAnalysis();
        console.log('🔄 범위 분석 업종 선택 해제');
    };

    // ✅ 분석 실행 핸들러 (개선)
    const handleStartAnalysis = async () => {
        if (!drawnArea || !areaCategory || !areaInfo?.isValid) {
            console.warn('⚠️ 분석 조건 미충족');
            return;
        }

        console.log('🚀 범위 분석 시작');
        await handleAreaAnalysis();
    };

    // ✅ 실시간 상태 디스플레이 (디버깅용)
    console.log('🔄 AreaRecommendationPanel 상태:', {
        activeTab,
        isDrawingMode,
        isDrawingActive,
        drawingType,
        areaCategory,
        hasDrawnArea: !!drawnArea,
        hasAreaInfo: !!areaInfo,
        isAreaAnalyzing,
        hasAnalysisResult: !!analysisResult
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Square className="w-4 h-4" />
                        범위 추천 분석
                        {/* ✅ 상태 표시 */}
                        {isDrawingMode && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                그리는 중
                            </span>
                        )}
                        {drawnArea && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                영역 완료
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 사용 조건 체크 */}
                    {!hasStoreData && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">상가 데이터를 먼저 로딩해주세요</span>
                            </div>
                        </div>
                    )}

                    {!isValidZoom && hasStoreData && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">지도를 더 확대해주세요 (축적 2레벨 이하)</span>
                            </div>
                        </div>
                    )}

                    <DrawingToolSelector
                        drawingType={drawingType}
                        setDrawingType={setDrawingType}
                        canUseAreaRecommendation={canUseAreaRecommendation}
                    />

                    <AreaLimitsInfo />

                    {/* 업종 선택 */}
                    <div>
                        <Label className="text-xs mb-2 block">
                            분석할 업종 <span className="text-red-500">*</span>
                        </Label>
                        <button
                            onClick={() => setShowAreaIndustryModal(true)}
                            disabled={!canUseAreaRecommendation || isAreaAnalyzing}
                            className={`w-full p-2 text-left border rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors ${
                                !areaCategory ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        >
                            <span className={`text-sm ${!areaCategory ? 'text-red-500' : 'text-gray-800'}`}>
                                {areaCategory || '업종을 반드시 선택해주세요'}
                            </span>
                        </button>

                        {areaCategory && (
                            <button
                                onClick={handleClearAreaCategory}
                                disabled={isAreaAnalyzing}
                                className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
                            >
                                선택 해제
                            </button>
                        )}

                        {!areaCategory && (
                            <p className="text-xs text-red-500 mt-1">
                                ⚠️ 범위 추천 분석에는 업종 선택이 필수입니다
                            </p>
                        )}
                    </div>

                    <DrawingControls
                        canUseAreaRecommendation={canUseAreaRecommendation}
                        isDrawingMode={isDrawingMode}
                        drawingType={drawingType}
                        areaCategory={areaCategory}
                    />

                    <AreaInfoDisplay
                        drawnArea={drawnArea}
                        areaInfo={areaInfo}
                        drawingType={drawingType}
                        onClear={clearDrawnArea}
                    />

                    <AnalysisButton
                        drawnArea={drawnArea}
                        areaCategory={areaCategory}
                        areaInfo={areaInfo}
                        isAnalyzing={isAreaAnalyzing}
                        onAnalyze={handleStartAnalysis} // ✅ 개선된 핸들러 사용
                    />

                    {/* ✅ 분석 결과 간단 표시 */}
                    {analysisResult?.success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700">
                                <span className="text-sm font-medium">✅ 분석 완료!</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                                {analysisResult.recommendations?.length}개의 추천 입지를 찾았습니다.
                                결과 탭에서 확인하세요.
                            </p>
                        </div>
                    )}

                    {analysisResult?.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">분석 실패</span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                                {analysisResult.error}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <IndustrySelectModal
                isOpen={showAreaIndustryModal}
                onClose={() => setShowAreaIndustryModal(false)}
                onSelect={handleAreaIndustrySelect}
                title="범위 분석할 업종 선택"
                aiRecommendations={myRecommendationsForModal}
            />
        </>
    );
}
