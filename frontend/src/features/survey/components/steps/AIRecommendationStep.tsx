// src/features/survey/components/steps/AIRecommendationStep.tsx (타입 에러 수정)
'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { SurveyStepProps, AIRecommendationData, IndustryRecommendation } from '../../types/survey';
import { surveyApi } from '../../api/surveyApi';
import { AxiosError } from 'axios';

interface AIProcessStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
}

interface AIStepProps extends SurveyStepProps {
    aiStarted?: boolean;
    aiCompleted?: boolean;
    onStart?: () => void;
    onComplete?: () => void;
}

export default function AIRecommendationStep({
                                                 data,
                                                 onChange,
                                                 loading = false,
                                                 aiStarted = false,
                                                 aiCompleted = false,
                                                 onStart,
                                                 onComplete
                                             }: AIStepProps) {
    const [aiRecommendation, setAIRecommendation] = useState<AIRecommendationData>({
        surveyResponses: data.aiRecommendation?.surveyResponses || []
    });

    const [recommendations, setRecommendations] = useState<IndustryRecommendation[]>([]);
    const [aiProcessSteps, setAIProcessSteps] = useState<AIProcessStep[]>([
        {
            id: 'analyze',
            title: '설문 분석 중',
            description: '입력하신 정보를 분석하고 있습니다',
            status: 'pending'
        },
        {
            id: 'matching',
            title: '업종 매칭',
            description: '업종 데이터베이스와 매칭하고 있습니다',
            status: 'pending'
        },
        {
            id: 'ai_processing',
            title: 'AI 추천 생성',
            description: 'AI가 최적의 업종을 선별하고 있습니다',
            status: 'pending'
        },
        {
            id: 'result',
            title: '결과 생성',
            description: '추천 결과를 정리하고 있습니다',
            status: 'pending'
        }
    ]);

    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [aiError, setAiError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string>('');
    const aiStartedRef = useRef(false);

    useEffect(() => {
        if (aiStarted && !aiCompleted && !aiStartedRef.current) {
            aiStartedRef.current = true;
            startAIRecommendation();
        }
    }, [aiStarted, aiCompleted]);

    useEffect(() => {
        onChange({
            aiRecommendation: {
                ...aiRecommendation,
                recommendations,
                summary
            }
        });
    }, [aiRecommendation, recommendations, summary]);

    const startAIRecommendation = async () => {
        setCurrentStepIndex(0);
        setAiError(null);

        const aiRequestPromise = performAIRequest();
        const uiAnimationPromise = simulateAIProcess();

        try {
            const [aiResult] = await Promise.allSettled([aiRequestPromise, uiAnimationPromise]);

            if (aiResult.status === 'fulfilled') {
                setRecommendations(aiResult.value.recommendations);
                setSummary(aiResult.value.summary || 'AI 기반 업종 추천이 완료되었습니다.');
                onComplete?.();

                setAIProcessSteps(prev =>
                    prev.map(step => ({ ...step, status: 'completed' }))
                );
            } else {
                throw aiResult.reason;
            }

        } catch (error) {
            console.error('AI 추천 실패:', error);

            let errorMessage = 'AI 추천 중 오류가 발생했습니다.';

            if (error instanceof AxiosError) {
                if (error.response?.status === 500) {
                    errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (error.response?.status === 408 || error.code === 'ECONNABORTED') {
                    errorMessage = 'AI 추천 요청이 시간 초과되었습니다. 다시 시도해주세요.';
                } else if (error.response?.status === 401) {
                    errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
                } else if (error.response?.status === 400) {
                    errorMessage = '설문 데이터가 올바르지 않습니다. 이전 단계를 다시 확인해주세요.';
                } else {
                    // 🎯 타입 에러 해결: message 대신 올바른 속성 사용
                    const responseData = error.response?.data as any;
                    errorMessage = responseData?.errorMessage || responseData?.error || error.message;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setAiError(errorMessage);

            setAIProcessSteps(prev =>
                prev.map((step, index) =>
                    index === currentStepIndex
                        ? { ...step, status: 'error' }
                        : step
                )
            );
        }
    };

    const performAIRequest = async () => {
        console.log('🚀 실제 AI API 요청 시작');

        const requestData = {
            age: data.basicInfo?.experience || null,
            budget: data.basicInfo?.budget || null,
            regions: data.basicInfo?.regions || [],
            businessType: data.basicInfo?.businessType || null,
            hasSpecialty: data.basicInfo?.hasSpecialty === 'yes',
            specialty: data.basicInfo?.specialty || null,
            categories: data.interestAreas?.categories || [],
            specificInterests: data.interestAreas?.specificInterests || [],
            workStyle: data.businessGoals?.workStyle || null,
            riskTolerance: data.businessGoals?.riskTolerance || null,
            primaryGoal: data.businessGoals?.primaryGoal || null,
            timeline: data.businessGoals?.timeline || null,
            expectedIncome: data.businessGoals?.expectedIncome || null,
            timeCommitment: data.businessGoals?.timeCommitment || null,
            surveyResponses: [
                { questionId: 1, selectedOptions: [1, 2] },
                { questionId: 2, selectedOptions: [3] },
                { questionId: 3, selectedOptions: [1, 4] }
            ]
        };

        console.log('📤 AI API 요청 데이터:', requestData);

        try {
            const response = await surveyApi.generateAIRecommendations(requestData);
            console.log('📥 AI API 응답:', response.data);

            if (!response.data.success) {
                // 🎯 타입 에러 해결: 올바른 에러 메시지 속성 사용
                const errorMsg = (response.data as any)?.errorMessage ||
                    (response.data as any)?.error ||
                    `API 요청 실패: ${response.data.status}`;
                throw new Error(errorMsg);
            }

            const responseBody = response.data.body;

            if (responseBody.success && responseBody.recommendations) {
                console.log('✅ AI 추천 성공:', responseBody.recommendations);

                return {
                    recommendations: responseBody.recommendations,
                    summary: responseBody.summary || 'AI 기반 업종 추천이 완료되었습니다.'
                };
            } else {
                // 🎯 타입 에러 해결: 올바른 에러 메시지 속성 사용
                const errorMsg = responseBody.errorMessage ||
                    (responseBody as any)?.error ||
                    'AI 추천 실패';
                throw new Error(errorMsg);
            }

        } catch (error) {
            console.error('❌ AI API 요청 실패:', error);

            if (error instanceof AxiosError) {
                console.error('응답 상태:', error.response?.status);
                console.error('응답 데이터:', error.response?.data);
                console.error('요청 설정:', error.config);
            }

            throw error;
        }
    };

    const simulateAIProcess = async () => {
        const delays = [2500, 2500, 2500, 2500];

        for (let i = 0; i < aiProcessSteps.length; i++) {
            setCurrentStepIndex(i);

            setAIProcessSteps(prev =>
                prev.map((step, index) =>
                    index === i
                        ? { ...step, status: 'loading' }
                        : index < i
                            ? { ...step, status: 'completed' }
                            : step
                )
            );

            await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
    };

    const retryAI = () => {
        setAiError(null);
        setCurrentStepIndex(-1);
        setRecommendations([]);
        setSummary('');
        setAIProcessSteps(prev =>
            prev.map(step => ({ ...step, status: 'pending' }))
        );
        aiStartedRef.current = false;
        onStart?.();
    };

    return (
        <div className="space-y-8">
            {/* 페이지 소개 */}
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">AI 업종 추천</h3>
                <p className="text-gray-600">
                    {!aiStarted ? (
                        <>설문 결과를 바탕으로 AI가 최적의 업종을 추천해드립니다</>
                    ) : aiCompleted ? (
                        <>AI 분석이 완료되었습니다! 추천 업종을 확인해보세요</>
                    ) : aiError ? (
                        <>추천 과정에서 문제가 발생했습니다. 다시 시도해주세요</>
                    ) : (
                        <>AI가 열심히 분석하고 있습니다. 잠시만 기다려주세요</>
                    )}
                </p>
            </div>

            {/* 시작 전 안내 메시지 */}
            {!aiStarted && !aiCompleted && (
                <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-200">
                    <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">AI 추천을 시작할 준비가 되었습니다</h4>
                    <p className="text-gray-600 mb-4">
                        설문 응답을 바탕으로 최적의 창업 업종 3가지를 추천해드립니다.
                    </p>
                    <div className="text-sm text-purple-600">
                        아래 &#34;AI 추천 시작하기&#34; 버튼을 클릭하세요
                    </div>
                </div>
            )}

            {/* AI 처리 과정 표시 */}
            {aiStarted && !aiCompleted && !aiError && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">AI 분석 진행 중</h4>
                        <div className="text-sm text-blue-600">
                            실제 AI가 서버에서 분석 중입니다...
                        </div>
                    </div>

                    <div className="space-y-4">
                        {aiProcessSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    step.status === 'completed'
                                        ? 'bg-green-500 text-white'
                                        : step.status === 'loading'
                                            ? 'bg-blue-500 text-white'
                                            : step.status === 'error'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {step.status === 'completed' ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : step.status === 'loading' ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : step.status === 'error' ? (
                                        <AlertCircle className="w-5 h-5" />
                                    ) : (
                                        <Clock className="w-5 h-5" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h5 className={`font-medium ${
                                        step.status === 'loading' ? 'text-blue-700' : 'text-gray-800'
                                    }`}>
                                        {step.title}
                                    </h5>
                                    <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI 추천 결과 */}
            {aiCompleted && recommendations.length > 0 && (
                <div className="space-y-6">
                    {/* 요약 */}
                    {summary && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-800 mb-2">AI 분석 요약</h4>
                            <p className="text-green-700">{summary}</p>
                        </div>
                    )}

                    {/* 추천 업종 목록 */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">추천 업종</h4>
                        <div className="space-y-4">
                            {recommendations.map((rec, index) => (
                                <div key={rec.industryCode} className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-all duration-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <h5 className="text-lg font-semibold text-gray-800">{rec.industryName}</h5>
                                                <p className="text-sm text-purple-600">{rec.category}</p>
                                                <p className="text-xs text-gray-500">코드: {rec.industryCode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {/* 🎯 점수 표시 수정 */}
                                            <div className="text-lg font-bold text-purple-600">
                                                {rec.score > 100 ? Math.round(rec.score / 100) : Math.round(rec.score)}%
                                            </div>
                                            <div className="text-sm text-gray-500">매칭도</div>
                                        </div>
                                    </div>

                                    {rec.reason && (
                                        <p className="text-gray-600 mb-3">{rec.reason}</p>
                                    )}

                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${rec.score > 100 ? Math.round(rec.score / 100) : Math.round(rec.score)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 다시 추천받기 버튼 */}
                    <div className="text-center">
                        <button
                            onClick={retryAI}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                        >
                            다시 추천받기
                        </button>
                    </div>
                </div>
            )}

            {/* 에러 상태 */}
            {aiError && (
                <div className="text-center space-y-4">
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h4 className="font-semibold text-red-800 mb-2">추천 실패</h4>
                        <p className="text-red-700 mb-4">{aiError}</p>
                        <button
                            onClick={retryAI}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                        >
                            다시 시도하기
                        </button>
                    </div>
                </div>
            )}

            {/* 진행 상태 표시 */}
            {loading && (
                <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-purple-600">
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>저장 중...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
