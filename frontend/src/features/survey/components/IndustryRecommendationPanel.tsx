// src/features/survey/components/IndustryRecommendationPanel.tsx (모달 컴포넌트 사용)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Settings, Trash2, RotateCcw, Sparkles, Save, X, Edit, ChevronDown } from 'lucide-react';
import { useIndustryStore } from '../store/industryStore';
import SurveyModal from './SurveyModal';
import IndustrySelectModal from './IndustrySelectModal';
import storeCategories from '@/lib/data/store_categories.json';

interface CategoryData {
    상권업종대분류코드: string;
    상권업종대분류명: string;
    상권업종중분류코드: string;
    상권업종중분류명: string;
    상권업종소분류코드: string;
    상권업종소분류명: string;
}

export default function IndustryRecommendationPanel() {
    const {
        userIndustries,
        loading,
        isInitialized,
        fetchUserIndustries,
        deleteUserIndustries,
        updateUserIndustries
    } = useIndustryStore();

    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [hasCalledOnce, setHasCalledOnce] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        industry1st: '',
        industry2nd: '',
        industry3rd: ''
    });

    // 🎯 업종 선택 모달 상태
    const [showIndustryModal, setShowIndustryModal] = useState<'industry1st' | 'industry2nd' | 'industry3rd' | null>(null);

    const categories = useMemo(() => storeCategories as CategoryData[], []);

    useEffect(() => {
        if (!hasCalledOnce && !isInitialized && !loading) {
            setHasCalledOnce(true);
            fetchUserIndustries();
        }
    }, []);

    useEffect(() => {
        if (isEditing && userIndustries) {
            setEditData({
                industry1st: userIndustries.industry1st || '',
                industry2nd: userIndustries.industry2nd || '',
                industry3rd: userIndustries.industry3rd || ''
            });
        }
    }, [isEditing, userIndustries]);

    // 업종 코드로 이름 찾기
    const getIndustryName = (code: string | null): string => {
        if (!code) return '미설정';

        const category = categories.find(cat => cat.상권업종소분류코드 === code);
        return category?.상권업종소분류명 || code;
    };

    // 🎯 업종 선택 처리
    const handleIndustrySelect = (category: CategoryData) => {
        if (!showIndustryModal) return;

        setEditData(prev => ({
            ...prev,
            [showIndustryModal]: category.상권업종소분류코드
        }));
    };

    // 🎯 제외할 업종 코드들 (중복 선택 방지)
    const getExcludeCodes = () => {
        const currentPosition = showIndustryModal;
        if (!currentPosition) return [];

        return Object.entries(editData)
            .filter(([position, code]) => position !== currentPosition && code)
            .map(([_, code]) => code);
    };

    const handleDeleteRecommendations = async () => {
        if (!confirm('저장된 업종 추천을 삭제하시겠습니까?')) return;

        try {
            await deleteUserIndustries();
            alert('업종 추천이 삭제되었습니다.');
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleEditSave = async () => {
        try {
            await updateUserIndustries(editData);
            setIsEditing(false);
            alert('업종 정보가 수정되었습니다.');
        } catch (error) {
            console.error('수정 실패:', error);
            alert('수정 중 오류가 발생했습니다.');
        }
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditData({
            industry1st: userIndustries?.industry1st || '',
            industry2nd: userIndustries?.industry2nd || '',
            industry3rd: userIndustries?.industry3rd || ''
        });
    };

    const handleModalClose = () => {
        setShowSurveyModal(false);
        setTimeout(() => {
            fetchUserIndustries();
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-purple-600">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">업종 정보 로딩 중...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {!userIndustries?.hasRecommendation ? (
                <div className="text-center py-6">
                    <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">
                        AI 맞춤 업종 추천
                    </h3>
                    <p className="text-purple-600 mb-6">
                        간단한 설문조사를 통해 최적의 창업 업종을 추천받으세요
                    </p>

                    <button
                        onClick={() => setShowSurveyModal(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        업종 추천받기
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">내 추천 업종</h3>
                            <p className="text-sm text-gray-500">
                                {userIndustries?.surveyCompletedAt && (
                                    `${new Date(userIndustries.surveyCompletedAt).toLocaleDateString()} 설문 완료`
                                )}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={handleEditToggle}
                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        수정
                                    </button>

                                    <button
                                        onClick={handleDeleteRecommendations}
                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        삭제
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleEditSave}
                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        저장
                                    </button>

                                    <button
                                        onClick={handleEditCancel}
                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        취소
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 편집 모드 UI */}
                    {isEditing ? (
                        <div className="space-y-3 mb-4">
                            {/* 1순위 수정 */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">🥇 1순위 업종</label>
                                <button
                                    onClick={() => setShowIndustryModal('industry1st')}
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center justify-between"
                                >
                                    <span>{getIndustryName(editData.industry1st) || '업종을 선택해주세요'}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* 2순위 수정 */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">🥈 2순위 업종</label>
                                <button
                                    onClick={() => setShowIndustryModal('industry2nd')}
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-between"
                                >
                                    <span>{getIndustryName(editData.industry2nd) || '업종을 선택해주세요'}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* 3순위 수정 */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">🥉 3순위 업종</label>
                                <button
                                    onClick={() => setShowIndustryModal('industry3rd')}
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-between"
                                >
                                    <span>{getIndustryName(editData.industry3rd) || '업종을 선택해주세요'}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 보기 모드 UI */
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                <span className="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {getIndustryName(userIndustries?.industry1st)}
                                </span>
                                <span className="text-lg ml-auto">🥇</span>
                            </div>

                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                <span className="w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {getIndustryName(userIndustries?.industry2nd)}
                                </span>
                                <span className="text-lg ml-auto">🥈</span>
                            </div>

                            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                                <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {getIndustryName(userIndustries?.industry3rd)}
                                </span>
                                <span className="text-lg ml-auto">🥉</span>
                            </div>
                        </div>
                    )}

                    {/* 새로운 추천받기 */}
                    {!isEditing && (
                        <div className="text-center">
                            <button
                                onClick={() => setShowSurveyModal(true)}
                                className="text-sm text-purple-600 hover:text-purple-800 inline-flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                새로운 추천받기
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 🎯 재사용 가능한 업종 선택 모달 */}
            <IndustrySelectModal
                isOpen={!!showIndustryModal}
                onClose={() => setShowIndustryModal(null)}
                onSelect={handleIndustrySelect}
                title={`업종 선택 (${
                    showIndustryModal === 'industry1st' ? '1순위' :
                        showIndustryModal === 'industry2nd' ? '2순위' : '3순위'
                })`}
                excludeCodes={getExcludeCodes()}
                aiRecommendations={[]} // 🎯 편집 모드에서는 AI 추천 없음
            />

            {showSurveyModal && (
                <SurveyModal
                    open={showSurveyModal}
                    onClose={handleModalClose}
                />
            )}
        </>
    );
}
