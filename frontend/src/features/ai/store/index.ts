import { create } from 'zustand';
import type { SingleBuildingRecommendationResponse } from '@/features/ai/types';

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
}

const initialState: RecommendState = {
  recommendationResult: null,
  isLoading: false,
  error: null,
};

// 스토어 생성
export const useRecommendationStore = create<RecommendState & RecommendActions>(
  set => ({
    ...initialState,
    startRequest: () =>
      set({ isLoading: true, error: null, recommendationResult: null }),
    setRequestSuccess: result =>
      set({ isLoading: false, recommendationResult: result }),
    setRequestError: error => set({ isLoading: false, error }),
    clearResult: () => set(initialState),
  }),
);
