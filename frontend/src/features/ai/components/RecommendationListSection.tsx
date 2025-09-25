'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationStore } from '@/features/ai/store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecommendMutations } from '@/features/ai/hooks/useRecommendMutation';
import { RecommendationItem } from './RecommendationItem';
import { RecommendationEmptyState } from './RecommendationEmptyState';
import { SingleBuildingRecommendationResponse } from '@/features/ai/types';

export function RecommendationListSection() {
    // 🎯 스토어에서 데이터 가져오기
    const { recommendationResult } = useRecommendationStore();
    const {
        setHighlightedStore,
        setHighlightedRecommendation,
        highlightedRecommendationId,
        activeTab,
    } = useMapStore();
    const { user } = useAuth();

    // 🎯 뮤테이션 훅
    const { addLikeMutation, deleteLikeMutation, deleteResultMutation } = useRecommendMutations();

    // 🎯 UI 상태
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 🎯 배열로 변환
    const results = useMemo<SingleBuildingRecommendationResponse[]>(() => {
        if (!recommendationResult) return [];
        return Array.isArray(recommendationResult) ? recommendationResult : [recommendationResult];
    }, [recommendationResult]);

    // 🎯 자동 스크롤
    useEffect(() => {
        if (highlightedRecommendationId && scrollRef.current && activeTab === 'result') {
            const el = scrollRef.current.querySelector(`[data-building-id="${highlightedRecommendationId}"]`);
            if (el) {
                if (!isExpanded) setIsExpanded(true);
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), isExpanded ? 100 : 400);
            }
        }
    }, [highlightedRecommendationId, activeTab, isExpanded]);

    // 🎯 핸들러들
    const handleRecommendationClick = (buildingId: number) => {
        setHighlightedRecommendation(String(buildingId));
        setHighlightedStore(null);
        setTimeout(() => setHighlightedRecommendation(null), 3000);
    };

    const handleToggleFavorite = (buildingId: number, isFavorite: boolean) => {
        if (!user) {
            alert('찜 기능은 로그인이 필요합니다.');
            return;
        }
        if (isFavorite) {
            deleteLikeMutation.mutate(buildingId);
        } else {
            addLikeMutation.mutate(buildingId);
        }
    };

    const handleDelete = (buildingId: number) => {
        if (window.confirm('이 추천 기록을 정말 삭제하시겠습니까?')) {
            deleteResultMutation.mutate(buildingId);
        }
    };

    // 🎯 추천이 없으면 EmptyState만 표시
    if (results.length === 0) {
        return (
            <div className="border rounded-lg bg-white overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-sm text-orange-700">AI 추천</span>
                        <Badge variant="outline" className="text-xs h-5">0개</Badge>
                    </div>
                </div>
                <div className="px-3 pb-3 border-t">
                    <RecommendationEmptyState />
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-orange-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm text-orange-700">AI 추천</span>
                    <Badge variant="outline" className="text-xs h-5">{results.length}개</Badge>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-orange-600 transition-transform duration-200" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-orange-600 transition-transform duration-200" />
                )}
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {isExpanded && (
                    <div className="px-3 pb-3 border-t">
                        <div ref={scrollRef} className="space-y-2 mt-3 max-h-[350px] overflow-y-auto">
                            {results.map(rec => (
                                <RecommendationItem
                                    key={rec.building.building_id}
                                    recommendation={rec}
                                    isHighlighted={String(rec.building.building_id) === highlightedRecommendationId}
                                    user={user}
                                    onToggleFavorite={handleToggleFavorite}
                                    onDelete={handleDelete}
                                    onClick={handleRecommendationClick}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
