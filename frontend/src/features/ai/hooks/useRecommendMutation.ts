// useRecommendMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteResult, addLike, deleteLike } from '@/features/ai/api';

export const useRecommendMutations = () => {
  const queryClient = useQueryClient();

  const deleteResultMutation = useMutation({
    mutationFn: (buildingId: string) => deleteResult(buildingId),
    onSuccess: (data) => {
      console.log('✅ 삭제 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    },
    onError: (error) => {
      console.error('❌ 삭제 실패:', error);
    }
  });

  const addLikeMutation = useMutation({
    mutationFn: (buildingId: string) => addLike(buildingId),
    onSuccess: (data) => {
      console.log('✅ 좋아요 추가 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    }
  });

  const deleteLikeMutation = useMutation({
    mutationFn: (buildingId: string) => deleteLike(buildingId),
    onSuccess: (data) => {
      console.log('✅ 좋아요 삭제 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['recommendList'] });
    }
  });

  return {
    deleteResultMutation,
    addLikeMutation,
    deleteLikeMutation,
  };
};
