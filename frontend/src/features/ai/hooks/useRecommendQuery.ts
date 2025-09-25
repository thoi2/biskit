import { useQuery } from '@tanstack/react-query';
import { getResultsAPI } from '@/features/ai/api';
import { useAuthStore } from '@/features/auth/store/authStore';

export const useRecommendQuery = () => {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['recommendList'],
    queryFn: getResultsAPI,
    enabled: isLoggedIn,
  });
};
