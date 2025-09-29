// src/features/survey/components/ProgressIndicator.tsx
'use client';

import { ProgressIndicatorProps } from '../types/survey';

export default function ProgressIndicator({
                                              current,
                                              total
                                          }: ProgressIndicatorProps) {
    const steps = Array.from({ length: total }, (_, i) => i + 1);
    const progressPercentage = (current / total) * 100;

    return (
        <div className="mt-3">
            {/* 진행률 표시 */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>단계 {current} / {total}</span>
                <span>{Math.round(progressPercentage)}% 완료</span>
            </div>

            {/* 진행 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                    className="bg-gradient-to-r from-purple-400 to-orange-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* 단계 점들 */}
            <div className="flex justify-between">
                {steps.map((step) => (
                    <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                            step < current
                                ? 'bg-green-500 text-white' // 완료된 단계
                                : step === current
                                    ? 'bg-purple-600 text-white' // 현재 단계
                                    : 'bg-gray-200 text-gray-500' // 미완료 단계
                        }`}
                    >
                        {step < current ? '✓' : step}
                    </div>
                ))}
            </div>
        </div>
    );
}
