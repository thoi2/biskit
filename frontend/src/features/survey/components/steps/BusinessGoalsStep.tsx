// src/features/survey/components/steps/BusinessGoalsStep.tsx (타입 맞춤)
'use client';

import { useState, useEffect } from 'react';
import { Target, TrendingUp, Shield, Zap, Users } from 'lucide-react';
import { SurveyStepProps, BusinessGoals } from '../../types/survey';

export default function BusinessGoalsStep({
                                              data,
                                              onChange,
                                              loading = false
                                          }: SurveyStepProps) {
    // 🎯 타입에 정의된 필드만 사용
    const [businessGoals, setBusinessGoals] = useState<BusinessGoals>({
        workStyle: data.businessGoals?.workStyle || '',
        riskTolerance: data.businessGoals?.riskTolerance || ''
    });

    useEffect(() => {
        onChange({ businessGoals });
    }, [businessGoals]);

    const handleInputChange = (field: keyof BusinessGoals, value: string) => {
        setBusinessGoals(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const workStyles = [
        { value: 'solo', label: '혼자서 운영', icon: <Users className="w-5 h-5" />, desc: '1인 사업으로 시작' },
        { value: 'small_team', label: '소규모 팀', icon: <Users className="w-5 h-5" />, desc: '2-3명의 팀으로 운영' },
        { value: 'family', label: '가족 사업', icon: <Users className="w-5 h-5" />, desc: '가족과 함께 운영' },
        { value: 'partnership', label: '동업', icon: <Users className="w-5 h-5" />, desc: '파트너와 공동 운영' }
    ];

    const riskTolerances = [
        { value: 'conservative', label: '안정적', icon: <Shield className="w-5 h-5" />, desc: '위험을 최소화하고 싶어요' },
        { value: 'moderate', label: '보통', icon: <TrendingUp className="w-5 h-5" />, desc: '적당한 위험은 감수할 수 있어요' },
        { value: 'aggressive', label: '적극적', icon: <Zap className="w-5 h-5" />, desc: '높은 수익을 위해 위험을 감수해요' }
    ];

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">사업 목표를 알려주세요</h3>
                <p className="text-gray-600">
                    운영 방식과 목표에 맞는 업종을 추천해드립니다
                </p>
            </div>

            {/* 운영 방식 (필수) */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <Target className="w-5 h-5" />
                    어떤 방식으로 운영하고 싶으신가요? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workStyles.map((style) => (
                        <button
                            key={style.value}
                            onClick={() => handleInputChange('workStyle', style.value)}
                            disabled={loading}
                            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                businessGoals.workStyle === style.value
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded ${businessGoals.workStyle === style.value ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                    {style.icon}
                                </div>
                                <div>
                                    <span className="font-medium block">{style.label}</span>
                                    <span className="text-sm opacity-75">{style.desc}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 위험 성향 (필수) */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <TrendingUp className="w-5 h-5" />
                    위험에 대한 성향은 어떠신가요? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {riskTolerances.map((risk) => (
                        <button
                            key={risk.value}
                            onClick={() => handleInputChange('riskTolerance', risk.value)}
                            disabled={loading}
                            className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                                businessGoals.riskTolerance === risk.value
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                                businessGoals.riskTolerance === risk.value ? 'bg-orange-100' : 'bg-gray-100'
                            }`}>
                                {risk.icon}
                            </div>
                            <span className="font-medium block">{risk.label}</span>
                            <span className="text-sm opacity-75">{risk.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 선택 요약 */}
            {(businessGoals.workStyle || businessGoals.riskTolerance) && (
                <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-gray-800 mb-2">선택하신 사업 목표:</h4>
                    <div className="space-y-2 text-sm">
                        {businessGoals.workStyle && (
                            <div>
                                <span className="font-medium">운영 방식:</span>{' '}
                                <span className="text-purple-600">
                                    {workStyles.find(w => w.value === businessGoals.workStyle)?.label}
                                </span>
                            </div>
                        )}
                        {businessGoals.riskTolerance && (
                            <div>
                                <span className="font-medium">위험 성향:</span>{' '}
                                <span className="text-orange-600">
                                    {riskTolerances.find(r => r.value === businessGoals.riskTolerance)?.label}
                                </span>
                            </div>
                        )}
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
