// src/features/survey/components/SurveyModal.tsx (버튼 제어 개선)
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/lib/components/ui/Button/Button';
import { SurveyFormData } from '../types/survey';
import { useIndustryStore } from '../store/industryStore';
import { surveyApi } from '../api/surveyApi';

// Steps
import BasicInfoStep from './steps/BasicInfoStep';
import InterestAreasStep from './steps/InterestAreasStep';
import BusinessGoalsStep from './steps/BusinessGoalsStep';
import AIRecommendationStep from './steps/AIRecommendationStep';
import FinalSelectionStep from './steps/FinalSelectionStep';

interface SurveyModalProps {
    open: boolean;
    onClose: () => void;
}

export default function SurveyModal({ open, onClose }: SurveyModalProps) {
    const { surveyData, updateSurveyData, loading, fetchUserIndustries } = useIndustryStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [canProceed, setCanProceed] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    // 🎯 AI 단계 제어 상태
    const [aiStarted, setAiStarted] = useState(false);
    const [aiCompleted, setAiCompleted] = useState(false);

    const steps = [
        { id: 'basic', title: '기본 정보', component: BasicInfoStep },
        { id: 'interests', title: '관심 분야', component: InterestAreasStep },
        { id: 'goals', title: '사업 목표', component: BusinessGoalsStep },
        { id: 'ai', title: 'AI 추천', component: AIRecommendationStep },
        { id: 'final', title: '최종 선택', component: FinalSelectionStep }
    ];

    const currentStepConfig = steps[currentStep];
    const StepComponent = currentStepConfig.component;

    // 🎯 모달 열릴 때 기존 업종 정보 자동 로드
    useEffect(() => {
        if (open) {
            fetchUserIndustries();
        }
    }, [open, fetchUserIndustries]);

    // 🎯 현재 단계별 validation
    const validateCurrentStep = (stepData: Partial<SurveyFormData>): boolean => {
        switch (currentStep) {
            case 0: // BasicInfoStep
                return !!(
                    stepData.basicInfo?.businessType &&
                    stepData.basicInfo?.regions &&
                    stepData.basicInfo.regions.length > 0 &&
                    stepData.basicInfo?.budget &&
                    stepData.basicInfo?.experience &&
                    stepData.basicInfo?.hasSpecialty &&
                    (stepData.basicInfo.hasSpecialty === 'no' ||
                        (stepData.basicInfo.hasSpecialty === 'yes' && stepData.basicInfo?.specialty))
                );

            case 1: // InterestAreasStep
                return !!(
                    stepData.interestAreas?.categories &&
                    stepData.interestAreas.categories.length > 0
                );

            case 2: // BusinessGoalsStep
                return !!(
                    stepData.businessGoals?.workStyle &&
                    stepData.businessGoals?.riskTolerance
                );

            case 3: // AIRecommendationStep - 🎯 AI 완료된 경우에만 진행 가능
                return aiCompleted;

            case 4: // FinalSelectionStep
                return !!(
                    stepData.finalSelection?.selectedIndustries?.industry1st &&
                    stepData.finalSelection?.selectedIndustries?.industry2nd &&
                    stepData.finalSelection?.selectedIndustries?.industry3rd
                );

            default:
                return true;
        }
    };

    const localStepData = { ...surveyData };
    const isStepValid = validateCurrentStep(localStepData);
    const isAIStep = currentStep === 3;

    // 🎯 버튼 표시 제어
    const showPrevButton = currentStep > 0 && (!isAIStep || (isAIStep && !aiStarted));
    const showNextButton = !isAIStep || (isAIStep && aiCompleted);
    const nextButtonDisabled = !isStepValid || (isAIStep && !aiCompleted);

    const handleClose = () => {
        // 🎯 AI 진행 중이면 확인 후 닫기
        if (aiStarted && !aiCompleted) {
            const confirmClose = confirm('AI 추천이 진행 중입니다. 정말 닫으시겠습니까?');
            if (!confirmClose) return;
        }

        setCurrentStep(0);
        setAiStarted(false);
        setAiCompleted(false);
        onClose();
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleNext = async () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // 🎯 최종 완료 처리
            try {
                setIsCompleting(true);

                const finalData = {
                    industry1st: surveyData.finalSelection?.selectedIndustries?.industry1st,
                    industry2nd: surveyData.finalSelection?.selectedIndustries?.industry2nd,
                    industry3rd: surveyData.finalSelection?.selectedIndustries?.industry3rd
                };

                await surveyApi.completeSurvey(finalData);

                alert('설문조사가 완료되었습니다!');
                handleClose();

            } catch (error) {
                console.error('설문 완료 실패:', error);
                alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
            } finally {
                setIsCompleting(false);
            }
        }
    };

    // 🎯 AI 시작 버튼 클릭
    const handleStartAI = () => {
        setAiStarted(true);
    };

    // 🎯 AI 완료 콜백
    const handleAIComplete = () => {
        setAiCompleted(true);
    };

    useEffect(() => {
        setCanProceed(isStepValid);
    }, [isStepValid]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">창업 업종 추천 설문조사</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                            {currentStepConfig.title}
                        </span>
                        <span className="text-sm text-gray-500">
                            {currentStep + 1} / {steps.length}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {currentStep === 3 ? (
                        // AI 추천 단계
                        <StepComponent
                            data={surveyData}
                            onChange={updateSurveyData}
                            loading={loading}
                            aiStarted={aiStarted}
                            aiCompleted={aiCompleted}
                            onStart={handleStartAI}
                            onComplete={handleAIComplete}
                        />
                    ) : currentStep === 4 ? (
                        // 🎯 최종 선택 단계 - onComplete 추가
                        <StepComponent
                            data={surveyData}
                            onChange={updateSurveyData}
                            loading={loading}
                            onComplete={() => {
                                console.log('FinalSelectionStep 완료 - 모달 닫기');
                                handleClose();
                            }}
                        />
                    ) : (
                        // 다른 단계들
                        <StepComponent
                            data={surveyData}
                            onChange={updateSurveyData}
                            loading={loading}
                        />
                    )}
                </div>


                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                        {!canProceed && currentStep < steps.length - 1 && (
                            <span className="text-sm text-red-500 font-medium">
                                {currentStep === 0 && '모든 항목을 선택해주세요'}
                                {currentStep === 1 && '관심 분야를 선택해주세요'}
                                {currentStep === 2 && '사업 목표를 설정해주세요'}
                                {currentStep === 3 && 'AI 추천을 완료해주세요'}
                                {currentStep === 4 && '업종 3개를 선택해주세요'}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {showPrevButton && (
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                disabled={loading || isCompleting}
                                className="px-6"
                            >
                                이전
                            </Button>
                        )}

                        {/* 🎯 AI 시작 버튼 (AI 단계에서 시작 전에만 표시) */}
                        {isAIStep && !aiStarted && (
                            <Button
                                onClick={handleStartAI}
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
                            >
                                AI 추천 시작하기
                            </Button>
                        )}

                        {/* 🎯 다음/완료 버튼 */}
                        {showNextButton && (
                            <Button
                                onClick={handleNext}
                                disabled={nextButtonDisabled || loading || isCompleting}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
                            >
                                {isCompleting ? '저장 중...' : currentStep === steps.length - 1 ? '설문 완료' : '다음'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
