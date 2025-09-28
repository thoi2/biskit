// src/features/ai/components/AreaRecommendationPanel.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Label } from '@/lib/components/ui/label';
import {
    Square,
    AlertTriangle,
    RefreshCw,
    CheckCircle,
    Zap,
    Target,
    ArrowRight,
    Plus,
    RotateCcw,
    Layers,
    StopCircle,
    Settings,
    Search
} from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useIndustryStore } from '@/features/survey/store/industryStore';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecommendationForm } from '../hooks/useRecommendationForm'; // ✅ 통합 form 사용

// ✅ 기존 컴포넌트들
import DrawingToolSelector from './drawing/DrawingToolSelector';
import AreaLimitsInfo from './drawing/AreaLimitsInfo';
import DrawingControls from './drawing/DrawingControls';
import AreaInfoDisplay from './drawing/AreaInfoDisplay';
import AnalysisButton from './AnalysisButton';

import IndustrySelectModal from '@/features/survey/components/IndustrySelectModal';
import { useAreaDrawing } from '../hooks/drawing/useAreaDrawing';
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
        isDrawingActive,
        drawingType,
        setDrawingType,
        setActiveTab,
        setIsDrawingMode,
        setIsDrawingActive
    } = useMapStore();

    const { userIndustries, fetchUserIndustries } = useIndustryStore();
    const { stores } = useStoreStore();
    const { user } = useAuth();

    // ✅ useRecommendationForm 통합 사용
    const { category, setCategory, isLoading, handleRangeSubmit } = useRecommendationForm();

    // 상태 관리
    const [showAreaIndustryModal, setShowAreaIndustryModal] = useState(false);

    // ✅ useAreaDrawing 사용
    const {
        drawnArea,
        drawnOverlay,
        areaInfo,
        clearDrawnArea,
        canUseAreaRecommendation,
        hasStoreData,
        isValidZoom
    } = useAreaDrawing(category);

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

    // ✅ 완전 초기화
    const handleCompleteReset = () => {
        console.log('🔄 범위 분석 완전 초기화');
        setCategory('');
        clearDrawnArea();
        setIsDrawingMode(false);
        setIsDrawingActive(false);
        setDrawingType('rectangle');
    };

    // ✅ 드로잉 모드 강제 종료
    const handleForceStopDrawing = () => {
        console.log('⛔ 드로잉 모드 강제 종료');
        setIsDrawingMode(false);
        setIsDrawingActive(false);
    };

    // ✅ 핸들러 함수들
    const handleAreaIndustrySelect = (categoryData: CategoryData) => {
        setCategory(categoryData.상권업종소분류명);
        setShowAreaIndustryModal(false);
    };

    const handleClearCategory = () => {
        setCategory('');
    };

    // ✅ 수정된 분석 시작 함수 (인자 1개만 전달)
    const handleStartAnalysis = async () => {
        if (!areaInfo?.isValid || !category) {
            console.warn('⚠️ 분석 조건 미충족');
            return;
        }

        console.log('🚀 범위 분석 시작', {
            category,
            storeCount: areaInfo.storeCount,
            isValid: areaInfo.isValid
        });

        // ✅ handleRangeSubmit은 areaInfo만 받음
        await handleRangeSubmit(areaInfo);
    };

    // ✅ 현재 상태 판단
    const getCurrentStatus = () => {
        if (!hasStoreData) return 'no_data';
        if (!isValidZoom) return 'need_zoom';
        if (isLoading) return 'analyzing';
        if (isDrawingMode || isDrawingActive) return 'drawing';
        if (drawnArea && category && areaInfo?.isValid) return 'ready';
        return 'setup';
    };

    const currentStatus = getCurrentStatus();

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Square className="w-4 h-4" />
                        범위 추천 분석
                        <div className="ml-auto">
                            {currentStatus === 'drawing' && (
                                <Badge className="bg-blue-600 text-white">그리는 중</Badge>
                            )}
                            {currentStatus === 'analyzing' && (
                                <Badge className="bg-purple-600 text-white animate-pulse">분석 중</Badge>
                            )}
                            {currentStatus === 'ready' && (
                                <Badge className="bg-green-600 text-white">준비완료</Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* ✅ 드로잉 상태 긴급 리셋 */}
                    {(isDrawingMode || isDrawingActive) && !drawnArea && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-700">
                                        드로잉 모드가 활성화되어 있습니다
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleForceStopDrawing}
                                        className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                                    >
                                        <StopCircle className="w-3 h-3 mr-1" />
                                        중지
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCompleteReset}
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1" />
                                        초기화
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 조건 체크 */}
                    {!hasStoreData && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Layers className="w-5 h-5 text-blue-600" />
                                <div>
                                    <h4 className="font-medium text-blue-800">상가 데이터 로딩 필요</h4>
                                    <p className="text-sm text-blue-600 mt-1">
                                        지도에서 &quot;상가 데이터 로딩&quot; 버튼을 클릭하세요
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isValidZoom && hasStoreData && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-orange-600" />
                                <div>
                                    <h4 className="font-medium text-orange-800">지도를 더 확대하세요</h4>
                                    <p className="text-sm text-orange-600 mt-1">
                                        레벨 2 이하로 확대해주세요 (마우스 휠 또는 + 버튼)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 분석 중 */}
                    {isLoading && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                            <RefreshCw className="w-6 h-6 text-purple-600 mx-auto mb-3 animate-spin" />
                            <h4 className="font-medium text-purple-800 mb-2">AI 분석 중...</h4>
                            <p className="text-sm text-purple-600">
                                {category} 업종의 최적 입지를 찾고 있습니다
                            </p>
                        </div>
                    )}

                    {/* 일반 설정 */}
                    {canUseAreaRecommendation && !isLoading && (
                        <>
                            {/* ✅ 업종 선택 UI */}
                            <div>
                                <Label className="text-xs mb-2 block">
                                    분석할 업종 <span className="text-red-500">*</span>
                                </Label>

                                <button
                                    onClick={() => setShowAreaIndustryModal(true)}
                                    disabled={isLoading}
                                    className="w-full p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Search className="w-4 h-4 text-gray-400" />
                                            <span className={category ? 'text-gray-800' : 'text-gray-500'}>
                                                {category || '업종을 선택해주세요 (필수)'}
                                            </span>
                                        </div>
                                        <div className="text-gray-400 text-sm">선택</div>
                                    </div>
                                </button>

                                {/* 선택된 업종이 있으면 "선택 해제" 버튼 표시 */}
                                {category && (
                                    <button
                                        onClick={handleClearCategory}
                                        disabled={isLoading}
                                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                                    >
                                        선택 해제
                                    </button>
                                )}

                                {/* 내 추천 업종이 있으면 미리보기 표시 */}
                                {myRecommendationsForModal.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs text-purple-600 mb-1">💡 내 추천 업종이 우선 표시됩니다</p>
                                        <div className="flex gap-1 flex-wrap">
                                            {myRecommendationsForModal.slice(0, 3).map((rec, idx) => (
                                                <span key={rec.industryCode} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                    {rec.industryName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DrawingToolSelector
                                drawingType={drawingType}
                                setDrawingType={setDrawingType}
                                canUseAreaRecommendation={canUseAreaRecommendation}
                            />

                            <AreaLimitsInfo />

                            <DrawingControls
                                canUseAreaRecommendation={canUseAreaRecommendation}
                                isDrawingMode={isDrawingMode}
                                drawingType={drawingType}
                                areaCategory={category}
                            />

                            <AreaInfoDisplay
                                drawnArea={drawnArea}
                                areaInfo={areaInfo}
                                drawingType={drawingType}
                                onClear={clearDrawnArea}
                            />

                            <AnalysisButton
                                drawnArea={drawnArea}
                                areaCategory={category}
                                areaInfo={areaInfo}
                                isAnalyzing={isLoading}
                                onAnalyze={handleStartAnalysis}
                            />
                        </>
                    )}

                    {/* 완전 초기화 */}
                    <div className="pt-2 border-t border-gray-200">
                        <Button
                            onClick={handleCompleteReset}
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-300 text-gray-500 hover:bg-gray-50"
                        >
                            <Settings className="w-3 h-3 mr-1" />
                            전체 초기화
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ✅ 업종 선택 모달 */}
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
