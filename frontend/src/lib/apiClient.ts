// /lib/apiClient.ts
import axios from 'axios';
import { logoutAPI } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/authStore';

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await apiClient.post('/oauth2/refresh');
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed. Logging out and retrying as unauthenticated.', refreshError);
        
        try {
          // 서버 세션과 쿠키를 먼저 정리
          await logoutAPI(); 
        } catch (logoutError) {
          console.error('Logout API call failed while handling token refresh error:', logoutError);
        } finally {
          // 클라이언트 상태를 로그아웃으로 변경
          useAuthStore.getState().logout();
        }

        // 비로그인 상태로 원래 요청 다시 시도
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
