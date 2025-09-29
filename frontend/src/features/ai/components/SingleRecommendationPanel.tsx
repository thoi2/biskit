'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Label } from '@/lib/components/ui/label';
import { Target, Search, MapPin, Zap } from 'lucide-react';
import { useRecommendationForm } from '../hooks/useRecommendationForm';
import { useMapStore } from '@/features/map/store/mapStore';
import { useIndustryStore } from '@/features/survey/store/industryStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import IndustrySelectModal from '@/features/survey/components/IndustrySelectModal';
import storeCategories from '@/lib/data/store_categories.json';

interface CategoryData {
    상권업종대분류코드: string;
    상권업종대분류명: string;
    상권업종중분류코드: string;
    상권업종중분류명: string;
    상권업종소분류코드: string;
    상권업종소분류명: string;
}

export function SingleRecommendationPanel() {
    const { category, setCategory, isLoading, handleSubmit } = useRecommendationForm();
    const { coordinates, setCoordinates, activeTab } = useMapStore();
    const { userIndustries, fetchUserIndustries } = useIndustryStore();
    const { user } = useAuth();

    const [showIndustryModal, setShowIndustryModal] = useState(false);

    // 사용자 업종 정보 로드
    useEffect(() => {
        if (user) {
            fetchUserIndustries();
        }
    }, [user, fetchUserIndustries]);

    // 내 추천 업종을 AI 추천 형식으로 변환
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

    // 업종 선택 처리
    const handleIndustrySelect = (categoryData: CategoryData) => {
        setCategory(categoryData.상권업종소분류명);
        setShowIndustryModal(false);
    };

    // 선택 해제 처리
    const handleClearCategory = () => {
        setCategory('');
    };

    // 분석 실행
    const handleAnalysisSubmit = async () => {
        if (activeTab !== 'recommend') {
            alert('업종 탭에서만 분석을 실행할 수 있습니다.');
            return;
        }

        // 지도에 분석 위치 표시
        if (coordinates.lat && coordinates.lng) {
            setCoordinates({ ...coordinates });
        }

        // 실제 분석 실행
        await handleSubmit();
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        단일 좌표 분석
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 위도/경도 표시 */}
                    <div>
                        <Label className="text-xs flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3" />
                            현재 위치
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <div className="text-xs text-gray-500 mb-1">위도</div>
                                <div className="text-sm font-mono text-gray-800">
                                    {coordinates.lat?.toFixed(6) || '37.566500'}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <div className="text-xs text-gray-500 mb-1">경도</div>
                                <div className="text-sm font-mono text-gray-800">
                                    {coordinates.lng?.toFixed(6) || '126.978000'}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            지도를 클릭하여 분석할 위치를 선택하세요
                        </p>
                    </div>

                    {/* 업종 선택 */}
                    <div>
                        <Label className="text-xs mb-2 block">
                            분석할 업종 <span className="text-gray-400">(선택 사항)</span>
                        </Label>
                        <button
                            onClick={() => setShowIndustryModal(true)}
                            disabled={isLoading}
                            className="w-full p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-gray-400" />
                                    <span className={category ? 'text-gray-800' : 'text-gray-500'}>
                                        {category || '전체 업종 (업종을 지정하려면 클릭)'}
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
                                선택 해제 (전체 업종으로 분석)
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

                    {/* 분석 실행 버튼 */}
                    <Button
                        onClick={handleAnalysisSubmit}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                        disabled={isLoading || (!coordinates.lat || !coordinates.lng) || activeTab !== 'recommend'}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Zap className="w-5 h-5" />
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    AI 분석 중...
                                </>
                            ) : (
                                'AI 분석 실행'
                            )}
                        </div>
                    </Button>

                    {/* 버튼 비활성화 안내 */}
                    {(!coordinates.lat || !coordinates.lng) && (
                        <p className="text-xs text-red-500 text-center">
                            ⚠️ 지도에서 분석할 위치를 클릭해주세요
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* 업종 선택 모달 */}
            <IndustrySelectModal
                isOpen={showIndustryModal}
                onClose={() => setShowIndustryModal(false)}
                onSelect={handleIndustrySelect}
                title="분석할 업종 선택"
                aiRecommendations={myRecommendationsForModal}
            />
        </>
    );
}
