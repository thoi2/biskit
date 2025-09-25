// src/features/survey/components/NavigationButtons.tsx
'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Button from '@/lib/components/ui/Button/Button';
import { NavigationButtonsProps } from '../types/survey';

export default function NavigationButtons({
                                              currentStep,
                                              totalSteps,
                                              onPrev,
                                              onNext,
                                              onComplete,
                                              loading,
                                              canProceed = true // 🎯 기본값 true로 설정
                                          }: NavigationButtonsProps) {
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === totalSteps;

    return (
        <div className="flex items-center justify-between">
            {/* 이전 버튼 */}
            <Button
                onClick={onPrev}
                disabled={isFirstStep || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isFirstStep || loading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
            >
                <ChevronLeft className="w-4 h-4" />
                이전
            </Button>

            {/* 단계 표시 */}
            <div className="text-sm text-gray-500">
                {currentStep} / {totalSteps}
            </div>

            {/* 다음/완료 버튼 */}
            {isLastStep ? (
                <Button
                    onClick={onComplete}
                    disabled={!canProceed || loading}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        !canProceed || loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            저장 중...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            완료
                        </>
                    )}
                </Button>
            ) : (
                <Button
                    onClick={onNext}
                    disabled={!canProceed || loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        !canProceed || loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                >
                    다음
                    <ChevronRight className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
