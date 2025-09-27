import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';
import { checkAuthStatusAPI } from '@/features/auth/api/authApi';

interface AuthState {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => {
    set({ isLoggedIn: false });
    queryClient.removeQueries({ queryKey: ['user', 'profile'] });
  },
  initialize: async () => {
    console.log(get().isLoggedIn);
    if (get().isLoggedIn) return;
    console.log('test');
    try {
      const user = await checkAuthStatusAPI();
      console.log('AuthCheck API Response:', user);
      if (user && user.user) {
        set({ isLoggedIn: true });
        queryClient.setQueryData(['user', 'profile'], user);
      }
    } catch (error) {
      console.log('Initialization failed: User is not logged in. Logging out.');
    }
  },
}));

// 앱이 로드될 때 인증 초기화 함수를 즉시 호출합니다.
useAuthStore.getState().initialize();
