'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Badge } from '@/lib/components/ui/badge';
import { ScrollArea } from '@/lib/components/ui/scroll-area';
import { ChevronRight, Search, Filter, X, CheckSquare, Square, Star, User } from 'lucide-react';
import storeCategories from '@/lib/data/store_categories.json';
import { useMapStore } from '@/features/map/store/mapStore';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useIndustryStore } from '@/features/survey/store/industryStore';
import { useAuth } from '@/features/auth/hooks/useAuth';

type Raw = {
  상권업종대분류명: string;
  상권업종중분류명: string;
  상권업종소분류명: string;
  상권업종소분류코드?: string;
};

type Tree = Record<string, Record<string, string[]>>;

function makeTree(rows: Raw[]): Tree {
  const tree: Tree = {};
  rows.forEach(r => {
    const {
      상권업종대분류명: major,
      상권업종중분류명: mid,
      상권업종소분류명: sub,
    } = r;
    tree[major] ??= {};
    tree[major][mid] ??= [];
    tree[major][mid].push(sub);
  });
  return tree;
}

const businessCategories = makeTree(storeCategories as Raw[]);

export function StoreFilter() {
  const { stores } = useStoreStore();
  const { selectedCategories, setSelectedCategories } = useMapStore();
  const { userIndustries, fetchUserIndustries } = useIndustryStore();
  const { user } = useAuth(); // 🎯 로그인 상태 확인

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMajor, setExpandedMajor] = useState<string[]>([]);
  const [expandedMinor, setExpandedMinor] = useState<string[]>([]);

  const toggle = (list: string[], v: string, setter: (s: string[]) => void) =>
      setter(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  // 🎯 로그인된 사용자만 업종 정보 로드
  useEffect(() => {
    if (user) {
      fetchUserIndustries();
    }
  }, [user, fetchUserIndustries]);

  // 전체 상가 데이터로 개수 계산
  const storeCountCache = useMemo(() => {
    const cache: Record<string, number> = {};

    Object.entries(businessCategories).forEach(([major, minors]) => {
      Object.entries(minors).forEach(([minor, subs]) => {
        subs.forEach(sub => {
          cache[sub] = stores.filter(store => {
            const storeCategoryName = store.categoryName || store.bizCategoryCode;
            return storeCategoryName.includes(sub);
          }).length;
        });
      });
    });

    return cache;
  }, [stores]);

  // 🎯 로그인된 사용자만 추천 업종 표시
  const myRecommendedIndustries = useMemo(() => {
    // 🎯 로그인하지 않았거나 추천 업종이 없으면 빈 배열 반환
    if (!user || !userIndustries?.hasRecommendation) return [];

    const categories = storeCategories as Raw[];
    const recommendations = [
      userIndustries.industry1st && { code: userIndustries.industry1st, rank: 1, emoji: '🥇' },
      userIndustries.industry2nd && { code: userIndustries.industry2nd, rank: 2, emoji: '🥈' },
      userIndustries.industry3rd && { code: userIndustries.industry3rd, rank: 3, emoji: '🥉' }
    ].filter((item): item is { code: string; rank: number; emoji: string } => !!item);

    return recommendations.map(item => {
      const category = categories.find(cat => cat.상권업종소분류코드 === item.code);
      const categoryName = category?.상권업종소분류명 || item.code;

      return {
        ...item,
        name: categoryName,
        isSelected: selectedCategories.includes(categoryName),
        count: category ? (storeCountCache[categoryName] || 0) : 0
      };
    });
  }, [user, userIndustries, selectedCategories, storeCountCache]);

  // 검색 결과에 따른 자동 확장 기능
  useEffect(() => {
    if (!searchTerm) return;

    const term = searchTerm.toLowerCase();
    const newExpandedMajor: string[] = [];
    const newExpandedMinor: string[] = [];

    Object.entries(businessCategories).forEach(([major, minors]) => {
      let shouldExpandMajor = false;

      if (major.toLowerCase().includes(term)) {
        shouldExpandMajor = true;
      }

      Object.entries(minors).forEach(([minor, subs]) => {
        if (minor.toLowerCase().includes(term)) {
          shouldExpandMajor = true;
          newExpandedMinor.push(minor);
        }

        if (subs.some(sub => sub.toLowerCase().includes(term))) {
          shouldExpandMajor = true;
          newExpandedMinor.push(minor);
        }
      });

      if (shouldExpandMajor) {
        newExpandedMajor.push(major);
      }
    });

    setExpandedMajor(newExpandedMajor);
    setExpandedMinor(newExpandedMinor);
  }, [searchTerm]);

  // 캐시된 결과를 사용하는 함수들
  const getStoreCountForCategory = (categoryName: string) => {
    return storeCountCache[categoryName] || 0;
  };

  const getMajorStoreCount = useMemo(() => {
    return (major: string) => {
      const allSubs = Object.values(businessCategories[major]).flat();
      return allSubs.reduce((sum, sub) => sum + (storeCountCache[sub] || 0), 0);
    };
  }, [storeCountCache]);

  const getMinorStoreCount = useMemo(() => {
    return (major: string, minor: string) => {
      const subs = businessCategories[major][minor];
      return subs.reduce((sum, sub) => sum + (storeCountCache[sub] || 0), 0);
    };
  }, [storeCountCache]);

  // 향상된 필터링 로직
  const filtered = useMemo(() => {
    if (!searchTerm) {
      return Object.entries(businessCategories);
    }

    const term = searchTerm.toLowerCase();
    return Object.entries(businessCategories).filter(
        ([major, minors]) => {
          if (major.toLowerCase().includes(term)) {
            return true;
          }

          return Object.entries(minors).some(
              ([minor, subs]) =>
                  minor.toLowerCase().includes(term) ||
                  subs.some(sub => sub.toLowerCase().includes(term))
          );
        }
    );
  }, [searchTerm]);

  const handleMajorToggle = (major: string) => {
    const allSubs = Object.values(businessCategories[major]).flat();
    const isAllSelected = allSubs.every(sub => selectedCategories.includes(sub));

    if (isAllSelected) {
      setSelectedCategories(selectedCategories.filter(cat => !allSubs.includes(cat)));
    } else {
      setSelectedCategories([...new Set([...selectedCategories, ...allSubs])]);
    }
  };

  const handleMinorToggle = (major: string, minor: string) => {
    const subs = businessCategories[major][minor];
    const isAllSelected = subs.every(sub => selectedCategories.includes(sub));

    if (isAllSelected) {
      setSelectedCategories(selectedCategories.filter(cat => !subs.includes(cat)));
    } else {
      setSelectedCategories([...new Set([...selectedCategories, ...subs])]);
    }
  };

  // 내 추천 업종 토글
  const handleMyRecommendationToggle = (industryName: string) => {
    if (selectedCategories.includes(industryName)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== industryName));
    } else {
      setSelectedCategories([...selectedCategories, industryName]);
    }
  };

  const getMajorSelectionState = (major: string) => {
    const allSubs = Object.values(businessCategories[major]).flat();
    const selectedCount = allSubs.filter(sub => selectedCategories.includes(sub)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === allSubs.length) return 'all';
    return 'partial';
  };

  const getMinorSelectionState = (major: string, minor: string) => {
    const subs = businessCategories[major][minor];
    const selectedCount = subs.filter(sub => selectedCategories.includes(sub)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === subs.length) return 'all';
    return 'partial';
  };

  // 검색어 하이라이트 함수
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

  return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" /> 업종별 필터
            </span>
            {selectedCategories.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategories([])}
                    className="hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  전체삭제
                </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 h-full">
          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                placeholder={`업종 검색... (총 ${stores.length}개 상가)`}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                }
                className="pl-10 transition-all focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 선택 배지 */}
          {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  선택된 업종 ({selectedCategories.length}개)
                </p>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {selectedCategories.map(cat => (
                      <Badge
                          key={cat}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 transition-all duration-200 transform hover:scale-105"
                          onClick={() =>
                              setSelectedCategories(selectedCategories.filter(c => c !== cat))
                          }
                      >
                        {cat} <X className="w-3 h-3 ml-1" />
                      </Badge>
                  ))}
                </div>
              </div>
          )}

          {/* 카테고리 트리 */}
          <ScrollArea className="flex-1 h-[calc(100vh-520px)]">
            <div className="space-y-1">
              {/* 🎯 내 추천 업종 섹션 (로그인된 사용자만) */}
              {myRecommendedIndustries.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-purple-800 text-sm">내 추천 업종</h4>
                      <Star className="w-4 h-4 text-purple-600" />
                    </div>

                    <div className="space-y-2">
                      {myRecommendedIndustries.map(industry => (
                          <Button
                              key={industry.code}
                              variant={industry.isSelected ? 'secondary' : 'ghost'}
                              className={`w-full justify-between p-2 text-sm transition-all duration-200 ${
                                  industry.isSelected
                                      ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                      : 'hover:bg-purple-100 text-purple-700'
                              }`}
                              onClick={() => handleMyRecommendationToggle(industry.name)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{industry.emoji}</span>
                              <span className="text-left font-medium">
                                {industry.name}
                              </span>
                            </div>

                            {industry.count > 0 && (
                                <Badge
                                    variant="outline"
                                    className={`bg-purple-50 text-purple-700 border-purple-200 ${
                                        industry.isSelected ? 'bg-purple-200 text-purple-800' : ''
                                    }`}
                                >
                                  {industry.count}개
                                </Badge>
                            )}
                          </Button>
                      ))}
                    </div>
                  </div>
              )}

              {/* 기존 카테고리 트리 */}
              {filtered.map(([major, minors]) => {
                const majorState = getMajorSelectionState(major);
                const majorCount = getMajorStoreCount(major);
                const isMajorExpanded = expandedMajor.includes(major);

                return (
                    <div key={major} className="overflow-hidden">
                      <div className="flex items-center gap-1">
                        {/* 대분류 토글 버튼 */}
                        <Button
                            variant="ghost"
                            className="flex-1 justify-start p-2 hover:bg-gray-100 transition-all duration-200"
                            onClick={() => toggle(expandedMajor, major, setExpandedMajor)}
                        >
                          <ChevronRight
                              className={`w-4 h-4 mr-2 transition-transform duration-300 ease-in-out ${
                                  isMajorExpanded ? 'rotate-90' : 'rotate-0'
                              }`}
                          />
                          <span className="flex-1 text-left">
                            {highlightSearchTerm(major)}
                          </span>
                          <Badge
                              variant="outline"
                              className={`ml-auto transition-all duration-200 ${
                                  majorCount > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                              }`}
                          >
                            {majorCount}개
                          </Badge>
                        </Button>

                        {/* 대분류 선택 체크박스 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="px-2 hover:bg-blue-50 transition-colors"
                            onClick={() => handleMajorToggle(major)}
                        >
                          {majorState === 'all' ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : majorState === 'partial' ? (
                              <Square className="w-4 h-4 text-blue-400 fill-blue-100" />
                          ) : (
                              <Square className="w-4 h-4 transition-colors hover:text-blue-400" />
                          )}
                        </Button>
                      </div>

                      {/* 중분류 펼치기 */}
                      <div
                          className={`ml-6 overflow-hidden transition-all duration-300 ease-in-out ${
                              isMajorExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <div className="space-y-1 py-1">
                          {Object.entries(minors).map(([minor, subs]) => {
                            const minorState = getMinorSelectionState(major, minor);
                            const minorCount = getMinorStoreCount(major, minor);
                            const isMinorExpanded = expandedMinor.includes(minor);

                            return (
                                <div key={minor} className="overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    {/* 중분류 토글 버튼 */}
                                    <Button
                                        variant="ghost"
                                        className="flex-1 justify-start p-2 text-sm hover:bg-gray-50 transition-all duration-200"
                                        onClick={() => toggle(expandedMinor, minor, setExpandedMinor)}
                                    >
                                      <ChevronRight
                                          className={`w-3 h-3 mr-2 transition-transform duration-300 ease-in-out ${
                                              isMinorExpanded ? 'rotate-90' : 'rotate-0'
                                          }`}
                                      />
                                      <span className="flex-1 text-left">
                                        {highlightSearchTerm(minor)}
                                      </span>
                                      <Badge
                                          variant="outline"
                                          className={`ml-auto transition-all duration-200 ${
                                              minorCount > 0 ? 'bg-green-50 text-green-700 border-green-200' : ''
                                          }`}
                                      >
                                        {minorCount}개
                                      </Badge>
                                    </Button>

                                    {/* 중분류 선택 체크박스 */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="px-2 hover:bg-green-50 transition-colors"
                                        onClick={() => handleMinorToggle(major, minor)}
                                    >
                                      {minorState === 'all' ? (
                                          <CheckSquare className="w-4 h-4 text-green-600" />
                                      ) : minorState === 'partial' ? (
                                          <Square className="w-4 h-4 text-green-400 fill-green-100" />
                                      ) : (
                                          <Square className="w-4 h-4 transition-colors hover:text-green-400" />
                                      )}
                                    </Button>
                                  </div>

                                  {/* 소분류 펼치기 */}
                                  <div
                                      className={`ml-6 overflow-hidden transition-all duration-300 ease-in-out ${
                                          isMinorExpanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
                                      }`}
                                  >
                                    <div className="space-y-1 py-1">
                                      {subs.map(sub => {
                                        const subCount = getStoreCountForCategory(sub);
                                        const isSelected = selectedCategories.includes(sub);

                                        return (
                                            <Button
                                                key={sub}
                                                variant={isSelected ? 'secondary' : 'ghost'}
                                                className={`w-full justify-between p-2 text-sm transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() =>
                                                    setSelectedCategories(
                                                        selectedCategories.includes(sub)
                                                            ? selectedCategories.filter(c => c !== sub)
                                                            : [...selectedCategories, sub],
                                                    )
                                                }
                                            >
                                              <span className="text-left flex-1">
                                                {highlightSearchTerm(sub)}
                                              </span>
                                              {subCount > 0 && (
                                                  <Badge
                                                      variant="outline"
                                                      className={`bg-gray-50 text-gray-700 transition-all duration-200 ${
                                                          isSelected ? 'bg-blue-50 text-blue-700' : ''
                                                      }`}
                                                  >
                                                    {subCount}
                                                  </Badge>
                                              )}
                                            </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
  );
}
