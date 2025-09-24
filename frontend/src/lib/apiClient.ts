// /lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1', // 환경 변수 사용
  withCredentials: true,
});

apiClient.interceptors.response.use(
  response => {
    // ApiResponse 구조에서 body 추출
    if (response.data && typeof response.data === 'object' && 'body' in response.data) {
      return { ...response, data: response.data.body };
    }
    return response;
  },
  async error => {
    if (error.response?.status === 401) {
      console.log('401 Unauthorized. API 호출자가 이 에러를 처리해야 합니다.');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
