// src/features/survey/store/industryStore.ts (완전한 차단)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import { SurveyFormData, IndustryRecommendation } from '../types/survey';
import { surveyApi } from '../api/surveyApi';

interface UserIndustries {
    userId: number;
    industry1st: string | null;
    industry2nd: string | null;
    industry3rd: string | null;
    surveyCompletedAt: string | null;
    hasRecommendation: boolean;
}

interface IndustryStore {
    recommendations: IndustryRecommendation[];
    surveyData: SurveyFormData;
    userIndustries: UserIndustries | null;
    loading: boolean;
    isInitialized: boolean;

    updateSurveyData: (data: Partial<SurveyFormData>) => void;
    clearSurveyData: () => void;
    getAIRecommendations: (formData: SurveyFormData) => Promise<void>;
    setRecommendations: (recommendations: IndustryRecommendation[]) => void;
    fetchUserIndustries: () => Promise<void>;
    saveIndustrySelection: (selection: any) => Promise<void>;
    updateUserIndustries: (selection: any) => Promise<void>;
    deleteUserIndustries: () => Promise<void>;
    hasRecommendations: () => boolean;
    clearAll: () => void;
    setInitialized: () => void;
}

// 🎯 전역 변수로 완전 차단
let isCurrentlyFetching = false;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 2000; // 2초 쿨다운

