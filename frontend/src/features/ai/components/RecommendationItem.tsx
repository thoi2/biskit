import { useState, useEffect } from 'react';
import { Heart, Trash2, MapPin, Target, List, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import type { SingleBuildingRecommendationResponse } from '@/features/ai/types';

interface RecommendationItemProps {
    recommendation: SingleBuildingRecommendationResponse;
    isHighlighted: boolean;
    user: any;
    onToggleFavorite: (buildingId: number, isFavorite: boolean) => void;
    onDelete: (buildingId: number) => void;
    onClick: (buildingId: number) => void;
    onToggleVisibility?: (buildingId: number, isVisible: boolean) => void;
    isVisible?: boolean;
    isFavorite?: boolean;
}

export function RecommendationItem({
                                       recommendation,
                                       isHighlighted,
                                       user,
                                       onToggleFavorite,
                                       onDelete,
                                       onClick,
                                       onToggleVisibility,
                                       isVisible = true,
                                       isFavorite = false
                                   }: RecommendationItemProps) {
    const [showDetails, setShowDetails] = useState(false);

    // 🎯 분석 타입 판별
    const isSingleAnalysis = recommendation.result?.length === 1;
    const mainResult = recommendation.result?.[0];
    const additionalResults = recommendation.result?.slice(1) || [];

    // ✅ 하이라이트될 때 상세보기 자동 열기
    useEffect(() => {
        if (isHighlighted && !isSingleAnalysis && additionalResults.length > 0) {
            console.log('✨ 하이라이트됨 → 상세보기 자동 열기:', recommendation.building.building_id);
            setShowDetails(true);
        }
    }, [isHighlighted, isSingleAnalysis, additionalResults.length, recommendation.building.building_id]);

    // 🎯 생존율 색상 (개별 값용)
    const getSurvivalColor = (rate: number) => {
        if (rate >= 70) return 'text-green-600 bg-green-50 border-green-200';
        if (rate >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-orange-600 bg-orange-50 border-orange-200';
    };

    // ✅ 5개년 생존율 표시 컴포넌트
    const SurvivalRateDisplay = ({ rates, isCompact = false }: { rates: number[], isCompact?: boolean }) => {
        if (!Array.isArray(rates) || rates.length === 0) {
            return <span className="text-gray-400 text-xs">데이터 없음</span>;
        }

        return (
            <div className={`flex items-center gap-1 ${isCompact ? 'flex-wrap' : ''}`}>
                {rates.map((rate, index) => (
                    <div key={index} className={`flex flex-col items-center ${isCompact ? 'min-w-0' : ''}`}>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${getSurvivalColor(rate)} ${
                            isCompact ? 'text-xs px-1 py-0.5' : ''
                        }`}>
                            {rate.toFixed(1)}%
                        </span>
                        <span className={`text-xs text-gray-400 mt-0.5 ${isCompact ? 'text-xs' : ''}`}>
                            {index + 1}년
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // 🎯 데이터 검증
    if (!recommendation?.building?.building_id || !recommendation?.result?.length || !mainResult) {
        return null;
    }

    return (
        <div
            className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-all duration-500 hover:shadow-sm ${
                isHighlighted
                    ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md transform scale-[1.02] ring-2 ring-orange-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            } ${!isVisible ? 'opacity-60' : ''}`}
            onClick={() => onClick(recommendation.building.building_id)}
            data-building-id={recommendation.building.building_id}
        >
            {/* 🎯 컴팩트 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${
                        isHighlighted
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse'
                            : 'bg-gradient-to-r from-orange-400 to-pink-400'
                    }`}>
                        #{recommendation.building.building_id}
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-sm text-gray-800">
                                AI 추천 위치
                                {isHighlighted && (
                                    <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full animate-bounce">
                                        NEW
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{Number(recommendation.building.lat).toFixed(4)}, {Number(recommendation.building.lng).toFixed(4)}</span>
                        </div>
                    </div>
                </div>

                {/* 🎯 액션 버튼들 */}
                <div className="flex items-center gap-0.5">
                    {onToggleVisibility && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleVisibility(recommendation.building.building_id, !isVisible);
                            }}
                            className={`p-1 rounded-md transition-colors ${
                                isVisible
                                    ? 'hover:bg-blue-50 text-gray-600'
                                    : 'hover:bg-gray-50 bg-gray-100 text-gray-400'
                            }`}
                            title={isVisible ? "지도에서 숨기기" : "지도에 표시하기"}
                        >
                            {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                    )}

                    {user && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(recommendation.building.building_id, isFavorite);
                            }}
                            className={`p-1 rounded-md transition-colors ${
                                isFavorite
                                    ? 'text-pink-500 hover:bg-pink-50'
                                    : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                            }`}
                            title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        >
                            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    )}

                    {user && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(recommendation.building.building_id);
                            }}
                            className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="삭제"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* 🎯 메인 결과 (5개년 데이터 표시) */}
            <div className="space-y-2">
                <div className={`p-3 rounded-md transition-all duration-300 ${
                    isHighlighted ? 'bg-orange-100' : 'bg-gray-50'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {isSingleAnalysis ? (
                                <Target className={`w-3 h-3 ${isHighlighted ? 'text-orange-500' : 'text-blue-400'}`} />
                            ) : (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                    isHighlighted
                                        ? 'text-orange-500 bg-orange-200'
                                        : 'text-purple-500 bg-purple-100'
                                }`}>
                                    #1
                                </span>
                            )}
                            <span className="text-sm font-medium text-gray-800">{mainResult.category}</span>
                        </div>
                    </div>

                    {/* ✅ 5개년 생존율 표시 */}
                    <SurvivalRateDisplay rates={mainResult.survivalRate} />
                </div>

                {/* ✅ 상세보기 버튼 */}
                {!isSingleAnalysis && additionalResults.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(!showDetails);
                        }}
                        className={`w-full flex items-center justify-center gap-1 py-1 text-xs transition-colors ${
                            isHighlighted
                                ? 'text-orange-600 hover:text-orange-800'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {showDetails ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                접기
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                +{additionalResults.length}개 더
                            </>
                        )}
                    </button>
                )}

                {/* ✅ 상세 결과 (5개년 데이터 표시) */}
                {showDetails && additionalResults.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-gray-100 animate-slideDown">
                        {additionalResults.map((item: any, index: number) => (
                            <div key={index + 1} className="p-2 bg-white rounded border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1 py-0.5 rounded-full">
                                        #{index + 2}
                                    </span>
                                    <span className="text-xs text-gray-700 font-medium">{item.category}</span>
                                </div>

                                {/* ✅ 상세 결과도 5개년 데이터 표시 (컴팩트 버전) */}
                                <SurvivalRateDisplay rates={item.survivalRate} isCompact={true} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
