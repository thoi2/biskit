'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { FavoritesSection } from '../../features/ai/components/FavoritesSection';
import { StoreListSection } from '../../features/stores/components/StoreListSection';
import { RecommendationListSection } from '../../features/ai/components/RecommendationListSection';

export function ResultPanel() {
    // 🔥 Zustand에서 직접 상태 가져오기
    const { user } = useAuth();

    return (
        <div className="space-y-2">
            {/* 찜 목록 */}
            <FavoritesSection />

            <h3 className="font-semibold text-base text-gray-700 px-1 py-2">
                현재 세션 결과
            </h3>

            {/* 상가 목록 */}
            <StoreListSection />

            {/* AI 추천 목록 */}
            <RecommendationListSection />


            {/* 비로그인 안내 */}
            {!user && (
                <div className="border border-orange-200 rounded-lg bg-orange-50 p-3">
                    <p className="text-xs text-orange-700 text-center">
                        로그인하면 찜 목록을 확인할 수 있습니다
                    </p>
                </div>
            )}
        </div>
    );
}
