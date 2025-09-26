// src/features/ai/api/index.ts
import apiClient from '@/lib/apiClient';

// ===== 실제 사용하는 타입 정의 =====
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
    source: 'CACHE' | 'DB' | 'AI';
    version: string;
    last_at: string;
  };
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
      request
    });

    // 503 에러에 대한 특별 처리
    if (status === 503) {
      throw new Error('AI 분석 서비스가 현재 사용할 수 없습니다. AI 서버가 시작 중이거나 점검 중일 수 있습니다.');
    }

    throw error; // 원본 에러를 다시 던져서 상위에서 처리하도록 함
  }
};

// 🎯 단일 업종 분석 API (특정 업종 → 1개 결과)
export const getSingleIndustryRecommendation = async (request: SingleIndustryRequest) => {
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
      request
    });

    // 503 에러에 대한 특별 처리
    if (status === 503) {
      throw new Error('AI 분석 서비스가 현재 사용할 수 없습니다. AI 서버가 시작 중이거나 점검 중일 수 있습니다.');
    }

    throw error; // 원본 에러를 다시 던져서 상위에서 처리하도록 함
  }
};

// 🔄 범위 분석 API (개발 예정)
export const getRangeRecommendation = async (request: any) => {
  const response = await apiClient.post('/ai/range', request);
  return response.data;
};

// ===== ResultController API (기존 컨트롤러 활용) =====

// ✅ 사용자 결과 조회 - GET /api/v1/result
export const getUserResults = async () => {
  console.log('📊 사용자 결과 조회 API 호출');
  const response = await apiClient.get('/result');
  console.log('📊 사용자 결과 응답:', response.data);
  return response.data; // ApiResponse<ResultGetResponse> 형태
};

// ✅ 결과 삭제 - DELETE /api/v1/result/{buildingId}
export const deleteResult = async (buildingId: string) => {
  console.log('🗑️ 결과 삭제 API 호출:', buildingId);
  const response = await apiClient.delete(`/result/${buildingId}`);
  console.log('🗑️ 결과 삭제 응답:', response.data);
  return response.data; // ApiResponse<ResultDeleteResponse> 형태
};

// ===== 좋아요 API (아직 구현되지 않음 - Mock) =====

// ⚠️ 좋아요 추가 (Mock - 실제 엔드포인트 없음)
export const addLike = async (buildingId: string) => {
  console.warn('⚠️ 좋아요 기능은 아직 구현되지 않았습니다:', buildingId);

  // Mock 응답
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        status: 200,
        body: {
          buildingId: parseInt(buildingId),
          isLiked: true
        }
      });
    }, 500);
  });
};

// ⚠️ 좋아요 삭제 (Mock - 실제 엔드포인트 없음)
export const deleteLike = async (buildingId: string) => {
  console.warn('⚠️ 좋아요 삭제 기능은 아직 구현되지 않았습니다:', buildingId);

  // Mock 응답
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        status: 200,
        body: {
          buildingId: parseInt(buildingId),
          isLiked: false
        }
      });
    }, 500);
  });
};

// ===== 카테고리 삭제 API (ResultController 활용) =====

// ✅ 카테고리별 삭제 - DELETE /api/v1/result/{buildingId}/categories
export const deleteResultCategories = async (buildingId: string, categoryIds: string[]) => {
  console.log('🏷️ 카테고리 삭제 API 호출:', { buildingId, categoryIds });

  const requestData = {
    categories: categoryIds // ResultDeleteCategoriesRequest 형태
  };

  const response = await apiClient.delete(`/result/${buildingId}/categories`, {
    data: requestData
  });

  console.log('🏷️ 카테고리 삭제 응답:', response.data);
  return response.data; // ApiResponse<ResultDeleteCategoriesResponse> 형태
};
