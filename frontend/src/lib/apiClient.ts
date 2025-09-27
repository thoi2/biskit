// /lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1', // 환경 변수 사용
  withCredentials: true,
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 요청이 아닐 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그 설정

      try {
        // 토큰 갱신 API 호출 (쿠키에 있는 리프레시 토큰이 자동으로 사용됨)
        await apiClient.post('/oauth2/refresh');

        // 원래 요청을 새로운 토큰으로 재시도
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그인 페이지로 리디렉션 또는 로그아웃 처리
        console.error('Token refresh failed:', refreshError);
        // TODO: useAuth 훅을 사용할 수 없으므로, 전역 상태나 다른 방식으로 로그아웃 처리 필요
        // 예: window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
