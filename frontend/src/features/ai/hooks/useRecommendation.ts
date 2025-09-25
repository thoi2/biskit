import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSingleRecommendationAPI,
  getSingleIndustryRecommendationAPI,
  getRangeRecommendationAPI,
} from '@/features/ai/api';
import { useRecommendationStore } from '@/features/ai/store';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { SingleBuildingRecommendationResponse } from '@/features/ai/types';
import type { ApiResponse } from '@/lib/types/api';
/**
 * AI 추천을 요청하고, 결과를 Zustand 스토어에 저장하는 Mutation Hook
 */
export const useRequestRecommendation = () => {
  const queryClient = useQueryClient();
  const { startRequest, setRequestSuccess, setRequestError } =
    useRecommendationStore();
  const { isLoggedIn } = useAuthStore();

  // ⭐ onSuccess 콜백을 위한 공통 로직
  const handleSuccess = (
    // API 함수의 반환 타입과 일치시킵니다.
    response: ApiResponse<
      | SingleBuildingRecommendationResponse
      | SingleBuildingRecommendationResponse[]
    >,
  ) => {
    // 이제 response 객체 안의 data 속성을 사용합니다.
    setRequestSuccess(response.body);

    if (isLoggedIn) {
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    }
  };

  const commonOptions = {
    onMutate: () => {
      startRequest();
    },
    // ✅ 수정된 onSuccess 콜백을 사용합니다.
    onSuccess: handleSuccess,
    onError: (error: Error) => {
      setRequestError(error.message);
    },
  };

  const singleRecommendation = useMutation({
    mutationFn: getSingleRecommendationAPI, // API 함수를 직접 전달
    ...commonOptions,
  });

  const singleIndustryRecommendation = useMutation({
    mutationFn: getSingleIndustryRecommendationAPI,
    ...commonOptions,
  });

  const rangeRecommendation = useMutation({
    mutationFn: getRangeRecommendationAPI,
    ...commonOptions,
  });

  return {
    singleRecommendation,
    singleIndustryRecommendation,
    rangeRecommendation,
  };
};
