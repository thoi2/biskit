// src/features/survey/components/steps/BasicInfoStep.tsx (지역 복수선택 + 전문직)
'use client';

import { useState, useEffect } from 'react';
import { Building, MapPin, DollarSign, TrendingUp, Briefcase, GraduationCap } from 'lucide-react';
import { SurveyStepProps, BasicInfo } from '../../types/survey';

export default function BasicInfoStep({
                                          data,
                                          onChange,
                                          loading = false
                                      }: SurveyStepProps) {
    const [basicInfo, setBasicInfo] = useState<BasicInfo>({
        businessType: data.basicInfo?.businessType || '',
        regions: data.basicInfo?.regions || [], // 🎯 배열로 변경
        budget: data.basicInfo?.budget || '',
        experience: data.basicInfo?.experience || '',
        hasSpecialty: data.basicInfo?.hasSpecialty || '', // 🎯 전문직 여부
        specialty: data.basicInfo?.specialty || '' // 🎯 전문 분야
    });

    useEffect(() => {
        const currentData = data.basicInfo;
        const hasChanges =
            basicInfo.businessType !== (currentData?.businessType || '') ||
            JSON.stringify(basicInfo.regions) !== JSON.stringify(currentData?.regions || []) || // 🎯 배열 비교
            basicInfo.budget !== (currentData?.budget || '') ||
            basicInfo.experience !== (currentData?.experience || '') ||
            basicInfo.hasSpecialty !== (currentData?.hasSpecialty || '') ||
            basicInfo.specialty !== (currentData?.specialty || '');

        if (hasChanges) {
            onChange({ basicInfo });
        }
    }, [basicInfo]);

    const handleInputChange = (field: keyof BasicInfo, value: string) => {
        setBasicInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 🎯 지역 토글 함수 (복수선택)
    const handleRegionToggle = (value: string) => {
        setBasicInfo(prev => {
            const currentRegions = prev.regions || [];
            const isSelected = currentRegions.includes(value);

            const newRegions = isSelected
                ? currentRegions.filter(region => region !== value)
                : [...currentRegions, value];

            return {
                ...prev,
                regions: newRegions
            };
        });
    };

    const businessTypes = [
        { value: 'startup', label: '개인 창업', icon: '👤' },
        { value: 'company', label: '법인 사업', icon: '🏢' },
        { value: 'franchise', label: '프랜차이즈', icon: '🏪' },
        { value: 'online', label: '온라인 사업', icon: '💻' },
        { value: 'professional', label: '전문 서비스', icon: '💼' }, // 🎯 전문직 추가
        { value: 'side', label: '부업/사이드', icon: '⚡' }
    ];

    const seoulDistricts = [
        { value: 'gangnam', label: '강남구', feature: '고급 서비스업' },
        { value: 'gangdong', label: '강동구', feature: '주거 상권' },
        { value: 'gangbuk', label: '강북구', feature: '전통 상권' },
        { value: 'gangseo', label: '강서구', feature: '공항·물류' },
        { value: 'gwanak', label: '관악구', feature: '대학가' },
        { value: 'gwangjin', label: '광진구', feature: '젊은층 상권' },
        { value: 'guro', label: '구로구', feature: '산업·IT' },
        { value: 'geumcheon', label: '금천구', feature: '제조·물류' },
        { value: 'nowon', label: '노원구', feature: '교육 특화' },
        { value: 'dobong', label: '도봉구', feature: '주거 밀집' },
        { value: 'dongdaemun', label: '동대문구', feature: '패션·도매' },
        { value: 'dongjak', label: '동작구', feature: '대학가' },
        { value: 'mapo', label: '마포구', feature: '홍대·문화' },
        { value: 'seodaemun', label: '서대문구', feature: '대학가' },
        { value: 'seocho', label: '서초구', feature: '고급 주거' },
        { value: 'seongdong', label: '성동구', feature: '뚝섬·카페' },
        { value: 'seongbuk', label: '성북구', feature: '대학가' },
        { value: 'songpa', label: '송파구', feature: '잠실·쇼핑' },
        { value: 'yangcheon', label: '양천구', feature: '목동·교육' },
        { value: 'yeongdeungpo', label: '영등포구', feature: '금융·업무' },
        { value: 'yongsan', label: '용산구', feature: '국제업무' },
        { value: 'eunpyeong', label: '은평구', feature: '주거 상권' },
        { value: 'jongno', label: '종로구', feature: '전통·관광' },
        { value: 'jung', label: '중구', feature: '명동·관광' },
        { value: 'jungnang', label: '중랑구', feature: '주거 밀집' }
    ];

    const budgets = [
        { value: 'under_1000', label: '1천만원 미만', icon: '💰' },
        { value: '1000_3000', label: '1천만원 ~ 3천만원', icon: '💎' },
        { value: '3000_5000', label: '3천만원 ~ 5천만원', icon: '💍' },
        { value: '5000_10000', label: '5천만원 ~ 1억원', icon: '👑' },
        { value: 'over_10000', label: '1억원 이상', icon: '🏰' }
    ];

    const experiences = [
        { value: 'none', label: '처음입니다', icon: '🌱' },
        { value: 'planning', label: '준비 중입니다', icon: '📋' },
        { value: 'experience', label: '사업 경험이 있습니다', icon: '💼' },
        { value: 'expert', label: '전문가입니다', icon: '🎯' }
    ];

    // 🎯 전문직 여부 선택지
    const specialtyOptions = [
        { value: 'yes', label: '네, 전문직 경험이 있어요', icon: '👨‍💼' },
        { value: 'no', label: '아니요, 일반적인 사업을 원해요', icon: '🏪' }
    ];

    // 🎯 전문 분야 선택지
    const specialtyFields = [
        { value: 'medical', label: '의료업 (병원, 치과, 약국)' },
        { value: 'legal', label: '법무/회계 (법무사, 세무사, 회계사)' },
        { value: 'education', label: '교육업 (학원, 과외, 온라인 교육)' },
        { value: 'consulting', label: '컨설팅 (경영, IT, 마케팅)' },
        { value: 'design', label: '디자인/크리에이티브 (광고, 스튜디오)' },
        { value: 'tech', label: 'IT/개발 (앱 개발, 웹 서비스)' },
        { value: 'finance', label: '금융/보험 (투자, 보험 설계)' },
        { value: 'other', label: '기타 전문 분야' }
    ];

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">기본 정보를 알려주세요</h3>
                <p className="text-gray-600">
                    맞춤형 업종 추천을 위해 필요한 기본 정보를 입력해주세요
                </p>
            </div>

            {/* 사업 유형 */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <Building className="w-5 h-5" />
                    어떤 형태의 사업을 계획하고 계신가요? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {businessTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => handleInputChange('businessType', type.value)}
                            disabled={loading}
                            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                basicInfo.businessType === type.value
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{type.icon}</span>
                                <span className="font-medium">{type.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 🎯 전문직 여부 */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <Briefcase className="w-5 h-5" />
                    전문직 경험이나 자격증이 있으신가요? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specialtyOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleInputChange('hasSpecialty', option.value)}
                            disabled={loading}
                            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                basicInfo.hasSpecialty === option.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{option.icon}</span>
                                <span className="font-medium">{option.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 🎯 전문 분야 선택 (전문직인 경우만) */}
            {basicInfo.hasSpecialty === 'yes' && (
                <div>
                    <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                        <GraduationCap className="w-5 h-5" />
                        어떤 전문 분야인가요?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {specialtyFields.map((field) => (
                            <button
                                key={field.value}
                                onClick={() => handleInputChange('specialty', field.value)}
                                disabled={loading}
                                className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                                    basicInfo.specialty === field.value
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <span className="text-sm font-medium">{field.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 🎯 서울 구/동 복수선택 */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <MapPin className="w-5 h-5" />
                    서울 어느 구에서 사업을 하실 예정인가요? (복수선택 가능)
                    <span className="text-sm text-purple-600 font-normal">
                        ({basicInfo.regions?.length || 0}개 선택됨)
                    </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {seoulDistricts.map((district) => {
                        const isSelected = basicInfo.regions?.includes(district.value);
                        return (
                            <button
                                key={district.value}
                                onClick={() => handleRegionToggle(district.value)}
                                disabled={loading}
                                className={`relative p-3 rounded-lg border transition-all duration-200 text-left ${
                                    isSelected
                                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className="text-sm font-medium">{district.label}</div>
                                <div className="text-xs opacity-75">{district.feature}</div>
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 예산 */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <DollarSign className="w-5 h-5" />
                    초기 투자 예산은 얼마 정도 생각하고 계신가요? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {budgets.map((budget) => (
                        <button
                            key={budget.value}
                            onClick={() => handleInputChange('budget', budget.value)}
                            disabled={loading}
                            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                basicInfo.budget === budget.value
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{budget.icon}</span>
                                <span className="font-medium">{budget.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 경험 수준 */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <TrendingUp className="w-5 h-5" />
                    사업 경험은 어느 정도이신가요? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {experiences.map((exp) => (
                        <button
                            key={exp.value}
                            onClick={() => handleInputChange('experience', exp.value)}
                            disabled={loading}
                            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                basicInfo.experience === exp.value
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{exp.icon}</span>
                                <span className="font-medium">{exp.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 선택 요약 */}
            {(basicInfo.businessType || (basicInfo.regions?.length || 0) > 0) && (
                <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-gray-800 mb-2">선택하신 정보:</h4>
                    <div className="space-y-2 text-sm">
                        {basicInfo.businessType && (
                            <div>
                                <span className="font-medium">사업 유형:</span>{' '}
                                <span className="text-purple-600">
                                    {businessTypes.find(t => t.value === basicInfo.businessType)?.label}
                                </span>
                            </div>
                        )}
                        {basicInfo.hasSpecialty && (
                            <div>
                                <span className="font-medium">전문직:</span>{' '}
                                <span className="text-blue-600">
                                    {basicInfo.hasSpecialty === 'yes' ? '있음' : '없음'}
                                    {basicInfo.specialty && ` (${specialtyFields.find(s => s.value === basicInfo.specialty)?.label})`}
                                </span>
                            </div>
                        )}
                        {(basicInfo.regions?.length || 0) > 0 && (
                            <div>
                                <span className="font-medium">희망 지역:</span>{' '}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {basicInfo.regions?.map(region => {
                                        const district = seoulDistricts.find(d => d.value === region);
                                        return (
                                            <span key={region} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                                {district?.label} ({district?.feature})
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
