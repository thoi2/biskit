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
    select: data => {
      if (!data?.user) return null;
      const { user } = data;
      // 백엔드의 DTO 비일관성 대응: name을 username으로 통일
      return {
        ...user,
        username: user.username || user.name,
      };
    },
  });
};
