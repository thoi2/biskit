// src/features/survey/api/surveyApi.ts (올바른 ApiResponse 패턴)
import apiClient from '@/lib/apiClient';
import { ApiResponse } from '@/lib/types/api';

// 백엔드 응답 타입들 정의
interface UserIndustryResponse {
    userId: number;
    industry1st: string | null;
    industry2nd: string | null;
    industry3rd: string | null;
    surveyCompletedAt: string | null;
    hasRecommendation: boolean;
}

interface AIRecommendationResponseBody {
    success: boolean;
    recommendations: any[];
    summary?: string;
    errorMessage?: string;
}

interface SurveyCompleteResponse {
    message: string;
    recommendations?: any[];
    userIndustries?: {
        industry1st: string;
        industry2nd: string;
        industry3rd: string;
        surveyCompletedAt: string;
    };
}

interface AIRecommendationRequest {
    age?: string | null;
    experience?: string[] | null;
    budget?: string | null;
    interests?: string[] | null;
    workStyle?: string | null;
    location?: string | null;
    riskTolerance?: string | null;
    surveyResponses?: Array<{
        questionId: number;
        selectedOptions: number[];
    }>;
}

export const surveyApi = {
    // 1. 기존 추천 조회
    getRecommendations: () =>
        apiClient.get<ApiResponse<UserIndustryResponse>>('/user/industry/search'),

    // 2. AI 추천 생성 ✨ 올바른 타입 적용
    generateAIRecommendations: (data: AIRecommendationRequest) =>
        apiClient.post<ApiResponse<AIRecommendationResponseBody>>('/user/industry/ai-recommend', data),

    // 3. 설문조사 최종 저장
    completeSurvey: (data: any) =>
        apiClient.post<ApiResponse<SurveyCompleteResponse>>('/user/industry/survey', data),

    // 4. 추천 수정
    updateSurvey: (data: any) =>
        apiClient.put<ApiResponse<string>>('/user/industry/update', data),

    // 5. 추천 삭제
    deleteRecommendations: () =>
        apiClient.delete<ApiResponse<string>>('/user/industry/delete')
};
