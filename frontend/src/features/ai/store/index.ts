import { create } from 'zustand';
import type { SingleBuildingRecommendationResponse } from '@/features/ai/types';

// 🎯 추천 마커 타입 정의
interface RecommendationMarker {
    id: string;
    lat: number;
    lng: number;
    type: 'recommendation';
    title: string;
    category: string;
    survivalRate: number;
    buildingId: number;
    isAreaResult?: boolean;
}

// 스토어의 상태(State) 타입
interface RecommendState {
    // 3가지 API의 응답 타입이 다르므로, 이를 모두 받을 수 있도록 타입을 정의합니다.
    // getRangeRecommendationAPI는 배열을 반환할 수 있으므로 배열 타입도 추가합니다.
    recommendationResult:
        | SingleBuildingRecommendationResponse
        | SingleBuildingRecommendationResponse[]
        | null;
    isLoading: boolean;
    error: string | null;

    // 🎯 추천 마커들 (지도 표시용)
    recommendationMarkers: RecommendationMarker[];
}

// 스토어의 액션(Actions) 타입
interface RecommendActions {
    startRequest: () => void;
    setRequestSuccess: (
        result:
            | SingleBuildingRecommendationResponse
            | SingleBuildingRecommendationResponse[],
    ) => void;
    setRequestError: (error: string) => void;
    clearResult: () => void;

    // 🎯 추천 마커 관리 액션들
    setRecommendationMarkers: (markers: RecommendationMarker[]) => void;
    addRecommendationMarker: (marker: RecommendationMarker) => void;
    removeRecommendationMarker: (markerId: string) => void;
    clearRecommendationMarkers: () => void;
}

const initialState: RecommendState = {
    recommendationResult: null,
    isLoading: false,
    error: null,
    recommendationMarkers: [], // 🎯 추가
};

// 스토어 생성
export const useRecommendationStore = create<RecommendState & RecommendActions>(
    set => ({
        ...initialState,

        startRequest: () =>
            set({
                isLoading: true,
                error: null,
                recommendationResult: null,
                recommendationMarkers: [] // 🎯 새 요청시 기존 마커 초기화
            }),

        setRequestSuccess: result =>
            set({ isLoading: false, recommendationResult: result }),

        setRequestError: error => set({ isLoading: false, error }),

        clearResult: () => set(initialState),

        // 🎯 추천 마커 관리 액션들
        setRecommendationMarkers: markers => set({ recommendationMarkers: markers }),

        addRecommendationMarker: marker => set(state => ({
            recommendationMarkers: [...state.recommendationMarkers, marker]
        })),

        removeRecommendationMarker: markerId => set(state => ({
            recommendationMarkers: state.recommendationMarkers.filter(marker => marker.id !== markerId)
        })),

        clearRecommendationMarkers: () => set({ recommendationMarkers: [] }),
    }),
);

// 🎯 타입 export (다른 파일에서 사용)
export type { RecommendationMarker };
