import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationStore } from '@/features/ai/store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { RecommendationItem } from './RecommendationItem';
import { RecommendationEmptyState } from './RecommendationEmptyState';

export function RecommendationListSection() {
    const {
        recommendations,
        toggleRecommendationFavorite,
        toggleRecommendationHide,
        deleteRecommendation,
    } = useRecommendationStore();

    const {
        setHighlightedStore,
        setHighlightedRecommendation,
        highlightedRecommendationId,
        activeTab,
    } = useMapStore();

    const { user } = useAuth();

    const [isExpanded, setIsExpanded] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 자동 스크롤
    useEffect(() => {
        if (highlightedRecommendationId && scrollRef.current && activeTab === 'result') {
            const highlightedElement = scrollRef.current.querySelector(`[data-recommendation-id="${highlightedRecommendationId}"]`);
            if (highlightedElement) {
                if (!isExpanded) {
                    setIsExpanded(true);
                }
                setTimeout(() => {
                    highlightedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, isExpanded ? 100 : 400);
            }
        }
    }, [highlightedRecommendationId, activeTab, isExpanded]);

    const handleRecommendationClick = (recommendationId: string) => {
        setHighlightedRecommendation(recommendationId);
        setHighlightedStore(null);
        setTimeout(() => setHighlightedRecommendation(null), 3000);
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-orange-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm text-orange-700">AI 추천</span>
                    <Badge variant="outline" className="text-xs h-5">{recommendations.length}개</Badge>
                    {recommendations.filter(r => r.hidden).length > 0 && (
                        <Badge variant="outline" className="text-xs h-5 bg-gray-100">
                            숨김 {recommendations.filter(r => r.hidden).length}개
                        </Badge>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-orange-600 transition-transform duration-200" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-orange-600 transition-transform duration-200" />
                )}
            </div>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                {isExpanded && (
                    <div className="px-3 pb-3 border-t">
                        {/* 🎯 추천이 있을 때 */}
                        {recommendations.length > 0 ? (
                            <div
                                ref={scrollRef}
                                className="space-y-2 mt-3 max-h-[350px] overflow-y-auto"
                            >
                                {recommendations.map(rec => (
                                    <RecommendationItem
                                        key={`rec-${rec.id}`}
                                        recommendation={rec}
                                        isHighlighted={highlightedRecommendationId === rec.id}
                                        user={user}
                                        onToggleFavorite={toggleRecommendationFavorite}
                                        onToggleHide={toggleRecommendationHide}
                                        onDelete={deleteRecommendation}
                                        onClick={handleRecommendationClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* 🎯 단순한 EmptyState */
                            <RecommendationEmptyState />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
