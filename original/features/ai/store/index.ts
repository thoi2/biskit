import { create } from 'zustand';
import { RecommendationResult } from '@/features/ai/types/recommendation';

// Recommendation 상태
interface RecommendationState {
    recommendations: RecommendationResult[];
    selectedRecommendation: RecommendationResult | null;
}

// Recommendation 액션
interface RecommendationActions {
    setRecommendations: (recommendations: RecommendationResult[]) => void;
    selectRecommendation: (recommendation: RecommendationResult | null) => void;
    addRecommendation: (recommendation: RecommendationResult) => void;
    updateRecommendation: (id: string, updates: Partial<RecommendationResult>) => void;
    toggleRecommendationFavorite: (id: string) => void;
    toggleRecommendationHide: (id: string) => void;
    deleteRecommendation: (id: string) => void;
    clearRecommendations: () => void;
}

// Recommendation Store
export const useRecommendationStore = create<RecommendationState & RecommendationActions>((set, get) => ({
    // 초기 상태
    recommendations: [],
    selectedRecommendation: null,

    // 액션들
    setRecommendations: (recommendations) => set({ recommendations }),
    selectRecommendation: (recommendation) => set({ selectedRecommendation: recommendation }),

    addRecommendation: (recommendation) => set((state) => ({
        recommendations: [...state.recommendations, recommendation]
    })),

    updateRecommendation: (id, updates) => set((state) => ({
        recommendations: state.recommendations.map(rec =>
            rec.id === id
                ? { ...rec, ...updates }
                : rec
        )
    })),

    toggleRecommendationFavorite: (id) => set((state) => ({
        recommendations: state.recommendations.map(rec =>
            rec.id === id
                ? { ...rec, isFavorite: !rec.isFavorite }
                : rec
        )
    })),

    toggleRecommendationHide: (id) => set((state) => ({
        recommendations: state.recommendations.map(rec =>
            rec.id === id
                ? { ...rec, hidden: !rec.hidden }
                : rec
        )
    })),

    deleteRecommendation: (id) => set((state) => ({
        recommendations: state.recommendations.filter(rec => rec.id !== id),
        // 선택된 추천이 삭제되는 경우 선택 해제
        selectedRecommendation: state.selectedRecommendation?.id === id ? null : state.selectedRecommendation,
    })),

    clearRecommendations: () => set({
        recommendations: [],
        selectedRecommendation: null,
    }),
}));

// 🔥 Recommendation Selector 함수들
export const useRecommendationSelectors = () => {
    const { recommendations } = useRecommendationStore();

    return {
        // 필터링된 추천들 (숨김 제외)
        visibleRecommendations: recommendations.filter(rec => !rec.hidden),

        // 찜한 추천들
        favoriteRecommendations: recommendations.filter(rec => rec.isFavorite),

        // 통계 정보
        recommendationStats: {
            totalRecommendations: recommendations.length,
            hiddenRecommendations: recommendations.filter(r => r.hidden).length,
            favoriteRecommendations: recommendations.filter(r => r.isFavorite).length,
            visibleRecommendations: recommendations.filter(r => !r.hidden).length,
        }
    };
};
