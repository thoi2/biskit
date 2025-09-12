// /lib/api.ts
import apiClient from './apiClient';
import type { User } from '@/types/index'

// 로그인 API: 이제 실제 POST 요청을 보냅니다.
export const loginAPI = async (userId: string, userPw: string) => {
  const response = await apiClient.post<User>('/auth/login', { userId, userPw });
  return response.data; // 성공 시 응답의 data(유저 정보)를 반환
};

// 로그아웃 API
export const logoutAPI = async () => {
  await apiClient.post('/auth/logout');
};

// 인증 상태 확인 API
export const checkAuthStatusAPI = async () => {
  const response = await apiClient.get('/auth/check');
  return response.data;
};

// 구글 로그인 API: 백엔드로 인증 코드를 전송합니다.
export const googleLoginAPI = async (code: string) => {
  // 백엔드의 구글 로그인 처리 엔드포인트는 /auth/google 이라고 가정
  const response = await apiClient.post('auth/oauth2/google/login', { code });
  return response.data.body; // 성공 시 백엔드가 보내주는 유저 정보를 반환
};