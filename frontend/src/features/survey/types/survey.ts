// src/features/survey/types/survey.ts (NavigationButtonsProps, ProgressIndicatorProps 추가)
export interface BasicInfo {
    businessType: string;
    regions: string[]; // 🎯 복수선택으로 변경
    budget: string;
    experience: string;
    hasSpecialty?: string; // 🎯 전문직 여부 추가
    specialty?: string; // 🎯 전문 분야 추가
}

export interface InterestAreas {
    categories: string[];
    specificInterests: string[];
}

export interface BusinessGoals {
    workStyle: string;
    riskTolerance: string;
    expectedIncome?: string;
    timeCommitment?: string;
    primaryGoal?: string;
    timeline?: string;
}

export interface AIRecommendationData {
    surveyResponses: {
        questionId: number;
        selectedOptions: number[];
    }[];
    recommendations?: IndustryRecommendation[];
    summary?: string;
}

export interface IndustryRecommendation {
    industryCode: string;
    industryName: string;
    category: string;
    reason: string;
    score: number;
}

export interface FinalSelection {
    selectedIndustries: {
        industry1st: string;
        industry2nd: string;
        industry3rd: string;
    };
    notes?: string;
}

export interface SurveyFormData {
    basicInfo?: BasicInfo;
    interestAreas?: InterestAreas;
    businessGoals?: BusinessGoals;
    aiRecommendation?: AIRecommendationData;
    finalSelection?: FinalSelection;
}

export interface SurveyStepProps {
    data: SurveyFormData;
    onChange: (data: Partial<SurveyFormData>) => void;
    loading?: boolean;
}

// 🎯 NavigationButtonsProps도 완전 수정
export interface NavigationButtonsProps {
    currentStep: number;
    totalSteps: number;
    canProceed: boolean;
    loading: boolean;
    onPrev: () => void;
    onNext: () => void;
    onComplete?: () => Promise<void> | void;
    showPrev?: boolean;
    showNext?: boolean;
    nextLabel?: string;
    prevLabel?: string;
    isCompleting?: boolean;
    isLastStep?: boolean;
}

// 🎯 ProgressIndicatorProps 추가
export interface ProgressIndicatorProps {
    current: number; // 필수로 변경 (undefined 불가)
    total: number; // 🎯 total 속성 추가
    currentStep?: number; // 호환성을 위해 옵셔널로 유지
    totalSteps?: number; // 호환성을 위해 옵셔널로 유지
    steps: {
        id: string;
        title: string;
    }[];
    completed?: boolean[];
    className?: string;
}

// 🎯 SurveyStep 설정 타입 추가
export interface SurveyStep {
    id: string;
    title: string;
    component: React.ComponentType<SurveyStepProps>;
    validation?: (data: SurveyFormData) => boolean;
    required?: boolean;
}

// 🎯 설문조사 상태 관리 타입
export interface SurveyState {
    currentStep: number;
    formData: SurveyFormData;
    isValid: boolean;
    isComplete: boolean;
    errors: Record<string, string>;
}

// 🎯 AI 관련 추가 타입들
export interface AIProcessStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
}

export interface AIRecommendationRequest {
    age?: string | null;
    experience?: string[] | null;
    budget?: string | null;
    interests?: string[] | null;
    workStyle?: string | null;
    locations?: string[] | null;
    riskTolerance?: string | null;
    hasSpecialty?: string | null;
    specialty?: string | null;
    primaryGoal?: string | null;
    timeline?: string | null;
    expectedIncome?: string | null;
    timeCommitment?: string | null;
    surveyResponses?: Array<{
        questionId: number;
        selectedOptions: number[];
    }>;
}

export interface AIRecommendationResponse {
    success: boolean;
    recommendations: IndustryRecommendation[];
    summary?: string;
    errorMessage?: string;
}

// 🎯 사용자 업종 정보 타입
export interface UserIndustryData {
    userId: number;
    industry1st: string | null;
    industry2nd: string | null;
    industry3rd: string | null;
    surveyCompletedAt: string | null;
    hasRecommendation: boolean;
}

// 🎯 설문 완료 요청 타입
export interface SurveyCompleteRequest {
    industry1st: string;
    industry2nd: string;
    industry3rd: string;
    notes?: string;
}

// 🎯 업종 수정 요청 타입
export interface IndustryUpdateRequest {
    industry1st?: string;
    industry2nd?: string;
    industry3rd?: string;
}

// 🎯 일반적인 유틸리티 타입들
export type StepId = 'basic' | 'interests' | 'goals' | 'ai' | 'final';

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
};

export type SurveyMode = 'new' | 'edit' | 'retry';
