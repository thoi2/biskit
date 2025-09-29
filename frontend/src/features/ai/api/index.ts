// src/features/ai/api/index.ts
import apiClient from '@/lib/apiClient';

// ===== 백엔드 DTO와 정확히 매칭되는 타입 정의 =====

// AI 분석 요청/응답
interface SingleRequest {
  lat: number;
  lng: number;
}

interface SingleIndustryRequest {
  lat: number;
  lng: number;
  category: string;
}

interface RangeRequest {
  polygon: Array<{
    lat: number;
    lng: number;
  }>;
  category: string;
}

interface RecommendResponse {
  building: {
    building_id: number;
    lat: number;
    lng: number;
  };
  result: Array<{
    category: string;
    survival_rate: number[]; // ✅ 백엔드 JsonProperty와 매칭
  }>;
  meta: {
    source: 'DB' | 'AI';
    version: string;
    last_at: string;
  };
}

interface RangeResponse {
  items: Array<{
    building_id: number; // ✅ 백엔드 JsonProperty와 매칭
    category: string;
    lat: number;
    lng: number;
    survival_rate: number[]; // ✅ 백엔드 JsonProperty와 매칭
  }>;
}

interface ExplainResponse {
  building_id: number;
  category: string;
  explanation: string;
}

// 결과 관리 요청/응답
interface ResultGetResponse {
  items: Array<{
    buildingId: number;
    lat: number;
    lng: number;
    favorite: boolean;
    categories: Array<{
      category: string;
      survivalRate: number[];
    }>;
  }>;
}

interface ResultDeleteResponse {
  buildingId: number;
  deletedCount: number;
}

interface ResultDeleteCategoriesRequest {
  categories: string[];
}

interface ResultDeleteCategoriesResponse {
  buildingId: number;
  deletedCategoryNames: string[];
  deletedCount: number;
}

// 좋아요 응답
interface FavoriteResponse {
  buildingId: number;
  isLiked: boolean; // ✅ 백엔드 JsonProperty와 매칭
}

// ===== AI 분석 API =====

// 🌟 다중 분석 API (업종 없음 → 여러 추천 업종)
export const getSingleRecommendation = async (request: SingleRequest) => {
  console.log('🌟 다중 분석 API 호출:', request);

  try {
    const response = await apiClient.post('/ai/single', request);
    console.log('🌟 다중 분석 응답:', response.data);
    return response.data; // ApiResponse<RecommendResponse> 구조
  } catch (error: any) {
    const status = error.response?.status;
    console.error('🌟 다중 분석 API 에러:', {
      status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: '/ai/single',
      request,
    });

    // 503 에러에 대한 특별 처리
    if (status === 503) {
      throw new Error(
        'AI 분석 서비스가 현재 사용할 수 없습니다. AI 서버가 시작 중이거나 점검 중일 수 있습니다.',
      );
    }

    throw error; // 원본 에러를 다시 던져서 상위에서 처리하도록 함
  }
};

// 🎯 단일 업종 분석 API (특정 업종 → 1개 결과)
export const getSingleIndustryRecommendation = async (
  request: SingleIndustryRequest,
) => {
  console.log('🎯 단일 업종 분석 API 호출:', request);

  try {
    const response = await apiClient.post('/ai/single-industry', request);
    console.log('🎯 단일 업종 분석 응답:', response.data);
    return response.data; // ApiResponse<RecommendResponse> 구조
  } catch (error: any) {
    const status = error.response?.status;
    console.error('🎯 단일 업종 분석 API 에러:', {
      status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: '/ai/single-industry',
      request,
    });

    // 503 에러에 대한 특별 처리
    if (status === 503) {
      throw new Error(
        'AI 분석 서비스가 현재 사용할 수 없습니다. AI 서버가 시작 중이거나 점검 중일 수 있습니다.',
      );
    }

    throw error; // 원본 에러를 다시 던져서 상위에서 처리하도록 함
  }
};

// 🗺️ 범위 분석 API
export const getRangeRecommendation = async (request: RangeRequest) => {
  console.log('🗺️ 범위 분석 API 호출:', request);
  const response = await apiClient.post('/ai/range', request);
  console.log('🗺️ 범위 분석 응답:', response.data);
  return response.data as { success: boolean; body: RangeResponse };
};

// 💬 GMS 설명 API
export const getIndustryExplanation = async (request: {
  building_id: number;
  category: string;
}) => {
  console.log('💬 GMS 설명 API 호출:', request);
  const response = await apiClient.post(
    '/ai/single-industry-explanation',
    request,
  );
  console.log('💬 GMS 설명 응답:', response.data);
  return response.data as { success: boolean; body: ExplainResponse };
};

// ===== 결과 관리 API (ResultController) =====

// ✅ 사용자 결과 조회 - GET /api/v1/result
export const getUserResults = async () => {
  console.log('📊 사용자 결과 조회 API 호출');
  const response = await apiClient.get('/result');
  console.log('📊 사용자 결과 응답:', response.data);
  return response.data as { success: boolean; body: ResultGetResponse };
};

// ✅ 건물 결과 삭제 - DELETE /api/v1/result/{buildingId}
export const deleteResult = async (buildingId: number) => {
  console.log('🗑️ 건물 결과 삭제 API 호출:', buildingId);
  const response = await apiClient.delete(`/result/${buildingId}`);
  console.log('🗑️ 건물 결과 삭제 응답:', response.data);
  return response.data as { success: boolean; body: ResultDeleteResponse };
};

// ✅ 카테고리별 삭제 - DELETE /api/v1/result/{buildingId}/categories
export const deleteResultCategories = async (
  buildingId: number,
  categoryNames: string[],
) => {
  console.log('🏷️ 카테고리 삭제 API 호출:', { buildingId, categoryNames });

  const requestData: ResultDeleteCategoriesRequest = {
    categories: categoryNames,
  };

  const response = await apiClient.delete(`/result/${buildingId}/categories`, {
    data: requestData,
  });

  console.log('🏷️ 카테고리 삭제 응답:', response.data);
  return response.data as {
    success: boolean;
    body: ResultDeleteCategoriesResponse;
  };
};

// ===== 좋아요 API (FavoriteController) =====

// ✅ 좋아요 추가 - POST /api/v1/like/{buildingId}
export const addLike = async (buildingId: number) => {
  console.log('❤️ 좋아요 추가 API 호출:', buildingId);
  const response = await apiClient.post(`/like/${buildingId}`);
  console.log('❤️ 좋아요 추가 응답:', response.data);
  return response.data as { success: boolean; body: FavoriteResponse };
};

// ✅ 좋아요 삭제 - DELETE /api/v1/like/{buildingId}
export const deleteLike = async (buildingId: number) => {
  console.log('💔 좋아요 삭제 API 호출:', buildingId);
  const response = await apiClient.delete(`/like/${buildingId}`);
  console.log('💔 좋아요 삭제 응답:', response.data);
  return response.data as { success: boolean; body: FavoriteResponse };
};
