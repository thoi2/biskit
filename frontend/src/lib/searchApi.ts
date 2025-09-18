// lib/api.ts
import apiClient from './apiClient'; // axios 인스턴스라고 가정
import type { Store } from '@/types/store';
import type { ApiResponse, Bounds, InBoundsRequest } from '@/types/api';

/**
 * 지도 경계 내에 있는 매장 목록을 조회하는 API 함수
 * @param bounds - 지도의 남서쪽과 북동쪽 경계 정보
 * @returns {Promise<Store[]>} - 경계 내 매장 목록 배열
 */
export const getStoresInBoundsAPI = async (
  bounds: Bounds,
): Promise<Store[]> => {
  const requestBody: InBoundsRequest = { bounds };

  const response = await apiClient.post<ApiResponse<Store[]>>(
    '/store/in-bounds',
    requestBody,
  );

  // body 필드에 담긴 매장 목록 배열을 반환합니다.
  return response.data.body;
};

/**
 * 지도 경계 내에 있는 매장 목록을 조회하는 API 함수
 * @param location - 지도의 남서쪽과 북동쪽 경계 정보
 * @returns {Promise<Store[]>} - 경계 내 매장 목록 배열
 */
// export const getLocationRecommendAPI = async (
//   location: Location,
// ): Promise<Store[]> => {
//   const requestBody: InBoundsRequest = { bounds };

//   const response = await apiClient.post<ApiResponse<Store[]>>(
//     '/store/in-bounds',
//     requestBody,
//   );

//   // body 필드에 담긴 매장 목록 배열을 반환합니다.
//   return response.data.body;
// };
