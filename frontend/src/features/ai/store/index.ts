// src/features/ai/store.ts
import { create } from 'zustand';
import type {
    BuildingRecommendation,
    SingleBuildingRecommendationResponse,
    RangeRecommendationResponse,
    CategoryInfo,
    RecommendationMarker,
} from '../types';

// ✅ 배열에서 대표값 추출 함수
const getDisplaySurvivalRate = (rates: number[] | number): number => {
    if (Array.isArray(rates)) {
        if (rates.length === 0) return 0;
        return rates[rates.length - 1];
    }
    return typeof rates === 'number' ? rates : 0;
};

// ✅ 생존율 기준 점수 계산 함수
const calculateCategoryScore = (survivalRate: number[]): number => {
    if (!Array.isArray(survivalRate) || survivalRate.length === 0) return 0;

    // 5년차 생존율 우선, 없으면 평균
    if (survivalRate.length >= 5) {
        return survivalRate[4]; // 5년차 (인덱스 4)
    }
    return survivalRate.reduce((sum, rate) => sum + rate, 0) / survivalRate.length;
};

interface RecommendationState {
    // ✅ 건물별 통합 관리
    buildings: BuildingRecommendation[];
    recommendationMarkers: RecommendationMarker[];
    isLoading: boolean;
    error: string | null;

    // 액션들
    startRequest: () => void;
    setRequestError: (error: string) => void;

    // ✅ Single 결과 추가 (중복 방지 + 순위 재계산)
    addSingleResult: (result: SingleBuildingRecommendationResponse) => void;

    // ✅ Range 결과 추가
    addRangeResult: (result: RangeRecommendationResponse) => void;

    // ✅ DB 결과 병합
    mergeWithBackendResults: (backendResults: any[]) => void;

    // 마커 관리
    setRecommendationMarkers: (markers: RecommendationMarker[]) => void;
    addRecommendationMarker: (marker: RecommendationMarker) => void;
    syncMarkersWithBuildings: () => void;

    // 건물 관리
    deleteBuilding: (buildingId: number) => void;
    deleteCategoryFromBuilding: (buildingId: number, categoryId: number) => void;
    toggleBuildingVisibility: (buildingId: number) => void;
    updateBuildingFavorite: (buildingId: number, isFavorite: boolean) => void;

    // ✅ 건물 맨 위로 이동
    moveBuildingToTop: (buildingId: number) => void;

    // 하이라이트 관리
    highlightMarker: (buildingId: number) => void;
    clearHighlight: () => void;

    // 초기화
    clearRecommendations: () => void;
}

