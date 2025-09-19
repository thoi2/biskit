import { useQuery } from '@tanstack/react-query';
import { checkAuthStatusAPI } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/authStore';

export const useUserQuery = () => {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: checkAuthStatusAPI,
    enabled: isLoggedIn,
    staleTime: Infinity,
    select: data => data.user,
  });
};
