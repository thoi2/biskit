// src/features/survey/components/steps/FinalSelectionStep.tsx (저장 버튼 수정)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Save, Trash2, RotateCcw, CheckCircle, ChevronDown } from 'lucide-react';
import { SurveyStepProps } from '../../types/survey';
import { surveyApi } from '../../api/surveyApi';
import { useIndustryStore } from '../../store/industryStore';
import IndustrySelectModal from '../IndustrySelectModal';
import storeCategories from '@/lib/data/store_categories.json';

interface CategoryData {
    상권업종대분류코드: string;
    상권업종대분류명: string;
    상권업종중분류코드: string;
    상권업종중분류명: string;
    상권업종소분류코드: string;
    상권업종소분류명: string;
}

export default function FinalSelectionStep({
                                               data,
                                               onChange,
                                               loading = false,
                                               onComplete // 🎯 완료 콜백 추가
                                           }: SurveyStepProps & { onComplete?: () => void }) {
    const { userIndustries, fetchUserIndustries } = useIndustryStore();
    const aiRecommendations = data.aiRecommendation?.recommendations || [];

    const [finalSelection, setFinalSelection] = useState({
        selectedIndustries: {
            industry1st: userIndustries?.industry1st || aiRecommendations[0]?.industryCode || '',
            industry2nd: userIndustries?.industry2nd || aiRecommendations[1]?.industryCode || '',
            industry3rd: userIndustries?.industry3rd || aiRecommendations[2]?.industryCode || ''
        },
        notes: data.finalSelection?.notes || ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showIndustryModal, setShowIndustryModal] = useState<'industry1st' | 'industry2nd' | 'industry3rd' | null>(null);

    const categories = useMemo(() => storeCategories as CategoryData[], []);

    useEffect(() => {
        if (userIndustries && !finalSelection.selectedIndustries.industry1st) {
            setFinalSelection(prev => ({
                ...prev,
                selectedIndustries: {
                    industry1st: userIndustries.industry1st || aiRecommendations[0]?.industryCode || '',
                    industry2nd: userIndustries.industry2nd || aiRecommendations[1]?.industryCode || '',
                    industry3rd: userIndustries.industry3rd || aiRecommendations[2]?.industryCode || ''
                }
            }));
        }
    }, [userIndustries]);

    useEffect(() => {
        onChange({
            finalSelection: finalSelection
        });
    }, [finalSelection, onChange]);

    const getIndustryName = (code: string) => {
        if (!code) return '업종을 선택해주세요';

        const aiIndustry = aiRecommendations.find(rec => rec.industryCode === code);
        if (aiIndustry) return aiIndustry.industryName;

        const category = categories.find(cat => cat.상권업종소분류코드 === code);
        return category?.상권업종소분류명 || code;
    };

    const handleIndustrySelect = (category: CategoryData) => {
        if (!showIndustryModal) return;

        setFinalSelection(prev => ({
            ...prev,
            selectedIndustries: {
                ...prev.selectedIndustries,
                [showIndustryModal]: category.상권업종소분류코드
            }
        }));
    };

    const getExcludeCodes = () => {
        const currentPosition = showIndustryModal;
        if (!currentPosition) return [];

        return Object.entries(finalSelection.selectedIndustries)
            .filter(([position, code]) => position !== currentPosition && code)
            .map(([_, code]) => code);
    };

    // 🎯 저장 후 모달 닫기
    const handleSave = async () => {
        try {
            setIsSaving(true);

            await surveyApi.completeSurvey({
                industry1st: finalSelection.selectedIndustries.industry1st,
                industry2nd: finalSelection.selectedIndustries.industry2nd,
                industry3rd: finalSelection.selectedIndustries.industry3rd
            });

            setLastSaved(new Date());

            // 🎯 저장 성공 후 모달 닫기
            setTimeout(() => {
                fetchUserIndustries();
                onComplete?.(); // 부모에게 완료 알림
            }, 1000);

        } catch (error) {
            console.error('저장 실패:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setFinalSelection(prev => ({
            ...prev,
            selectedIndustries: {
                industry1st: aiRecommendations[0]?.industryCode || '',
                industry2nd: aiRecommendations[1]?.industryCode || '',
                industry3rd: aiRecommendations[2]?.industryCode || ''
            }
        }));
    };

    const handleDelete = async () => {
        if (!confirm('저장된 업종 정보를 삭제하시겠습니까?')) return;

        try {
            setIsSaving(true);
            await surveyApi.deleteRecommendations();
            setTimeout(() => {
                fetchUserIndustries();
                handleReset();
            }, 500);
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCodes = Object.values(finalSelection.selectedIndustries).filter(Boolean);
    const isComplete = selectedCodes.length === 3;

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">최종 업종 선택</h3>
                <p className="text-gray-600">
                    {userIndustries?.hasRecommendation
                        ? '기존에 저장된 업종 정보입니다. 수정 후 저장하세요.'
                        : 'AI 추천을 바탕으로 3개 업종을 선택해주세요.'
                    }
                </p>
            </div>

            {/* 카테고리 모달 사용하는 선택 UI */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 space-y-6">
                {/* 1순위 */}
                <div>
                    <label className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        🥇 1순위 업종
                    </label>
                    <button
                        onClick={() => setShowIndustryModal('industry1st')}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                        <span>{getIndustryName(finalSelection.selectedIndustries.industry1st)}</span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* 2순위 */}
                <div>
                    <label className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        🥈 2순위 업종
                    </label>
                    <button
                        onClick={() => setShowIndustryModal('industry2nd')}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-gray-500 focus:outline-none text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                        <span>{getIndustryName(finalSelection.selectedIndustries.industry2nd)}</span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* 3순위 */}
                <div>
                    <label className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        🥉 3순위 업종
                    </label>
                    <button
                        onClick={() => setShowIndustryModal('industry3rd')}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                        <span>{getIndustryName(finalSelection.selectedIndustries.industry3rd)}</span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            <IndustrySelectModal
                isOpen={!!showIndustryModal}
                onClose={() => setShowIndustryModal(null)}
                onSelect={handleIndustrySelect}
                title={`업종 선택 (${
                    showIndustryModal === 'industry1st' ? '1순위' :
                        showIndustryModal === 'industry2nd' ? '2순위' : '3순위'
                })`}
                excludeCodes={getExcludeCodes()}
                aiRecommendations={aiRecommendations}
            />

            {/* 🎯 저장/삭제/초기화 버튼 - 문구 수정 */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={!isComplete || isSaving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? '저장 중...' : '저장하기'}
                </button>

                <button
                    onClick={handleReset}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    AI 추천으로 초기화
                </button>

                {userIndustries?.hasRecommendation && (
                    <button
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        삭제하기
                    </button>
                )}
            </div>

            {/* 저장 상태 표시 */}
            {lastSaved && (
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">
                            {lastSaved.toLocaleTimeString()}에 저장되었습니다
                        </span>
                    </div>
                </div>
            )}

            {/* 선택 요약 */}
            {isComplete && (
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-4">선택하신 업종:</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🥇</span>
                            <span className="font-medium">1순위: {getIndustryName(finalSelection.selectedIndustries.industry1st)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🥈</span>
                            <span className="font-medium">2순위: {getIndustryName(finalSelection.selectedIndustries.industry2nd)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🥉</span>
                            <span className="font-medium">3순위: {getIndustryName(finalSelection.selectedIndustries.industry3rd)}</span>
                        </div>
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
