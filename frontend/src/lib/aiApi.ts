import apiClient from './apiClient';
import type {
  AiApiResponse,
  RangeRecommendationRequest,
  RecommendationItem,
  SingleIndustryRecommendationRequest,
  SingleRecommendationRequest,
} from '@/types/recommendation';

// ---- API 함수들 ----

// 1. 추천 - 좌표 API
// URL: /api/v1/ai/single
// 요청 본문: { "latitude": 37.5665, "longitude": 126.9780 }
export const getSingleRecommendationAPI = async (
  data: SingleRecommendationRequest,
) => {
  const response = await apiClient.post<AiApiResponse<RecommendationItem[]>>(
    '/api/v1/ai/single',
    data,
  );
  return response.data.data;
};

// 2. 추천 - 좌표 + 업종 API
// URL: /api/v1/ai/single-industry
// 요청 본문: { "latitude": 37.5665, "longitude": 126.9780, "industry": "cafe" }
export const getSingleIndustryRecommendationAPI = async (
  data: SingleIndustryRecommendationRequest,
) => {
  const response = await apiClient.post<AiApiResponse<RecommendationItem[]>>(
    '/api/v1/ai/single-industry',
    data,
  );
  return response.data.data;
};

// 3. 추천 - 범위 + 업종 API
// URL: /api/v1/ai/range
// 요청 본문: { "centerLatitude": 37.5665, "centerLongitude": 126.9780, "radiusMeters": 500, "industry": "restaurant" }
export const getRangeRecommendationAPI = async (
  data: RangeRecommendationRequest,
) => {
  const response = await apiClient.post<AiApiResponse<RecommendationItem[]>>(
    '/api/v1/ai/range',
    data,
  );
  return response.data.data;
};
