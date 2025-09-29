// src/features/survey/components/steps/InterestAreasStep.tsx (복수선택)
'use client';

import { useState, useEffect } from 'react';
import { Heart, Users, Coffee, ShoppingBag, Car, Building, Monitor, Utensils } from 'lucide-react';
import { SurveyStepProps, InterestAreas } from '../../types/survey';

export default function InterestAreasStep({
                                              data,
                                              onChange,
                                              loading = false
                                          }: SurveyStepProps) {
    const [interestAreas, setInterestAreas] = useState<InterestAreas>({
        categories: data.interestAreas?.categories || [], // 🎯 복수선택을 위한 배열
        specificInterests: data.interestAreas?.specificInterests || []
    });

    // 🎯 무한 루프 해결
    useEffect(() => {
        onChange({ interestAreas });
    }, [interestAreas]);

    // 🎯 카테고리 토글 (복수선택)
    const handleCategoryToggle = (value: string) => {
        setInterestAreas(prev => {
            const currentCategories = prev.categories || [];
            const isSelected = currentCategories.includes(value);

            const newCategories = isSelected
                ? currentCategories.filter(cat => cat !== value) // 제거
                : [...currentCategories, value]; // 추가

            return {
                ...prev,
                categories: newCategories
            };
        });
    };

    // 🎯 세부 관심사 토글 (복수선택)
    const handleSpecificInterestToggle = (value: string) => {
        setInterestAreas(prev => {
            const currentInterests = prev.specificInterests || [];
            const isSelected = currentInterests.includes(value);

            const newInterests = isSelected
                ? currentInterests.filter(interest => interest !== value)
                : [...currentInterests, value];

            return {
                ...prev,
                specificInterests: newInterests
            };
        });
    };

    const categories = [
        { value: 'food', label: '음식/요리', icon: <Utensils className="w-6 h-6" />, color: 'bg-orange-500' },
        { value: 'beauty', label: '뷰티/건강', icon: <Heart className="w-6 h-6" />, color: 'bg-pink-500' },
        { value: 'retail', label: '리테일/쇼핑', icon: <ShoppingBag className="w-6 h-6" />, color: 'bg-blue-500' },
        { value: 'service', label: '서비스업', icon: <Users className="w-6 h-6" />, color: 'bg-green-500' },
        { value: 'transport', label: '운송/배달', icon: <Car className="w-6 h-6" />, color: 'bg-yellow-500' },
        { value: 'realestate', label: '부동산', icon: <Building className="w-6 h-6" />, color: 'bg-gray-500' },
        { value: 'tech', label: 'IT/기술', icon: <Monitor className="w-6 h-6" />, color: 'bg-purple-500' },
        { value: 'cafe', label: '카페/디저트', icon: <Coffee className="w-6 h-6" />, color: 'bg-amber-500' }
    ];

    const specificInterests = [
        { value: 'franchise', label: '프랜차이즈' },
        { value: 'online', label: '온라인 사업' },
        { value: 'local', label: '동네 상권' },
        { value: 'premium', label: '고급 서비스' },
        { value: 'budget', label: '저렴한 가격대' },
        { value: 'trendy', label: '트렌디한 업종' },
        { value: 'stable', label: '안정적인 업종' },
        { value: 'innovative', label: '혁신적인 업종' }
    ];

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">관심 있는 분야를 선택해주세요</h3>
                <p className="text-gray-600">
                    여러 개를 선택할 수 있습니다 (최소 1개 이상 선택)
                </p>
            </div>

            {/* 카테고리 선택 (복수선택) */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    어떤 업종 분야에 관심이 있으신가요?
                    <span className="text-sm text-purple-600 font-normal">
                        ({interestAreas.categories?.length || 0}개 선택됨)
                    </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((category) => {
                        const isSelected = interestAreas.categories?.includes(category.value);
                        return (
                            <button
                                key={category.value}
                                onClick={() => handleCategoryToggle(category.value)}
                                disabled={loading}
                                className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                                    isSelected
                                        ? `border-purple-500 bg-purple-50 text-purple-700 transform scale-105 shadow-lg`
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:scale-102'
                                } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 transition-all duration-200 text-white ${
                                    isSelected ? category.color : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {category.icon}
                                </div>
                                <span className="text-sm font-medium">{category.label}</span>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 세부 관심사 선택 (복수선택) */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    어떤 특성의 사업을 원하시나요?
                    <span className="text-sm text-purple-600 font-normal">
                        ({interestAreas.specificInterests?.length || 0}개 선택됨)
                    </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {specificInterests.map((interest) => {
                        const isSelected = interestAreas.specificInterests?.includes(interest.value);
                        return (
                            <button
                                key={interest.value}
                                onClick={() => handleSpecificInterestToggle(interest.value)}
                                disabled={loading}
                                className={`relative p-3 rounded-lg border transition-all duration-200 text-sm ${
                                    isSelected
                                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                {interest.label}
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 선택 요약 */}
            {(interestAreas.categories?.length || 0) > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-gray-800 mb-2">선택하신 관심 분야:</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {interestAreas.categories?.map(cat => {
                            const category = categories.find(c => c.value === cat);
                            return (
                                <span key={cat} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {category?.label}
                                </span>
                            );
                        })}
                    </div>
                    {(interestAreas.specificInterests?.length || 0) > 0 && (
                        <>
                            <h5 className="font-medium text-gray-700 mb-2">세부 특성:</h5>
                            <div className="flex flex-wrap gap-2">
                                {interestAreas.specificInterests?.map(interest => {
                                    const spec = specificInterests.find(s => s.value === interest);
                                    return (
                                        <span key={interest} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                                            {spec?.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </>
                    )}
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
