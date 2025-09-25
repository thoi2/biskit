import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteResultAPI,
  deleteResultCategoriesAPI,
  addLikeAPI,
  deleteLikeAPI,
} from '@/features/ai/api';
import type { DeleteCategoriesRequest } from '@/features/ai/types';

export const useRecommendMutations = () => {
  const queryClient = useQueryClient();

  const invalidateRecommendList = () => {
    queryClient.invalidateQueries({ queryKey: ['recommendList'] });
  };

  const deleteResultMutation = useMutation({
    mutationFn: deleteResultAPI,
    onSuccess: () => {
      invalidateRecommendList();
    },
    onError: error => {},
  });

  const addLikeMutation = useMutation({
    mutationFn: addLikeAPI,
    onSuccess: invalidateRecommendList,
  });

  const deleteLikeMutation = useMutation({
    mutationFn: deleteLikeAPI,
    onSuccess: invalidateRecommendList,
  });

  // 🎯 수정: categories 프로퍼티 사용
  const deleteCategoriesMutation = useMutation({
    mutationFn: ({
                   buildingId,
                   data,
                 }: {
      buildingId: number;
      data: DeleteCategoriesRequest;
    }) => {
      // 🎯 data에서 categories 추출 (categoryIds 아님)
      const categoryIds = data.categories || [];
      return deleteResultCategoriesAPI(categoryIds);
    },
    onSuccess: invalidateRecommendList,
  });

  const deleteCategoriesMutationSimple = useMutation({
    mutationFn: (categoryIds: string[]) => deleteResultCategoriesAPI(categoryIds),
    onSuccess: invalidateRecommendList,
  });

  return {
    deleteResultMutation,
    addLikeMutation,
    deleteLikeMutation,
    deleteCategoriesMutation,
    deleteCategoriesMutationSimple,
  };
};
