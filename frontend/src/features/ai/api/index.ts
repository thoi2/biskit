import apiClient from '@/lib/apiClient';

// ===== 타입 정의 =====
interface SingleRequest {
  lat: number;
  lng: number;
}

interface SingleIndustryRequest {
  lat: number;
  lng: number;
  categoryName: string;
}

interface RecommendResponse {
  building: {
    building_id: number;
    lat: number;
    lng: number;
  };
  result: Array<{
    category: string;
    survivalRate: number;
  }>;
  meta: {
    source: string;
    version: string;
    last_at: string;
  };
}

// ===== 헬퍼 함수 =====
const wrapApiResponse = (data: any) => ({
  success: true,
  status: 200,
  timestamp: new Date().toISOString(),
  body: data
});

// ===== 새로 추가된 분석 API (단순 버전) =====
export const getSingleRecommendation = async (request: SingleRequest) => {
  const response = await apiClient.post('/ai/single', request);
  return response.data;
};

export const getSingleIndustryRecommendation = async (request: SingleIndustryRequest) => {
  const response = await apiClient.post('/ai/single-industry', request);
  return response.data;
};

// ===== 기존 API 함수들 (ApiResponse 래퍼 버전) =====
export const getSingleRecommendationAPI = async (request: any) => {
  const response = await apiClient.post('/ai/single', request);
  return wrapApiResponse(response.data);
};

export const getSingleIndustryRecommendationAPI = async (request: any) => {
  const response = await apiClient.post('/ai/single-industry', request);
  return wrapApiResponse(response.data);
};

export const getRangeRecommendationAPI = async (request: any) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return wrapApiResponse({
    recommendations: [],
    meta: {
      source: "MOCK",
      version: "v1.0",
      last_at: new Date().toISOString()
    }
  });
};

// ===== React Query용 결과 조회 API =====
export const getResultsAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const [_, page = '1', limit = '20'] = queryKey;
  const response = await apiClient.get(`/ai/results?page=${page}&limit=${limit}`);
  return wrapApiResponse(response.data);
};

export const getRecommendationListAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const response = await apiClient.get('/ai/recommendations');
  return wrapApiResponse(response.data);
};

export const getRecommendationDetailAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const [_, recommendationId] = queryKey;
  const response = await apiClient.get(`/ai/recommendations/${recommendationId}`);
  return wrapApiResponse(response.data);
};

// ===== 일반 버전 API (React Query 외부에서 사용) =====
export const fetchResults = async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get(`/ai/results?page=${page}&limit=${limit}`);
  return wrapApiResponse(response.data);
};

export const fetchRecommendationList = async () => {
  const response = await apiClient.get('/ai/recommendations');
  return wrapApiResponse(response.data);
};

export const fetchRecommendationDetail = async (recommendationId: string) => {
  const response = await apiClient.get(`/ai/recommendations/${recommendationId}`);
  return wrapApiResponse(response.data);
};

// ===== 결과 관리 API들 =====
export const deleteResultAPI = async (resultId: string) => {
  const response = await apiClient.delete(`/ai/results/${resultId}`);
  return wrapApiResponse(response.data);
};

// 🎯 기존 함수 (string[] 받음) - 유지
export const deleteResultCategoriesAPI = async (categoryIds: string[]) => {
  const response = await apiClient.delete('/ai/results/categories', {
    data: { categoryIds }
  });
  return wrapApiResponse(response.data);
};

// 🎯 새로운 함수 (buildingId + data 받음)
export const deleteResultCategoriesWithBuildingAPI = async ({
                                                              buildingId,
                                                              data,
                                                            }: {
  buildingId: number;
  data: any;
}) => {
  const response = await apiClient.delete(`/ai/results/${buildingId}/categories`, {
    data: data
  });
  return wrapApiResponse(response.data);
};

// ===== 좋아요 API들 =====
export const addLikeAPI = async (resultId: string) => {
  const response = await apiClient.post(`/ai/results/${resultId}/like`);
  return wrapApiResponse(response.data);
};

export const deleteLikeAPI = async (resultId: string) => {
  const response = await apiClient.delete(`/ai/results/${resultId}/like`);
  return wrapApiResponse(response.data);
};

// ===== React Query용 검색/필터 API들 =====
export const searchResultsAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const [_, query, ...filters] = queryKey;
  const response = await apiClient.get('/ai/results/search', {
    params: { query, ...filters }
  });
  return wrapApiResponse(response.data);
};

export const getResultsByCategoryAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const [_, category, page = '1'] = queryKey;
  const response = await apiClient.get(`/ai/results/category/${category}?page=${page}`);
  return wrapApiResponse(response.data);
};

// ===== 사용자 관련 API들 =====
export const getUserRecommendationsAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const [_, userId] = queryKey;
  const endpoint = userId ? `/ai/users/${userId}/recommendations` : '/ai/users/me/recommendations';
  const response = await apiClient.get(endpoint);
  return wrapApiResponse(response.data);
};

export const getUserFavoritesAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const response = await apiClient.get('/ai/users/me/favorites');
  return wrapApiResponse(response.data);
};

// ===== 통계/분석 API들 =====
export const getAnalyticsAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const [_, period = '30d'] = queryKey;
  const response = await apiClient.get(`/ai/analytics?period=${period}`);
  return wrapApiResponse(response.data);
};

export const getPopularCategoriesAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const response = await apiClient.get('/ai/categories/popular');
  return wrapApiResponse(response.data);
};

// ===== 설정/환경 API들 =====
export const getAIConfigAPI = async ({ queryKey }: { queryKey: string[] }) => {
  const response = await apiClient.get('/ai/config');
  return wrapApiResponse(response.data);
};

export const updateAIConfigAPI = async (config: any) => {
  const response = await apiClient.put('/ai/config', config);
  return wrapApiResponse(response.data);
};

// ===== 피드백 API들 =====
export const submitFeedbackAPI = async ({ resultId, feedback }: { resultId: string; feedback: any }) => {
  const response = await apiClient.post(`/ai/results/${resultId}/feedback`, feedback);
  return wrapApiResponse(response.data);
};

export const reportIssueAPI = async (issue: any) => {
  const response = await apiClient.post('/ai/issues', issue);
  return wrapApiResponse(response.data);
};

// ===== 내보내기/가져오기 API들 =====
export const exportResultsAPI = async (format: 'json' | 'csv' | 'excel' = 'json') => {
  const response = await apiClient.get(`/ai/results/export?format=${format}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const importResultsAPI = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/ai/results/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return wrapApiResponse(response.data);
};

// ===== Mock API들 (개발용) =====
export const getMockDataAPI = async (type: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return wrapApiResponse({
    type,
    data: `Mock data for ${type}`,
    timestamp: new Date().toISOString()
  });
};
