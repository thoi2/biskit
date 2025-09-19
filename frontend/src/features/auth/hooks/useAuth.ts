import { useAuthStore } from '@/features/auth/store/authStore';
import { useUserQuery } from '@/features/auth/hooks/useUserQuery';

/**
 * 앱 전역에서 사용될 단일 인증 훅.
 * Provider가 필요 없으며, 어떤 컴포넌트에서든 바로 호출하여 사용할 수 있습니다.
 * @returns { user, isLoggedIn, loading, logout }
 */
export const useAuth = () => {
  const { isLoggedIn, logout } = useAuthStore();
  const { data: user, isLoading: loading } = useUserQuery();

  return { user, isLoggedIn, loading, logout };
};
