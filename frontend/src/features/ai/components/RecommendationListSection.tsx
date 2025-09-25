// features/ai/components/RecommendationListSection.tsx

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationStore } from '@/features/ai/store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecommendMutations } from '@/features/ai/hooks/useRecommendMutation'; // ✅ 1. 뮤테이션 훅 가져오기
import { RecommendationItem } from './RecommendationItem';
import { RecommendationEmptyState } from './RecommendationEmptyState';
import { SingleBuildingRecommendationResponse } from '@/features/ai/types';

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
  // --- 스토어 및 훅 상태 가져오기 ---
  const { recommendationResult } = useRecommendationStore(); // ✅ Zustand에서는 순수 세션 결과만 가져옴
  const {
    setHighlightedStore,
    setHighlightedRecommendation,
    highlightedRecommendationId,
    activeTab,
  } = useMapStore();
  const { user } = useAuth();

  // ✅ 2. 서버 데이터 변경을 위한 뮤테이션 함수들 준비
  const { addLikeMutation, deleteLikeMutation, deleteResultMutation } =
    useRecommendMutations();

  // --- UI 상태 관리 ---
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ 3. recommendationResult를 항상 배열로 일관되게 처리
  const results = useMemo<SingleBuildingRecommendationResponse[]>(() => {
    if (!recommendationResult) return [];
    return Array.isArray(recommendationResult)
      ? recommendationResult
      : [recommendationResult];
  }, [recommendationResult]);

  // 자동 스크롤 로직 (기존과 동일)
  useEffect(() => {
    if (
      highlightedRecommendationId &&
      scrollRef.current &&
      activeTab === 'result'
    ) {
      const el = scrollRef.current.querySelector(
        `[data-building-id="${highlightedRecommendationId}"]`,
      );
      if (el) {
        if (!isExpanded) setIsExpanded(true);
        setTimeout(
          () => el.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          isExpanded ? 100 : 400,
        );
      }
    }
  }, [highlightedRecommendationId, activeTab, isExpanded]);

  // --- 핸들러 함수 정의 ---

  const handleRecommendationClick = (buildingId: number) => {
    setHighlightedRecommendation(String(buildingId)); // ID는 문자열일 수 있으므로 변환
    setHighlightedStore(null);
    setTimeout(() => setHighlightedRecommendation(null), 3000);
  };

  // ✅ 4. 찜하기 토글 핸들러 (뮤테이션 사용)
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

  // ✅ 5. 추천 삭제 핸들러 (뮤테이션 사용)
  const handleDelete = (buildingId: number) => {
    if (
      window.confirm(
        '이 추천 기록을 정말 삭제하시겠습니까? 찜 목록에서도 제거됩니다.',
      )
    ) {
      deleteResultMutation.mutate(buildingId);
    }
  };

  if (results.length === 0) {
    return null; // 보여줄 추천이 없으면 렌더링하지 않음
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
          <Badge variant="outline" className="text-xs h-5">
            {results.length}개
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-orange-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-orange-600" />
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
              {results.map(rec => (
                <RecommendationItem
                  key={rec.building.building_id}
                  recommendation={rec}
                  isHighlighted={
                    String(rec.building.building_id) ===
                    highlightedRecommendationId
                  }
                  user={user}
                  onToggleFavorite={handleToggleFavorite} // ✅ 뮤테이션을 호출하는 핸들러 전달
                  onDelete={handleDelete} // ✅ 뮤테이션을 호출하는 핸들러 전달
                  onClick={handleRecommendationClick}
                  // onToggleHide는 클라이언트 상태이므로 Zustand에서 직접 가져오도록 RecommendationItem에서 처리하거나,
                  // 이 컴포넌트에서 Zustand의 toggleHide 액션을 호출하는 핸들러를 만들어 내려보낼 수 있습니다.
                  // 여기서는 삭제하여 단순화했습니다.
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
