// src/features/ai/components/GmsDetailModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BarChart3, TrendingDown, MapPin, Brain, Zap, Target, CheckCircle } from 'lucide-react';
import { getIndustryExplanation } from '@/features/ai/api';

// ✅ 로딩 단계 정의
const loadingSteps = [
    {
        id: 1,
        icon: Brain,
        title: "GNN 모델 초기화 중...",
        description: "그래프 신경망의 가중치를 로드하고 있습니다",
        duration: 3000
    },
    {
        id: 2,
        icon: Zap,
        title: "SHARP 모델 활성화 중...",
        description: "공간 분석을 위한 딥러닝 모델을 준비합니다",
        duration: 3000
    },
    {
        id: 3,
        icon: Target,
        title: "업종별 생존 패턴 분석 중...",
        description: "5년간의 창업/폐업 데이터를 학습합니다",
        duration: 3000
    },
    {
        id: 4,
        icon: Brain,
        title: "위치 기반 리스크 계산 중...",
        description: "주변 상권과의 상관관계를 분석합니다",
        duration: 3000
    },
    {
        id: 5,
        icon: CheckCircle,
        title: "AI 응답 생성 중...",
        description: "GPT 모델이 맞춤형 분석 결과를 작성합니다",
        duration: 3000
    }
];

interface GmsDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildingId: number;
    category: string;
    rank?: number;
    lat: number;
    lng: number;
    survivalRate?: number[];
}

export function GmsDetailModal({
                                   isOpen,
                                   onClose,
                                   buildingId,
                                   category,
                                   rank,
                                   lat,
                                   lng,
                                   survivalRate
                               }: GmsDetailModalProps) {
    const [explanation, setExplanation] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        if (isOpen && !explanation) {
            loadExplanation();
        }
    }, [isOpen, explanation]);

    const loadExplanation = async () => {
        setIsLoading(true);
        setCurrentStep(0);
        setCompletedSteps([]);

        try {
            // ✅ 단계별 로딩 시뮬레이션
            for (let i = 0; i < loadingSteps.length; i++) {
                setCurrentStep(i);

                // 실제 API는 마지막 단계에서 호출
                if (i === loadingSteps.length - 1) {
                    console.log('🔍 GMS 설명 API 호출:', { buildingId, category });

                    const response = await getIndustryExplanation({
                        building_id: buildingId,
                        category: category
                    });

                    const result = response?.body || response;
                    setExplanation(result?.explanation || '설명을 가져올 수 없습니다.');

                    // 마지막 단계 완료
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    // 다른 단계들은 시뮬레이션
                    await new Promise(resolve => setTimeout(resolve, loadingSteps[i].duration));
                }

                setCompletedSteps(prev => [...prev, i]);
            }

        } catch (error) {
            console.error('❌ GMS 설명 실패:', error);
            setExplanation('설명을 가져오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
            setCurrentStep(-1);
        }
    };

    // 모달이 닫힐 때 상태 초기화
    useEffect(() => {
        if (!isOpen) {
            setExplanation('');
            setIsLoading(false);
            setCurrentStep(0);
            setCompletedSteps([]);
        }
    }, [isOpen]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const displayLat = Number(lat).toFixed(4);
    const displayLng = Number(lng).toFixed(4);

    // ✅ 로딩 컴포넌트
    const LoadingSteps = () => (
        <div className="py-8 px-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                    <Brain className="w-4 h-4 mr-2" />
                    GMS AI 엔진 가동 중
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    AI 모델이 분석을 수행하고 있습니다
                </h3>
                <p className="text-gray-600 text-sm">
                    잠시만 기다려주세요. 복잡한 연산이 진행 중입니다...
                </p>
            </div>

            <div className="space-y-4">
                {loadingSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === index;
                    const isCompleted = completedSteps.includes(index);
                    const isWaiting = index > currentStep;

                    return (
                        <div
                            key={step.id}
                            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-500 ${
                                isActive ? 'border-blue-400 bg-blue-50 shadow-lg transform scale-105' :
                                    isCompleted ? 'border-green-400 bg-green-50' :
                                        'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                isActive ? 'bg-blue-500 text-white animate-pulse' :
                                    isCompleted ? 'bg-green-500 text-white' :
                                        'bg-gray-300 text-gray-500'
                            }`}>
                                {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <Icon className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />
                                )}
                            </div>

                            <div className="ml-4 flex-1">
                                <div className={`font-medium transition-colors duration-300 ${
                                    isActive ? 'text-blue-800' :
                                        isCompleted ? 'text-green-800' :
                                            'text-gray-600'
                                }`}>
                                    {step.title}
                                </div>
                                <div className={`text-sm mt-1 transition-colors duration-300 ${
                                    isActive ? 'text-blue-600' :
                                        isCompleted ? 'text-green-600' :
                                            'text-gray-500'
                                }`}>
                                    {step.description}
                                </div>
                            </div>

                            {isActive && (
                                <div className="ml-4">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ✅ 전체 진행률 표시 */}
            <div className="mt-6 bg-gray-200 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(completedSteps.length / loadingSteps.length) * 100}%` }}
                ></div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
                {completedSteps.length} / {loadingSteps.length} 단계 완료
            </div>
        </div>
    );

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                GMS 분석 상세보기
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                AI 기반 업종별 생존 분석 결과
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="닫기 (ESC)"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* ✅ 로딩 중이면 단계별 로딩 표시 */}
                {isLoading ? (
                    <LoadingSteps />
                ) : (
                    <>
                        {/* 기본 정보 */}
                        <div className="p-6 bg-gray-50 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 건물 정보 */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🏢 건물 정보</h3>
                                    <div className="space-y-2 bg-white p-4 rounded-lg">
                                        <div>
                                            <span className="text-gray-500 text-sm">건물 ID:</span>
                                            <span className="ml-2 font-medium text-lg">#{buildingId}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">분석 업종:</span>
                                            <span className="ml-2 font-medium text-blue-600 text-lg">{category}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">추천 순위:</span>
                                            <span className="ml-2 font-medium">
                                                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                                                    #{rank || 'N/A'}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                위도: {displayLat} | 경도: {displayLng}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 생존율 정보 */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 연도별 생존율</h3>
                                    {survivalRate && survivalRate.length > 0 ? (
                                        <div className="bg-white p-4 rounded-lg">
                                            <div className="grid grid-cols-5 gap-3">
                                                {survivalRate.map((rate, index) => (
                                                    <div key={index} className="text-center">
                                                        <div className={`text-lg font-bold mb-1 ${
                                                            rate >= 70 ? 'text-green-600' :
                                                                rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {(100 - rate).toFixed(1)}%
                                                        </div>
                                                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                                            {index + 1}년차
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            생존율
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <TrendingDown className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-800">
                                                        5년간 평균 생존율: {(100 - (survivalRate.reduce((sum, rate) => sum + rate, 0) / survivalRate.length)).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-4 rounded-lg text-center text-gray-500">
                                            생존율 데이터가 없습니다
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* AI 분석 설명 */}
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                🤖 AI 분석 결과
                                <span className="text-sm font-normal text-gray-500">(GMS + GPT 융합)</span>
                            </h3>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6">
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                                        {explanation}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 푸터 */}
                        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                            <div className="text-sm text-gray-500">
                                분석 기준: GNN + SHARP 모델 | 5년간 창업/폐업 데이터 | 제공: GMS AI
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
