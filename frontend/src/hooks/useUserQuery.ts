import { useQuery } from '@tanstack/react-query';
import { checkAuthStatusAPI } from '@/lib/api';
import { useUserStore } from '@/store/userStore';

export const useUserQuery = () => {
  const { isLoggedIn } = useUserStore();

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: checkAuthStatusAPI,
    enabled: isLoggedIn,
    staleTime: Infinity,
    select: (data) => data.user, 
  });
};
