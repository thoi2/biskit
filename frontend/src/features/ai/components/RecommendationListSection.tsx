"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import { useMapStore } from '@/features/map/store/mapStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecommendMutations } from '@/features/ai/hooks/useRecommendMutation';
import { useUserResults } from '@/features/ai/hooks/useUserResults';

import {RecommendationItem} from './RecommendationItem';
import {RecommendationEmptyState} from './RecommendationEmptyState';
import { useRecommendationStore, SingleBuildingRecommendationResponse } from '@/features/ai/store';

// ✅ 확장된 타입 정의 - isVisible 속성 추가
interface ExtendedRecommendationResponse extends SingleBuildingRecommendationResponse {
    isVisible: boolean;
}

export function RecommendationListSection() {
    const {
        recommendationResults,
        recommendationMarkers,
        mergeWithCurrentResults,
        toggleRecommendationVisibility
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
    const [favoriteState, setFavoriteState] = useState<Record<number, boolean>>({});
    const scrollRef = useRef<HTMLDivElement>(null);

    // DB 데이터 동기화 (백엔드 결과를 AI 스토어로 변환)
    useEffect(() => {
        if (userResults?.body?.items && user) {
            console.log('🔄 [RecommendationListSection] DB 결과 로드:', userResults.body.items.length);

            // ✅ 백엔드 데이터 변환 - 타입 에러 해결
            const backendResults = (userResults.body.items as any[])
                .filter((item: any) => item?.buildingId && item?.lat && item?.lng && item?.categories?.length > 0)
                .map((item: any) => ({
                    building: {
                        building_id: item.buildingId,
                        lat: parseFloat(String(item.lat)), // ✅ String() 변환 후 parseFloat
                        lng: parseFloat(String(item.lng))  // ✅ String() 변환 후 parseFloat
                    },
                    result: item.categories.map((cat: any) => ({
                        category: cat.category,
                        survivalRate: cat.survivalRate
                    })),
                    meta: {
                        source: 'DB',
                        version: 'v1',
                        last_at: new Date().toISOString() // ✅ last_at으로 수정
                    }
                })) as SingleBuildingRecommendationResponse[]; // ✅ 마지막에 타입 캐스팅

            console.log('✅ [RecommendationListSection] 변환 완료:', {
                originalCount: userResults.body.items.length,
                convertedCount: backendResults.length,
                samples: backendResults.slice(0, 2).map(r => ({
                    buildingId: r.building.building_id,
                    lat: r.building.lat,
                    lng: r.building.lng,
                    categories: r.result.length
                }))
            });

            if (backendResults.length > 0) {
                mergeWithCurrentResults(backendResults);
            }
        }
    }, [userResults, user, mergeWithCurrentResults]);

    // 좋아요 상태 초기화
    useEffect(() => {
        if (userResults?.body?.items) {
            const initialFavorites: Record<number, boolean> = {};
            (userResults.body.items as any[]).forEach((item: any) => {
                if (item?.buildingId && item?.favorite) {
                    initialFavorites[item.buildingId] = true;
                }
            });
            setFavoriteState(initialFavorites);
        }
    }, [userResults]);

    // 하이라이트된 추천으로 스크롤
    useEffect(() => {
        if (highlightedRecommendationId && scrollRef.current && activeTab === 'result') {
            const el = scrollRef.current.querySelector(`[data-building-id="${highlightedRecommendationId}"]`);
            if (el) {
                if (!isExpanded) {
                    setIsExpanded(true);
                }
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, isExpanded ? 100 : 400);
            }
        }
    }, [highlightedRecommendationId, activeTab, isExpanded]);

    // 핸들러들
    // 통합 하이라이트를 사용한 클릭 핸들러
    // 기존 handleRecommendationClick 복구
    const handleRecommendationClick = (buildingId: number) => {
        console.log('🎯 [RecommendationListSection] handleRecommendationClick:', buildingId);

        const currentHighlighted = highlightedRecommendationId;
        const newId = String(buildingId);

        if (currentHighlighted === newId) {
            // 토글: 같은 추천 클릭 시 해제
            setHighlightedRecommendation(null);
            setHighlightedStore(null);
        } else {
            // 새로운 추천 설정
            setHighlightedRecommendation(newId);
            setHighlightedStore(null);
        }
    };


    const handleToggleVisibility = (buildingId: number, isVisible: boolean) => {
        console.log('🔄 [RecommendationListSection] handleToggleVisibility:', {
            buildingId,
            currentVisible: isVisible,
            willToggle: !isVisible
        });

        // AI 스토어만 업데이트
        toggleRecommendationVisibility(buildingId);
    };

    const handleToggleFavorite = (buildingId: number, isFavorite: boolean) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (isFavorite) {
            deleteLikeMutation.mutate(buildingId.toString(), { // ✅ toString() 사용
                onSuccess: (data) => {
                    console.log('좋아요 삭제 성공:', data);
                    setFavoriteState(prev => ({ ...prev, [buildingId]: false }));
                }
            });
        } else {
            addLikeMutation.mutate(buildingId.toString(), { // ✅ toString() 사용
                onSuccess: (data) => {
                    console.log('좋아요 추가 성공:', data);
                    setFavoriteState(prev => ({ ...prev, [buildingId]: true }));
                }
            });
        }
    };

    const handleDelete = (buildingId: number) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (window.confirm('이 추천을 삭제하시겠습니까?')) {
            deleteResultMutation.mutate(buildingId.toString(), { // ✅ toString() 사용
                onSuccess: (data) => {
                    console.log('삭제 성공:', data);
                    const { deleteRecommendation } = useRecommendationStore.getState();
                    deleteRecommendation(buildingId);
                    refetchUserData();
                }
            });
        }
    };

    const handleRefresh = () => {
        if (user) {
            refetchUserData();
        }
    };

    // ✅ 마커 상태를 반영한 displayResults - 타입 안전하게 처리
    const displayResults = useMemo((): ExtendedRecommendationResponse[] => {
        console.log('📊 [RecommendationListSection] 표시할 결과:', recommendationResults.length);
        return recommendationResults
            .filter((rec: SingleBuildingRecommendationResponse) => rec?.building?.building_id)
            .map(rec => {
                const marker = recommendationMarkers.find(m => m.buildingId === rec.building.building_id);

                return {
                    ...rec,
                    isVisible: !marker?.hidden // 마커의 hidden 상태 반영
                } as ExtendedRecommendationResponse;
            });
    }, [recommendationResults, recommendationMarkers]); // ✅ recommendationMarkers 의존성 추가

    // EmptyState
    if (displayResults.length === 0 && !isLoadingUserData) {
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
                    <Badge variant="outline" className="text-xs h-5">{displayResults.length}</Badge>
                    {user && (
                        <Badge variant="outline" className="text-xs h-5 bg-purple-50 text-purple-600">백엔드</Badge>
                    )}
                    {!user && displayResults.length > 0 && (
                        <Badge variant="outline" className="text-xs h-5 bg-yellow-50 text-yellow-600">로컬</Badge>
                    )}
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

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {isExpanded && (
                    <div className="px-2 pb-2 border-t">
                        <div ref={scrollRef} className="space-y-1 mt-2 max-h-[350px] overflow-y-auto">
                            {displayResults.map((rec: ExtendedRecommendationResponse) => {
                                if (!rec?.building?.building_id) {
                                    console.warn('⚠️ [RecommendationListSection] 잘못된 추천 데이터:', rec);
                                    return null;
                                }

                                console.log('🎯 [RecommendationItem 렌더링]', {
                                    buildingId: rec.building.building_id,
                                    isVisible: rec.isVisible,
                                    isFavorite: favoriteState[rec.building.building_id] ?? false
                                });

                                return (
                                    <RecommendationItem
                                        key={rec.building.building_id}
                                        recommendation={rec}
                                        isHighlighted={String(rec.building.building_id) === highlightedRecommendationId}
                                        user={user}
                                        onToggleFavorite={handleToggleFavorite}
                                        onDelete={handleDelete}
                                        onClick={handleRecommendationClick}
                                        onToggleVisibility={handleToggleVisibility}
                                        isVisible={rec.isVisible} // ✅ 타입 안전하게 사용
                                        isFavorite={favoriteState[rec.building.building_id] ?? false}
                                    />
                                );
                            }).filter(Boolean)}
                        </div>
                        {!user && displayResults.length > 0 && (
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