export const useIndustryStore = create<IndustryStore>()(
    persist(
        (set, get) => ({
            recommendations: [],
            surveyData: {},
            userIndustries: null,
            loading: false,
            isInitialized: false,

            updateSurveyData: (data: Partial<SurveyFormData>) =>
                set(state => ({
                    surveyData: { ...state.surveyData, ...data }
                })),

            clearSurveyData: () =>
                set({ surveyData: {} }),

            getAIRecommendations: async (formData: SurveyFormData) => {
                set({ loading: true });
                try {
                    const aiRequest = {
                        age: formData.basicInfo?.experience || null,
                        experience: formData.interestAreas?.categories || [],
                        budget: formData.basicInfo?.budget || null,
                        interests: formData.interestAreas?.specificInterests || [],
                        workStyle: formData.businessGoals?.workStyle || null,
                        locations: formData.basicInfo?.regions || [],
                        riskTolerance: formData.businessGoals?.riskTolerance || null,
                        hasSpecialty: formData.basicInfo?.hasSpecialty || null,
                        specialty: formData.basicInfo?.specialty || null,
                        primaryGoal: formData.businessGoals?.primaryGoal || null,
                        timeline: formData.businessGoals?.timeline || null,
                        expectedIncome: formData.businessGoals?.expectedIncome || null,
                        timeCommitment: formData.businessGoals?.timeCommitment || null,
                        surveyResponses: [
                            { questionId: 1, selectedOptions: [1, 2] },
                            { questionId: 2, selectedOptions: [3] },
                            { questionId: 3, selectedOptions: [1, 4] }
                        ]
                    };

                    const response = await surveyApi.generateAIRecommendations(aiRequest);

                    if (!response.data.success) {
                        throw new Error(`API 요청 실패: ${response.data.status}`);
                    }

                    const responseBody = response.data.body;
                    if (responseBody.success) {
                        set({
                            recommendations: responseBody.recommendations || [],
                            surveyData: {
                                ...get().surveyData,
                                aiRecommendation: {
                                    surveyResponses: aiRequest.surveyResponses || [],
                                    recommendations: responseBody.recommendations || [],
                                    summary: responseBody.summary
                                }
                            }
                        });
                    } else {
                        throw new Error(responseBody.errorMessage || 'AI 추천 실패');
                    }
                } catch (error) {
                    console.error('AI 추천 요청 실패:', error);
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },

            setRecommendations: (recommendations) =>
                set({ recommendations }),

            // 🎯 완전한 무한 호출 차단
            fetchUserIndustries: async () => {
                const now = Date.now();

                // 🎯 다중 차단 조건
                if (isCurrentlyFetching) {
                    console.log('🚫 이미 fetching 중 - 차단');
                    return;
                }

                if (now - lastFetchTime < FETCH_COOLDOWN) {
                    console.log(`🚫 쿨다운 중 - ${FETCH_COOLDOWN - (now - lastFetchTime)}ms 남음`);
                    return;
                }

                const { loading, isInitialized } = get();
                if (loading) {
                    console.log('🚫 store loading 중 - 차단');
                    return;
                }

                // 🎯 모든 차단 통과 - 실행
                isCurrentlyFetching = true;
                lastFetchTime = now;
                set({ loading: true });

                try {
                    const response = await surveyApi.getRecommendations();

                    if (!response.data.success) {
                        set({
                            userIndustries: null,
                            isInitialized: true
                        });
                        return;
                    }

                    const userData = response.data.body;
                    const userIndustries: UserIndustries = {
                        userId: userData.userId,
                        industry1st: userData.industry1st,
                        industry2nd: userData.industry2nd,
                        industry3rd: userData.industry3rd,
                        surveyCompletedAt: userData.surveyCompletedAt,
                        hasRecommendation: userData.hasRecommendation
                    };

                    set({
                        userIndustries,
                        isInitialized: true
                    });

                } catch (error) {
                    if (error instanceof AxiosError) {
                        if (error.response?.status === 404) {
                            set({
                                userIndustries: null,
                                isInitialized: true
                            });
                        } else {
                            console.error('사용자 업종 조회 실패:', error);
                            set({
                                userIndustries: null,
                                isInitialized: true
                            });
                        }
                    } else {
                        console.error('알 수 없는 에러:', error);
                        set({
                            userIndustries: null,
                            isInitialized: true
                        });
                    }
                } finally {
                    set({ loading: false });
                    isCurrentlyFetching = false; // 🎯 완료 시 차단 해제
                }
            },

            saveIndustrySelection: async (selection: any) => {
                set({ loading: true });
                try {
                    const response = await surveyApi.completeSurvey(selection);

                    if (!response.data.success) {
                        throw new Error(`저장 실패: ${response.data.status}`);
                    }

                    const currentState = get();
                    set({
                        userIndustries: {
                            userId: currentState.userIndustries?.userId || 0,
                            industry1st: selection.industry1st,
                            industry2nd: selection.industry2nd,
                            industry3rd: selection.industry3rd,
                            surveyCompletedAt: new Date().toISOString(),
                            hasRecommendation: true
                        }
                    });

                } catch (error) {
                    console.error('업종 선택 저장 실패:', error);
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },

            updateUserIndustries: async (selection: any) => {
                set({ loading: true });
                try {
                    const response = await surveyApi.updateSurvey(selection);

                    if (!response.data.success) {
                        throw new Error(`수정 실패: ${response.data.status}`);
                    }

                    const currentState = get();
                    set({
                        userIndustries: {
                            ...currentState.userIndustries!,
                            industry1st: selection.industry1st || currentState.userIndustries?.industry1st,
                            industry2nd: selection.industry2nd || currentState.userIndustries?.industry2nd,
                            industry3rd: selection.industry3rd || currentState.userIndustries?.industry3rd,
                        }
                    });

                } catch (error) {
                    console.error('업종 선택 수정 실패:', error);
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },

            deleteUserIndustries: async () => {
                set({ loading: true });
                try {
                    const response = await surveyApi.deleteRecommendations();

                    if (!response.data.success) {
                        throw new Error(`삭제 실패: ${response.data.status}`);
                    }

                    set({ userIndustries: null });

                } catch (error) {
                    console.error('업종 선택 삭제 실패:', error);
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },

            hasRecommendations: () => {
                const { recommendations, userIndustries } = get();
                return recommendations.length > 0 || (userIndustries?.hasRecommendation ?? false);
            },

            clearAll: () => {
                // 🎯 전역 차단 변수도 초기화
                isCurrentlyFetching = false;
                lastFetchTime = 0;

                set({
                    recommendations: [],
                    surveyData: {},
                    userIndustries: null,
                    loading: false,
                    isInitialized: false
                });
            },

            setInitialized: () => set({ isInitialized: true })
        }),
        {
            name: 'industry-store',
            partialize: (state) => ({
                recommendations: state.recommendations,
                userIndustries: state.userIndustries,
                surveyData: state.surveyData,
            }),
        }
    )
);
