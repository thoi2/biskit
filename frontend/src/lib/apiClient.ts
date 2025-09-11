// /lib/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore'; // 우리의 authStore를 사용

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api', // 환경 변수 사용
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error("401 Unauthorized. 자동 로그아웃 처리합니다.");
      
      // Zustand 스토어의 logout 액션을 실행
      // 컴포넌트 밖이므로 getState()를 사용
      useAuthStore.getState().logout();
      
      // React Query 캐시도 정리해주면 더 좋습니다.
      // queryClient.removeQueries({ queryKey: ['user', 'profile'] }); 
      // (이 파일에서 queryClient를 직접 다루기보다, logout 액션 내에서 처리하는 것이 더 나은 설계일 수 있습니다.)
      
      // 로그인 페이지로 리디렉션
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;