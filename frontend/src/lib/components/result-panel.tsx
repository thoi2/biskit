// ResultPanel.tsx - 최종 간소화 버전

'use client';

import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/features/ai/types/recommendation';
import { useMapStore } from '@/features/map/store/mapStore';
import { FavoritesSection } from './FavoritesSection';
import { StoreListSection } from './StoreListSection';
import { RecommendationListSection } from './RecommendationListSection';

interface ResultPanelProps {
    user: Record<string, any> | null;
    stores?: Store[];
    recommendationResults?: RecommendationResult[];
    onToggleHideStore: (id: number) => void;
    onDeleteStore: (id: number) => void;
    onToggleRecommendationFavorite: (id: string) => void;
    onToggleHideRecommendation: (id: string) => void;
    onDeleteRecommendation: (id: string) => void;
}

export function ResultPanel({
                                user,
                                stores = [],
                                recommendationResults = [],
                                onToggleHideStore,
                                onDeleteStore,
                                onToggleRecommendationFavorite,
                                onToggleHideRecommendation,
                                onDeleteRecommendation,
                            }: ResultPanelProps) {
    const { selectedCategories } = useMapStore();

    return (
        <div className="space-y-2">
            {/* 찜 목록 */}
            <FavoritesSection user={user} />

            <h3 className="font-semibold text-base text-gray-700 px-1 py-2">
                현재 세션 결과
            </h3>

            {/* 상가 목록 */}
            <StoreListSection
                stores={stores}
                selectedCategories={selectedCategories}
                onToggleHideStore={onToggleHideStore}
                onDeleteStore={onDeleteStore}
            />

            {/* AI 추천 목록 */}
            {recommendationResults.length > 0 && (
                <RecommendationListSection
                    recommendations={recommendationResults}
                    user={user}
                    onToggleFavorite={onToggleRecommendationFavorite}
                    onToggleHide={onToggleHideRecommendation}
                    onDelete={onDeleteRecommendation}
                />
            )}

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
