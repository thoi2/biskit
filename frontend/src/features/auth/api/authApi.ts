// /lib/api.ts
import apiClient from '@/lib/apiClient';

// 로그아웃 API
export const logoutAPI = async () => {
  await apiClient.post('/auth/oauth2/logout');
};

// 인증 상태 확인 API
export const checkAuthStatusAPI = async () => {
  const response = await apiClient.get('/auth/check');
  return response.data.body;
};

// 구글 로그인 API: 백엔드로 인증 코드를 전송합니다.
export const googleLoginAPI = async (code: string) => {
  // 백엔드의 구글 로그인 처리 엔드포인트는 /auth/google 이라고 가정
  const response = await apiClient.post('/auth/oauth2/google/login', { code });
  return response.data.body; // 성공 시 백엔드가 보내주는 유저 정보를 반환
};

// preperence 업데이트 필요
// export const userUpdateAPI = async (userId: number, preperence: Preperence) => {
//   const response = await apiClient.put(`user/update/${userId}}`, {
//     preperence,
//   });
//   return response.data.body; // 성공 시 백엔드가 보내주는 유저 정보를 반환
// };

// 구글 로그인 API: 백엔드로 인증 코드를 전송합니다.
export const userDeleteAPI = async (userId: number) => {
  // 백엔드의 구글 로그인 처리 엔드포인트는 /auth/google 이라고 가정
  await apiClient.delete(`/user/delete/${userId}`);
};
