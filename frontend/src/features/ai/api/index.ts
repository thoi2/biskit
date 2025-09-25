import apiClient from '@/lib/apiClient';
import type { ApiResponse } from '@/lib/types/api';
import type {
  RecommendRequest,
  SingleBuildingRecommendationResponse,
  RecommendCategoryRequest,
  PolygonCategoryRequest,
  BuildingListResponse,
  DeleteCategoriesRequest,
} from '@/features/ai/types';

// ---- AI 분석 API ----

/**
 * 1. 추천 - 단일 위치
 * URL: /api/v1/ai/single
 * 요청 본문: { "lat": 37.5665, "lng": 126.9780 }
 */
export const getSingleRecommendationAPI = async (data: RecommendRequest) => {
  const response = await apiClient.post<
    ApiResponse<SingleBuildingRecommendationResponse>
  >('/ai/single', data);
  return response.data;
};

/**
 * 2. 추천 - 단일 위치 + 업종
 * URL: /api/v1/ai/single-industry
 * 요청 본문: { "lat": 37.5665, "lng": 126.9780, "industry": "restaurant" }
 */
export const getSingleIndustryRecommendationAPI = async (
  data: RecommendCategoryRequest,
) => {
  const response = await apiClient.post<
    ApiResponse<SingleBuildingRecommendationResponse>
  >('/ai/single-industry', data);
  return response.data;
};

/**
 * 3. 추천 - 범위 + 업종
 * URL: /api/v1/ai/range
 * 요청 본문: { "centerLatitude": 37.5665, "centerLongitude": 126.9780, "radiusMeters": 500, "industry": "restaurant" }
 */
export const getRangeRecommendationAPI = async (
  data: PolygonCategoryRequest,
) => {
  const response = await apiClient.post<
    ApiResponse<SingleBuildingRecommendationResponse[]>
  >('/ai/range', data);
  return response.data;
};

// ---- 분석 결과 관리 API ----

/**
 * 4. 모든 분석 결과 조회
 * URL: GET /api/v1/result
 */
export const getResultsAPI = async () => {
  const response = await apiClient.get<ApiResponse<BuildingListResponse[]>>(
    '/result',
  );
  return response.data;
};

/**
 * 5. 특정 건물 분석 결과 삭제
 * URL: DELETE /api/v1/result/{building_id}
 */
export const deleteResultAPI = async (buildingId: number) => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/result/${buildingId}`,
  );
  return response.data;
};

/**
 * 6. 특정 건물 카테고리 삭제
 * URL: DELETE /api/v1/result/{building_id}/categories
 * 요청 본문: { "categories": ["cafe", "restaurant"] }
 */
export const deleteResultCategoriesAPI = async (
  buildingId: number | string,
  data: DeleteCategoriesRequest,
) => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/result/${buildingId}/categories`,
    { data }, // data 객체가 이미 { categories: [...] } 형태이므로 바로 사용
  );
  return response.data;
};

// ---- 좋아요(찜) API ----

/**
 * 7. 특정 건물 좋아요(찜) 추가
 * URL: POST /api/v1/like/{building_id}
 */
export const addLikeAPI = async (buildingId: number) => {
  const response = await apiClient.post<ApiResponse<any>>(
    `/like/${buildingId}`,
  );
  return response.data;
};

/**
 * 8. 특정 건물 좋아요(찜) 삭제
 * URL: DELETE /api/v1/like/{building_id}
 */
export const deleteLikeAPI = async (buildingId: number) => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/like/${buildingId}`,
  );
  return response.data;
};
