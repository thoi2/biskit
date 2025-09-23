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

  const deleteCategoriesMutation = useMutation({
    mutationFn: ({
      buildingId,
      data,
    }: {
      buildingId: number;
      data: DeleteCategoriesRequest;
    }) => deleteResultCategoriesAPI(buildingId, data),
    onSuccess: invalidateRecommendList,
  });

  return {
    deleteResultMutation,
    addLikeMutation,
    deleteLikeMutation,
    deleteCategoriesMutation,
  };
};
