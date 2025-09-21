// components/RecommendationListSection.tsx

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { RecommendationResult } from '@/features/ai/types/recommendation';
import { useMapStore } from '@/features/map/store/mapStore';
import { RecommendationItem } from './RecommendationItem';

interface RecommendationListSectionProps {
    recommendations: RecommendationResult[];
    user: Record<string, any> | null;
    onToggleFavorite: (id: string) => void;
    onToggleHide: (id: string) => void;
    onDelete: (id: string) => void;
}

export function RecommendationListSection({
                                              recommendations,
                                              user,
                                              onToggleFavorite,
                                              onToggleHide,
                                              onDelete,
                                          }: RecommendationListSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        setHighlightedStore,
        setHighlightedRecommendation,
        highlightedRecommendationId,
        activeTab, // 🔥 추가
    } = useMapStore();

    // 🔥 자동 스크롤 (activeTab 체크 추가)
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
                }, isExpanded ? 100 : 400); // 🔥 이미 펼쳐져 있으면 짧게, 아니면 길게
            }
        }
    }, [highlightedRecommendationId, activeTab, isExpanded]); // 🔥 activeTab 의존성 추가

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
                                    onToggleFavorite={onToggleFavorite}
                                    onToggleHide={onToggleHide}
                                    onDelete={onDelete}
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
