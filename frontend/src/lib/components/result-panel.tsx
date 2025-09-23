// features/results/components/ResultPanel.tsx

'use client';

import { useRecommendationStore } from '@/features/ai/store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FavoritesSection } from './FavoritesSection';
import { StoreListSection } from '@/features/stores/components/StoreListSection';
import { RecommendationListSection } from '@/features/ai/components/RecommendationListSection';

export function ResultPanel() {
  const { isLoggedIn } = useAuth();
  // ✅ 현재 세션의 AI 결과가 있는지 확인하기 위해 스토어 사용
  const { recommendationResult } = useRecommendationStore();

  return (
    <div className="space-y-2">
      {/* 찜 목록 섹션: 이제 스스로 데이터를 가져옵니다. */}
      <FavoritesSection />

      <h3 className="font-semibold text-base text-gray-700 px-1 py-2">
        현재 세션 결과
      </h3>

      {/* 상가 목록 섹션 */}
      <StoreListSection />

      {/* AI 추천 목록: 결과가 있을 때만 렌더링합니다. */}
      {recommendationResult && <RecommendationListSection />}

      {/* 비로그인 안내 */}
      {!isLoggedIn && (
        <div className="border border-orange-200 rounded-lg bg-orange-50 p-3 mt-2">
          <p className="text-xs text-orange-700 text-center">
            로그인하면 찜 목록을 확인하고 저장할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