export const useRecommendationStore = create<RecommendationState>()((set, get) => ({
    buildings: [],
    recommendationMarkers: [],
    isLoading: false,
    error: null,

    startRequest: () => set({ isLoading: true, error: null }),
    setRequestError: (error: string) => set({ error, isLoading: false }),

    // ✅ Single 결과를 중복 체크 후 순위 재계산하여 추가

    // ✅ Range 결과를 건물별로 변환 후 추가

    // ✅ 백엔드 결과 병합

    // ✅ 건물 맨 위로 이동
    moveBuildingToTop: (buildingId: number) => {
        const { buildings } = get();

        const targetIndex = buildings.findIndex(b => b.building.building_id === buildingId);
        if (targetIndex <= 0) return; // 이미 맨 위거나 없음

        const newBuildings = [...buildings];
        const [targetBuilding] = newBuildings.splice(targetIndex, 1);
        newBuildings.unshift(targetBuilding);

        console.log('⬆️ [moveBuildingToTop] 맨 위로 이동:', buildingId);
        set({ buildings: newBuildings });
    },

    // ✅ 건물-마커 동기화
    syncMarkersWithBuildings: () => {
        const { buildings, recommendationMarkers } = get();

        console.log('🔄 [syncMarkersWithBuildings] 건물-마커 동기화:', buildings.length);

        if (buildings.length === 0) {
            set({ recommendationMarkers: [] });
            return;
        }

        // 기존 마커 상태 보존
        const existingStates = new Map();
        recommendationMarkers.forEach(marker => {
            if (marker.buildingId) {
                existingStates.set(marker.buildingId, {
                    hidden: marker.hidden || false,
                    isHighlighted: marker.isHighlighted || false
                });
            }
        });

        const newMarkers: RecommendationMarker[] = buildings.map(building => {
            const topCategory = building.categories[0];
            if (!topCategory) return null;

            const preservedState = existingStates.get(building.building.building_id) || {
                hidden: false,
                isHighlighted: false
            };

            return {
                id: `building-${building.building.building_id}`,
                buildingId: building.building.building_id,
                title: `건물 ${building.building.building_id}`,
                category: topCategory.category,
                lat: building.building.lat,
                lng: building.building.lng,
                survivalRate: getDisplaySurvivalRate(topCategory.survivalRate),
                type: 'recommendation' as const,
                source: building.source,
                isHighlighted: preservedState.isHighlighted,
                hidden: !building.isVisible || preservedState.hidden,
                color: building.source === 'db' ? 'purple' : building.source === 'range' ? 'green' : 'blue'
            };
        }).filter((marker): marker is RecommendationMarker => marker !== null);

        set({ recommendationMarkers: newMarkers });
    },

    // ✅ 건물 관리 액션들
    deleteBuilding: (buildingId: number) => {
        const { buildings, recommendationMarkers } = get();

        const filteredBuildings = buildings.filter(b => b.building.building_id !== buildingId);
        const filteredMarkers = recommendationMarkers.filter(m => m.buildingId !== buildingId);

        console.log('🗑️ [deleteBuilding]:', buildingId);
        set({
            buildings: filteredBuildings,
            recommendationMarkers: filteredMarkers
        });
    },

    // src/features/ai/store.ts의 해당 부분 수정

// ✅ Single 결과를 중복 체크 후 순위 재계산하여 추가
    addSingleResult: (result: SingleBuildingRecommendationResponse) => {
        const { buildings } = get();
        const buildingId = result.building.building_id;

        console.log('📥 [addSingleResult] 새 Single 결과:', buildingId);

        // 기존 건물 찾기
        const existingIndex = buildings.findIndex(b => b.building.building_id === buildingId);

        // 새로 받은 카테고리들
        const newCategories = result.result.map((cat, index) => ({
            category: cat.category,
            survivalRate: cat.survivalRate,
            rank: index + 1,
            sessionId: `single-${buildingId}-${Date.now()}`,
            isRangeResult: false // ✅ 명시적으로 추가
        }));

        if (existingIndex >= 0) {
            // ✅ 기존 건물이 있는 경우 - 중복 체크 & 병합
            const existing = buildings[existingIndex];
            const existingCategoryNames = new Set(existing.categories.map(c => c.category));

            // 중복되지 않은 새 카테고리만 필터링
            const uniqueNewCategories = newCategories.filter(newCat =>
                !existingCategoryNames.has(newCat.category)
            );

            console.log('🔍 [중복 체크]', {
                기존카테고리: existing.categories.length,
                새카테고리: newCategories.length,
                중복제거후: uniqueNewCategories.length
            });

            if (uniqueNewCategories.length > 0) {
                // ✅ 모든 카테고리 합쳐서 순위 재계산
                const allCategories = [...existing.categories, ...uniqueNewCategories];

                // 생존율 기준으로 정렬 후 순위 재할당
                const sortedCategories = allCategories
                    .map(cat => ({
                        category: cat.category,
                        survivalRate: cat.survivalRate,
                        sessionId: cat.sessionId,
                        isRangeResult: cat.isRangeResult || false, // ✅ 기본값 설정
                        score: calculateCategoryScore(cat.survivalRate)
                    }))
                    .sort((a, b) => b.score - a.score) // 내림차순
                    .map((cat, index) => ({
                        category: cat.category,
                        survivalRate: cat.survivalRate,
                        rank: index + 1, // ✅ 새로운 순위
                        sessionId: cat.sessionId,
                        isRangeResult: cat.isRangeResult // ✅ 속성 보존
                    }));

                // 기존 건물 업데이트
                const newBuildings = [...buildings];
                newBuildings[existingIndex] = {
                    ...existing,
                    categories: sortedCategories, // ✅ 순위 재계산된 카테고리들
                    lastUpdated: result.meta.last_at
                };

                console.log('✅ [건물 업데이트] 순위 재계산:', {
                    건물ID: buildingId,
                    총카테고리: sortedCategories.length,
                    새로추가: uniqueNewCategories.length
                });

                set({ buildings: newBuildings });
            } else {
                console.log('⏭️ [스킵] 모든 카테고리가 중복됨:', buildingId);
                // 중복이어도 하이라이트는 해야 함
                get().highlightMarker(buildingId);
                return; // 추가 처리 없이 종료
            }
        } else {
            // ✅ 새 건물 추가
            const newBuilding: BuildingRecommendation = {
                building: result.building,
                categories: newCategories,
                source: 'single',
                lastUpdated: result.meta.last_at,
                isVisible: true
            };

            const newBuildings = [newBuilding, ...buildings];
            console.log('✅ 새 건물 추가:', buildingId);
            set({ buildings: newBuildings });
        }

        set({ isLoading: false, error: null });

        // 마커 동기화 및 하이라이트
        setTimeout(() => {
            get().syncMarkersWithBuildings();
            get().highlightMarker(buildingId);
        }, 100);
    },

// ✅ Range 결과를 건물별로 변환 후 추가
    addRangeResult: (result: RangeRecommendationResponse) => {
        const { buildings } = get();

        console.log('📥 [addRangeResult] 새 Range 결과:', result.items.length, '개 건물');

        const newBuildings = [...buildings];
        const timestamp = new Date().toISOString();

        result.items.forEach((item, index) => {
            const buildingId = item.buildingId;
            const existingIndex = newBuildings.findIndex(b => b.building.building_id === buildingId);

            const rangeCategory: CategoryInfo = {
                category: item.category,
                survivalRate: item.survivalRate,
                rank: index + 1,
                isRangeResult: true, // ✅ Range 결과 표시
                sessionId: `range-${buildingId}-${Date.now()}`
            };

            if (existingIndex >= 0) {
                // 기존 건물에 Range 카테고리 추가 (중복 체크)
                const existing = newBuildings[existingIndex];
                const existingCategoryNames = new Set(existing.categories.map(c => c.category));

                if (!existingCategoryNames.has(item.category)) {
                    // ✅ 중복 안되면 추가 후 순위 재계산
                    const allCategories = [...existing.categories, rangeCategory];
                    const sortedCategories = allCategories
                        .map(cat => ({
                            category: cat.category,
                            survivalRate: cat.survivalRate,
                            sessionId: cat.sessionId,
                            isRangeResult: cat.isRangeResult || false, // ✅ 기본값 설정
                            score: calculateCategoryScore(cat.survivalRate)
                        }))
                        .sort((a, b) => b.score - a.score)
                        .map((cat, idx) => ({
                            category: cat.category,
                            survivalRate: cat.survivalRate,
                            rank: idx + 1,
                            sessionId: cat.sessionId,
                            isRangeResult: cat.isRangeResult // ✅ 속성 보존
                        }));

                    newBuildings[existingIndex] = {
                        ...existing,
                        categories: sortedCategories,
                        lastUpdated: timestamp
                    };
                }
            } else {
                // 새 건물 생성
                newBuildings.unshift({
                    building: {
                        building_id: buildingId,
                        lat: Number(item.lat),
                        lng: Number(item.lng)
                    },
                    categories: [rangeCategory],
                    source: 'range',
                    lastUpdated: timestamp,
                    isVisible: true
                });
            }
        });

        set({
            buildings: newBuildings,
            isLoading: false,
            error: null
        });

        // 마커 동기화
        setTimeout(() => get().syncMarkersWithBuildings(), 100);
    },

// ✅ 백엔드 결과 병합 (타입 안전성 확보)
    mergeWithBackendResults: (backendResults: any[]) => {
        console.log('🔄 [mergeWithBackendResults] DB 결과 병합:', backendResults.length);

        const backendBuildings: BuildingRecommendation[] = backendResults.map(item => ({
            building: {
                building_id: item.buildingId,
                lat: parseFloat(String(item.lat)),
                lng: parseFloat(String(item.lng))
            },
            categories: item.categories.map((cat: any, index: number) => ({
                category: cat.category,
                survivalRate: cat.survivalRate,
                rank: index + 1,
                isRangeResult: false, // ✅ DB 결과는 기본적으로 단일 검색 결과
                sessionId: `db-${item.buildingId}-${Date.now()}-${index}`
            })),
            source: 'db' as const,
            lastUpdated: new Date().toISOString(),
            isFavorite: item.favorite || false,
            isVisible: true
        }));

        const { buildings } = get();
        const mergedMap = new Map<number, BuildingRecommendation>();

        // 1. 백엔드 결과 먼저 추가
        backendBuildings.forEach(building => {
            mergedMap.set(building.building.building_id, building);
        });

        // 2. 현재 결과 추가 (중복되면 카테고리 병합)
        buildings.forEach(building => {
            const existing = mergedMap.get(building.building.building_id);
            if (existing && existing.source === 'db') {
                // DB 결과 + 현재 결과 카테고리 병합 (중복 제거)
                const existingCategoryNames = new Set(existing.categories.map(c => c.category));
                const uniqueCurrentCategories = building.categories.filter(c =>
                    !existingCategoryNames.has(c.category)
                );

                const allCategories = [...existing.categories, ...uniqueCurrentCategories];
                const sortedCategories = allCategories
                    .map(cat => ({
                        category: cat.category,
                        survivalRate: cat.survivalRate,
                        sessionId: cat.sessionId,
                        isRangeResult: cat.isRangeResult || false, // ✅ 기본값 설정
                        score: calculateCategoryScore(cat.survivalRate)
                    }))
                    .sort((a, b) => b.score - a.score)
                    .map((cat, idx) => ({
                        category: cat.category,
                        survivalRate: cat.survivalRate,
                        rank: idx + 1,
                        sessionId: cat.sessionId,
                        isRangeResult: cat.isRangeResult // ✅ 속성 보존
                    }));

                mergedMap.set(building.building.building_id, {
                    ...building,
                    categories: sortedCategories,
                    isFavorite: existing.isFavorite // DB의 즐겨찾기 상태 유지
                });
            } else {
                mergedMap.set(building.building.building_id, building);
            }
        });

        const mergedBuildings = Array.from(mergedMap.values());

        set({ buildings: mergedBuildings });
        setTimeout(() => get().syncMarkersWithBuildings(), 100);
    },

// ✅ 카테고리 삭제 시에도 타입 안전성 확보
    deleteCategoryFromBuilding: (buildingId: number, categoryId: number) => {
        const { buildings } = get();

        const updatedBuildings = buildings.map(building => {
            if (building.building.building_id === buildingId) {
                const filteredCategories = building.categories.filter(cat => cat.category_id !== categoryId);

                // ✅ 카테고리 삭제 후 순위 재계산 (속성 보존)
                const rerankedCategories = filteredCategories.map((cat, index) => ({
                    category: cat.category,
                    survivalRate: cat.survivalRate,
                    rank: index + 1,
                    sessionId: cat.sessionId,
                    isRangeResult: cat.isRangeResult || false // ✅ 속성 보존
                }));

                return {
                    ...building,
                    categories: rerankedCategories
                };
            }
            return building;
        }).filter(building => building.categories.length > 0); // 카테고리가 없는 건물 제거

        console.log('🗑️ [deleteCategoryFromBuilding]:', buildingId, categoryId);
        set({ buildings: updatedBuildings });
        setTimeout(() => get().syncMarkersWithBuildings(), 100);
    },

    toggleBuildingVisibility: (buildingId: number) => {
        const { buildings } = get();

        const updatedBuildings = buildings.map(building =>
            building.building.building_id === buildingId
                ? { ...building, isVisible: !building.isVisible }
                : building
        );

        set({ buildings: updatedBuildings });
        setTimeout(() => get().syncMarkersWithBuildings(), 100);
    },

    updateBuildingFavorite: (buildingId: number, isFavorite: boolean) => {
        const { buildings } = get();

        const updatedBuildings = buildings.map(building =>
            building.building.building_id === buildingId
                ? { ...building, isFavorite }
                : building
        );

        set({ buildings: updatedBuildings });
    },

    // 마커 관리
    setRecommendationMarkers: (markers: RecommendationMarker[]) => {
        console.log('🎯 [setRecommendationMarkers]:', markers.length);
        set({ recommendationMarkers: markers });
    },

    addRecommendationMarker: (marker: RecommendationMarker) => {
        const { recommendationMarkers } = get();
        const existingIndex = recommendationMarkers.findIndex(m =>
            m.buildingId === marker.buildingId || m.id === marker.id
        );

        let newMarkers: RecommendationMarker[];
        if (existingIndex >= 0) {
            newMarkers = [...recommendationMarkers];
            newMarkers[existingIndex] = { ...marker, isHighlighted: false };
        } else {
            newMarkers = [...recommendationMarkers, { ...marker, isHighlighted: false }];
        }

        set({ recommendationMarkers: newMarkers });
    },

    highlightMarker: (buildingId: number) => {
        const { recommendationMarkers } = get();

        const updatedMarkers = recommendationMarkers.map(marker => ({
            ...marker,
            isHighlighted: marker.buildingId === buildingId
        }));

        set({ recommendationMarkers: updatedMarkers });
    },

    clearHighlight: () => {
        const { recommendationMarkers } = get();

        const updatedMarkers = recommendationMarkers.map(marker => ({
            ...marker,
            isHighlighted: false
        }));

        set({ recommendationMarkers: updatedMarkers });
    },

    clearRecommendations: () => {
        console.log('🧹 [clearRecommendations] 모든 추천 초기화');
        set({
            buildings: [],
            recommendationMarkers: [],
            error: null
        });
    }
}));

// ✅ 편의성을 위한 스토어 상태 selectors
export const useBuildings = () => useRecommendationStore(state => state.buildings);
export const useRecommendationMarkers = () => useRecommendationStore(state => state.recommendationMarkers);
export const useRecommendationLoading = () => useRecommendationStore(state => state.isLoading);
export const useRecommendationError = () => useRecommendationStore(state => state.error);
