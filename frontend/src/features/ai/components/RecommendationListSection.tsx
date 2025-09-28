"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import { useMapStore } from '@/features/map/store/mapStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecommendMutations } from '@/features/ai/hooks/useRecommendMutation';
import { useUserResults } from '@/features/ai/hooks/useUserResults';

import { BuildingRecommendationItem } from './BuildingRecommendationItem';
import { RecommendationEmptyState } from './RecommendationEmptyState';
import { useRecommendationStore } from '@/features/ai/store';

export function RecommendationListSection() {
    const {
        buildings,
        mergeWithBackendResults,
        updateBuildingFavorite,
        deleteBuilding,
        deleteCategoryFromBuilding,
        toggleBuildingVisibility,
        moveBuildingToTop
    } = useRecommendationStore();

    const {
        setHighlightedStore,
        setHighlightedRecommendation,
        highlightedRecommendationId,
        activeTab,
    } = useMapStore();

    const { user } = useAuth();
    const { addLikeMutation, deleteLikeMutation, deleteResultMutation } = useRecommendMutations();
    const { data: userResults, isLoading: isLoadingUserData, refetch: refetchUserData } = useUserResults();

    // UI 상태
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // DB 데이터 동기화
    useEffect(() => {
        if (userResults?.body?.items && user) {
            console.log('🔄 [RecommendationListSection] DB 결과 로드:', userResults.body.items.length);
            mergeWithBackendResults(userResults.body.items);
        }
    }, [userResults, user, mergeWithBackendResults]);

    // ✅ 하이라이트된 건물로 스크롤 (개선)
    useEffect(() => {
        if (highlightedRecommendationId && scrollRef.current && activeTab === 'result') {
            const el = scrollRef.current.querySelector(`[data-building-id="${highlightedRecommendationId}"]`);
            if (el) {
                if (!isExpanded) {
                    setIsExpanded(true);
                }
                setTimeout(() => {
                    const container = scrollRef.current;
                    const elementRect = el.getBoundingClientRect();
                    const containerRect = container!.getBoundingClientRect();

                    const scrollTop = container!.scrollTop + elementRect.top - containerRect.top - 20;

                    container!.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    });
                }, isExpanded ? 100 : 400);
            }
        }
    }, [highlightedRecommendationId, activeTab, isExpanded]);

    // 핸들러들
    const handleBuildingClick = (buildingId: number) => {
        const currentHighlighted = highlightedRecommendationId;
        const newId = String(buildingId);

        if (currentHighlighted === newId) {
            setHighlightedRecommendation(null);
            setHighlightedStore(null);
        } else {
            setHighlightedRecommendation(newId);
            setHighlightedStore(null);
        }
    };

    const handleToggleFavorite = (buildingId: number, isFavorite: boolean) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (isFavorite) {
            deleteLikeMutation.mutate(buildingId.toString(), {
                onSuccess: () => {
                    updateBuildingFavorite(buildingId, false);
                }
            });
        } else {
            addLikeMutation.mutate(buildingId.toString(), {
                onSuccess: () => {
                    updateBuildingFavorite(buildingId, true);
                }
            });
        }
    };

    const handleBuildingDelete = (buildingId: number) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (window.confirm('이 건물의 모든 추천을 삭제하시겠습니까?')) {
            deleteResultMutation.mutate(buildingId.toString(), {
                onSuccess: () => {
                    deleteBuilding(buildingId);
                    refetchUserData();
                }
            });
        }
    };

    const handleCategoryDelete = (buildingId: number, categoryId: number) => {
        if (!user) return;

        if (window.confirm('이 업종만 삭제하시겠습니까?')) {
            deleteCategoryFromBuilding(buildingId, categoryId);
        }
    };

    const handleToggleVisibility = (buildingId: number, isVisible: boolean) => {
        toggleBuildingVisibility(buildingId);
    };

    const handleRefresh = () => {
        if (user) {
            refetchUserData();
        }
    };

    // ✅ 시간 기준 통계 계산
    const statistics = useMemo(() => {
        const now = Date.now();
        const RECENT_THRESHOLD = 300000; // 5분

        const recentSingle = buildings.filter(b =>
            b.source === 'single' && b.timestamp && (now - b.timestamp) < RECENT_THRESHOLD
        ).length;

        const recentRange = buildings.filter(b =>
            b.source === 'range' && b.timestamp && (now - b.timestamp) < RECENT_THRESHOLD
        ).length;

        const savedCount = buildings.filter(b =>
            b.source === 'db' || !b.timestamp || (now - b.timestamp) >= RECENT_THRESHOLD
        ).length;

        const totalCategories = buildings.reduce((sum, b) => sum + b.categories.length, 0);

        return { recentSingle, recentRange, savedCount, totalCategories };
    }, [buildings]);

    // EmptyState
    if (buildings.length === 0 && !isLoadingUserData) {
        return (
            <div className="border rounded-lg bg-white overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-sm text-orange-700">AI 추천</span>
                        <Badge variant="outline" className="text-xs h-5">0</Badge>
                    </div>
                    {user && (
                        <button onClick={handleRefresh} className="p-1 rounded hover:bg-gray-100" title="새로고침">
                            <RefreshCw className="w-3 h-3 text-gray-500" />
                        </button>
                    )}
                </div>
                <div className="px-3 pb-3 border-t">
                    <RecommendationEmptyState />
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-orange-50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm text-orange-700">AI 추천</span>
                    <Badge variant="outline" className="text-xs h-5">{buildings.length}</Badge>

                    {/* ✅ 시간 기준 소스별 뱃지 */}
                    {statistics.recentSingle > 0 && (
                        <Badge variant="outline" className="text-xs h-5 bg-blue-50 text-blue-600">
                            단일 {statistics.recentSingle}
                        </Badge>
                    )}
                    {statistics.recentRange > 0 && (
                        <Badge variant="outline" className="text-xs h-5 bg-green-50 text-green-600">
                            범위 {statistics.recentRange}
                        </Badge>
                    )}
                    {statistics.savedCount > 0 && (
                        <Badge variant="outline" className="text-xs h-5 bg-purple-50 text-purple-600">
                            저장됨 {statistics.savedCount}
                        </Badge>
                    )}

                    <Badge variant="outline" className="text-xs h-5 bg-gray-50 text-gray-600">
                        {statistics.totalCategories}개 업종
                    </Badge>

                    {isLoadingUserData && (
                        <div className="w-3 h-3 border border-orange-300 border-t-transparent rounded-full animate-spin"></div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {user && (
                        <button onClick={(e) => { e.stopPropagation(); handleRefresh(); }} className="p-1 rounded hover:bg-orange-100" title="새로고침">
                            <RefreshCw className="w-3 h-3 text-orange-600" />
                        </button>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-orange-600 transition-transform duration-200" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-orange-600 transition-transform duration-200" />
                    )}
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {isExpanded && (
                    <div className="px-2 pb-2 border-t">
                        <div ref={scrollRef} className="space-y-2 mt-2 max-h-[550px] overflow-y-auto">

                            {buildings.map((building) => (
                                <BuildingRecommendationItem
                                    key={building.building.building_id}
                                    building={building.building}
                                    categories={building.categories}
                                    source={building.source} // ✅ source 전달
                                    isFavorite={building.isFavorite || false}
                                    isHighlighted={String(building.building.building_id) === highlightedRecommendationId}
                                    isVisible={building.isVisible || false}
                                    user={user}
                                    onToggleFavorite={handleToggleFavorite}
                                    onDelete={handleBuildingDelete}
                                    onCategoryDelete={handleCategoryDelete}
                                    onClick={handleBuildingClick}
                                    onToggleVisibility={handleToggleVisibility}
                                    onMoveToTop={moveBuildingToTop}
                                />
                            ))}

                        </div>

                        {!user && buildings.length > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                로그인하면 더 많은 기능을 사용할 수 있습니다.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
