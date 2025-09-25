import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSingleRecommendationAPI,
  getSingleIndustryRecommendationAPI,
  getRangeRecommendationAPI,
  deleteResultAPI,
  deleteResultCategoriesAPI,
  addLikeAPI,
  deleteLikeAPI,
} from '@/features/ai/api';
import { useRecommendationStore } from '@/features/ai/store';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { SingleBuildingRecommendationResponse } from '@/features/ai/types';
import type { ApiResponse } from '@/lib/types/api';

export const useRequestRecommendation = () => {
  const queryClient = useQueryClient();
  const { startRequest, setRequestSuccess, setRequestError } =
      useRecommendationStore();
  const { isLoggedIn } = useAuthStore();

  const handleSuccess = (
      response: ApiResponse<
          | SingleBuildingRecommendationResponse
          | SingleBuildingRecommendationResponse[]
      >,
  ) => {
    setRequestSuccess(response.body);

    if (isLoggedIn) {
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    }
  };

  const commonOptions = {
    onMutate: () => {
      startRequest();
    },
    onSuccess: handleSuccess,
    onError: (error: Error) => {
      setRequestError(error.message);
    },
  };

  const singleRecommendation = useMutation({
    mutationFn: getSingleRecommendationAPI,
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

  // 🎯 추가 API들
  const deleteResult = useMutation({
    mutationFn: deleteResultAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    },
  });

  const deleteResultCategories = useMutation({
    mutationFn: deleteResultCategoriesAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    },
  });

  const addLike = useMutation({
    mutationFn: addLikeAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    },
  });

  const deleteLike = useMutation({
    mutationFn: deleteLikeAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    },
  });

  return {
    singleRecommendation,
    singleIndustryRecommendation,
    rangeRecommendation,
    deleteResult,
    deleteResultCategories,
    addLike,
    deleteLike,
  };
};
