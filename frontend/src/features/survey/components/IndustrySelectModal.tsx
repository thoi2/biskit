// src/features/survey/components/IndustrySelectModal.tsx (자동 확장 + excludeCodes 수정)
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, Search, X, Star } from 'lucide-react';
import storeCategories from '@/lib/data/store_categories.json';

interface CategoryData {
    상권업종대분류코드: string;
    상권업종대분류명: string;
    상권업종중분류코드: string;
    상권업종중분류명: string;
    상권업종소분류코드: string;
    상권업종소분류명: string;
}

interface AIRecommendation {
    industryCode: string;
    industryName: string;
    category: string;
    reason: string;
    score: number;
}

type CategoryTree = Record<string, Record<string, CategoryData[]>>;

interface IndustrySelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (category: CategoryData) => void;
    title?: string;
    excludeCodes?: string[];
    aiRecommendations?: AIRecommendation[];
}

function makeCategoryTree(categories: CategoryData[]): CategoryTree {
    const tree: CategoryTree = {};

    categories.forEach(category => {
        const major = category.상권업종대분류명;
        const mid = category.상권업종중분류명;

        tree[major] ??= {};
        tree[major][mid] ??= [];
        tree[major][mid].push(category);
    });

    return tree;
}

export default function IndustrySelectModal({
                                                isOpen,
                                                onClose,
                                                onSelect,
                                                title = '업종 선택',
                                                excludeCodes = [],
                                                aiRecommendations = []
                                            }: IndustrySelectModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedMajor, setExpandedMajor] = useState<string[]>([]);
    const [expandedMinor, setExpandedMinor] = useState<string[]>([]);

    const categoryTree = useMemo(() => {
        return makeCategoryTree(storeCategories as CategoryData[]);
    }, []);

    // 🎯 검색 시 자동 확장
    useEffect(() => {
        if (!searchTerm.trim()) {
            setExpandedMajor([]);
            setExpandedMinor([]);
            return;
        }

        const term = searchTerm.toLowerCase();
        const newExpandedMajor: string[] = [];
        const newExpandedMinor: string[] = [];

        Object.entries(categoryTree).forEach(([major, minors]) => {
            let shouldExpandMajor = false;

            // 대분류 이름이 매치되면 전체 확장
            if (major.toLowerCase().includes(term)) {
                shouldExpandMajor = true;
                Object.keys(minors).forEach(minor => {
                    newExpandedMinor.push(minor);
                });
            } else {
                // 중분류나 소분류가 매치되면 해당 부분만 확장
                Object.entries(minors).forEach(([minor, subs]) => {
                    if (minor.toLowerCase().includes(term)) {
                        shouldExpandMajor = true;
                        newExpandedMinor.push(minor);
                    } else if (subs.some(sub => sub.상권업종소분류명.toLowerCase().includes(term))) {
                        shouldExpandMajor = true;
                        newExpandedMinor.push(minor);
                    }
                });
            }

            if (shouldExpandMajor) {
                newExpandedMajor.push(major);
            }
        });

        setExpandedMajor(newExpandedMajor);
        setExpandedMinor(newExpandedMinor);
    }, [searchTerm, categoryTree]);

    // AI 추천 업종들을 CategoryData 형태로 변환
    const aiRecommendationCategories = useMemo(() => {
        const categories = storeCategories as CategoryData[];
        return aiRecommendations
            .map(ai => categories.find(cat => cat.상권업종소분류코드 === ai.industryCode))
            .filter((cat): cat is CategoryData => !!cat && !excludeCodes.includes(cat.상권업종소분류코드));
    }, [aiRecommendations, excludeCodes]);

    // 검색 결과 필터링 (AI 추천 제외한 일반 카테고리)
    const filteredTree = useMemo(() => {
        const aiCodes = aiRecommendationCategories.map(cat => cat.상권업종소분류코드);

        if (!searchTerm) {
            return Object.entries(categoryTree);
        }

        const term = searchTerm.toLowerCase();
        const result: [string, Record<string, CategoryData[]>][] = [];

        Object.entries(categoryTree).forEach(([major, minors]) => {
            const filteredMinors: Record<string, CategoryData[]> = {};
            const hasMajorMatch = major.toLowerCase().includes(term);

            Object.entries(minors).forEach(([minor, subs]) => {
                const hasMinorMatch = minor.toLowerCase().includes(term);
                const filteredSubs = subs.filter(sub =>
                    sub.상권업종소분류명.toLowerCase().includes(term) &&
                    !excludeCodes.includes(sub.상권업종소분류코드) &&
                    !aiCodes.includes(sub.상권업종소분류코드)
                );

                if (hasMajorMatch || hasMinorMatch || filteredSubs.length > 0) {
                    const filteredSubsForDisplay = (hasMajorMatch || hasMinorMatch)
                        ? subs.filter(sub =>
                            !excludeCodes.includes(sub.상권업종소분류코드) &&
                            !aiCodes.includes(sub.상권업종소분류코드)
                        )
                        : filteredSubs;

                    if (filteredSubsForDisplay.length > 0) {
                        filteredMinors[minor] = filteredSubsForDisplay;
                    }
                }
            });

            if (Object.keys(filteredMinors).length > 0) {
                result.push([major, filteredMinors]);
            }
        });

        return result;
    }, [categoryTree, searchTerm, excludeCodes, aiRecommendationCategories]);

    // 검색된 AI 추천 업종들
    const filteredAIRecommendations = useMemo(() => {
        if (!searchTerm) return aiRecommendationCategories;

        const term = searchTerm.toLowerCase();
        return aiRecommendationCategories.filter(cat =>
            cat.상권업종소분류명.toLowerCase().includes(term) ||
            cat.상권업종중분류명.toLowerCase().includes(term) ||
            cat.상권업종대분류명.toLowerCase().includes(term)
        );
    }, [aiRecommendationCategories, searchTerm]);

    const highlightSearchTerm = (text: string) => {
        if (!searchTerm) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <mark key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    const toggle = (list: string[], value: string, setter: (list: string[]) => void) => {
        setter(list.includes(value) ? list.filter(x => x !== value) : [...list, value]);
    };

    const handleClose = () => {
        setSearchTerm('');
        setExpandedMajor([]);
        setExpandedMinor([]);
        onClose();
    };

    const handleSelect = (category: CategoryData) => {
        onSelect(category);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* 검색창 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="업종명을 검색해주세요 (예: 카페, 미용실, 편의점)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* 콘텐츠 영역 */}
                <div className="max-h-96 overflow-y-auto p-6">
                    {/* AI 추천 업종 섹션 */}
                    {filteredAIRecommendations.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-200">
                                <Star className="w-5 h-5 text-purple-600" />
                                <h4 className="font-semibold text-purple-800">AI 추천 업종</h4>
                            </div>
                            <div className="space-y-2">
                                {filteredAIRecommendations.map(category => {
                                    const aiRec = aiRecommendations.find(ai => ai.industryCode === category.상권업종소분류코드);

                                    return (
                                        <button
                                            key={category.상권업종소분류코드}
                                            onClick={() => handleSelect(category)}
                                            className="w-full p-3 text-left hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 bg-purple-25"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-purple-600" />
                                                        <span className="font-medium text-purple-800">
                                                            {highlightSearchTerm(category.상권업종소분류명)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-purple-600 mt-1">
                                                        {category.상권업종대분류명} &gt; {category.상권업종중분류명}
                                                    </p>
                                                    {aiRec && (
                                                        <p className="text-xs text-purple-500 mt-1 line-clamp-2">
                                                            {aiRec.reason}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-3">
                                                    {aiRec && aiRec.score > 0 && ( // 🎯 스코어가 0보다 클 때만 표시
                                                        <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                                            {aiRec.score > 100 ? Math.round(aiRec.score / 100) : Math.round(aiRec.score)}점
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 전체 업종 카테고리 섹션 */}
                    {filteredTree.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                <h4 className="font-semibold text-gray-800">전체 업종</h4>
                            </div>
                            <div className="space-y-1">
                                {filteredTree.map(([major, minors]) => {
                                    const isMajorExpanded = expandedMajor.includes(major);

                                    return (
                                        <div key={major}>
                                            <button
                                                onClick={() => toggle(expandedMajor, major, setExpandedMajor)}
                                                className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <ChevronRight
                                                    className={`w-4 h-4 transition-transform ${
                                                        isMajorExpanded ? 'rotate-90' : ''
                                                    }`}
                                                />
                                                <span className="font-medium text-gray-800">
                                                    {highlightSearchTerm(major)}
                                                </span>
                                            </button>

                                            {isMajorExpanded && (
                                                <div className="ml-6 space-y-1">
                                                    {Object.entries(minors).map(([minor, subs]) => {
                                                        const isMinorExpanded = expandedMinor.includes(minor);

                                                        return (
                                                            <div key={minor}>
                                                                <button
                                                                    onClick={() => toggle(expandedMinor, minor, setExpandedMinor)}
                                                                    className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                                                >
                                                                    <ChevronRight
                                                                        className={`w-3 h-3 transition-transform ${
                                                                            isMinorExpanded ? 'rotate-90' : ''
                                                                        }`}
                                                                    />
                                                                    <span className="text-gray-700">
                                                                        {highlightSearchTerm(minor)}
                                                                    </span>
                                                                </button>

                                                                {isMinorExpanded && (
                                                                    <div className="ml-6 space-y-1">
                                                                        {subs.map(sub => (
                                                                            <button
                                                                                key={sub.상권업종소분류코드}
                                                                                onClick={() => handleSelect(sub)}
                                                                                className="w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors text-sm text-gray-600 hover:text-gray-800 flex items-center justify-between"
                                                                            >
                                                                                <span>
                                                                                    {highlightSearchTerm(sub.상권업종소분류명)}
                                                                                </span>
                                                                                <span className="text-xs text-gray-400">
                                                                                    {sub.상권업종소분류코드}
                                                                                </span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 검색 결과 없음 */}
                    {filteredTree.length === 0 && filteredAIRecommendations.length === 0 && searchTerm && (
                        <div className="text-center py-8 text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>검색 결과가 없습니다.</p>
                            <p className="text-sm">다른 검색어를 시도해보세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
