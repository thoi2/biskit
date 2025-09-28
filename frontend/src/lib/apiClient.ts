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

    // 401 에러이고, 재시도한 요청이 아니며, 리프레시 요청도 아닐 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === 'auth/oauth2/refresh') {
        return Promise.reject(error);
      }

      originalRequest._retry = true; // 재시도 플래그 설정

      try {
        // 토큰 갱신 API 호출
        await apiClient.post('auth/oauth2/refresh');
        // 원래 요청을 새로운 토큰으로 재시도
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시, 로그아웃 처리 후 비로그인 상태로 원래 요청 재시도
        console.error(
          'Token refresh failed, attempting request as unauthenticated user.',
          refreshError,
        );

        try {
          // 서버 세션과 쿠키를 먼저 정리
          await logoutAPI();
        } catch (logoutError) {
          console.error(
            'Logout API call failed while handling token refresh error:',
            logoutError,
          );
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
