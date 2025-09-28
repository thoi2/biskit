// src/features/ai/store.ts
import { create } from 'zustand';
import type {
    BuildingRecommendation,
    SingleBuildingRecommendationResponse,
    RangeRecommendationResponse,
    CategoryInfo,
    RecommendationMarker,
} from '../types';

// ✅ 배열에서 대표값 추출 함수 (폐업률)
const getDisplayFailureRate = (rates: number[] | number): number => {
    if (Array.isArray(rates)) {
        if (rates.length === 0) return 100;
        return rates[rates.length - 1];
    }
    return typeof rates === 'number' ? rates : 100;
};

// ✅ 폐업률 기준 점수 계산 함수 (낮을수록 좋음)
const calculateCategoryScore = (failureRate: number[]): number => {
    if (!Array.isArray(failureRate) || failureRate.length === 0) return 100;

    if (failureRate.length >= 5) {
        return failureRate[4]; // 5년차 폐업률
    }
    return failureRate.reduce((sum, rate) => sum + rate, 0) / failureRate.length;
};

// ✅ 카테고리 병합 로직
const mergeCategories = (existing: CategoryInfo[], newCategories: CategoryInfo[]) => {
    const merged = [...existing];

    newCategories.forEach(newCat => {
        const existingIndex = merged.findIndex(cat => cat.category === newCat.category);

        if (existingIndex >= 0) {
            // 같은 업종이면 더 최신 데이터로 교체
            merged[existingIndex] = {
                ...newCat,
                rank: newCat.rank || merged[existingIndex].rank
            };
        } else {
            // 새로운 업종이면 추가
            merged.push(newCat);
        }
    });

    // 폐업률 기준으로 재정렬
    return merged
        .map(cat => ({
            ...cat,
            score: calculateCategoryScore(cat.survivalRate)
        }))
        .sort((a, b) => a.score - b.score)
        .map((cat, index) => ({
            category: cat.category,
            survivalRate: cat.survivalRate,
            rank: index + 1,
            sessionId: cat.sessionId,
            isRangeResult: cat.isRangeResult
        }));
};

// ✅ 스마트 병합 로직
const smartMerge = (
    existingBuilding: BuildingRecommendation,
    newData: any,
    newSource: 'single' | 'range' | 'db'
): BuildingRecommendation => {
    const now = Date.now();

    // 1. 새로운 검색 결과가 DB 데이터를 덮어씀
    if (newSource !== 'db' && existingBuilding.source === 'db') {
        console.log('🔄 DB 데이터를 새 검색 결과로 교체');
        return {
            building: newData.building,
            categories: newData.categories || [],
            source: newSource,
            timestamp: now,
            lastUpdated: new Date().toISOString(),
            isFavorite: existingBuilding.isFavorite,
            isVisible: true
        };
    }

    // 2. 같은 소스끼리는 카테고리 병합
    if (existingBuilding.source === newSource) {
        console.log('🔄 같은 소스 - 카테고리 병합');
        return {
            ...existingBuilding,
            categories: mergeCategories(existingBuilding.categories, newData.categories || []),
            timestamp: now,
            lastUpdated: new Date().toISOString()
        };
    }

    // 3. 최신 검색 결과가 30초 이내면 DB 데이터 무시
    if (existingBuilding.source !== 'db' && newSource === 'db') {
        if (existingBuilding.timestamp && (now - existingBuilding.timestamp) < 30000) {
            console.log('🔄 최신 검색 결과 유지, DB 데이터 무시');
            return existingBuilding;
        }
    }

    // 기본값: 새 데이터로 교체
    return {
        building: newData.building,
        categories: newData.categories || [],
        source: newSource,
        timestamp: now,
        lastUpdated: new Date().toISOString(),
        isFavorite: existingBuilding.isFavorite || false,
        isVisible: true
    };
};

interface RecommendationState {
    buildings: BuildingRecommendation[];
    recommendationMarkers: RecommendationMarker[];
    isLoading: boolean;
    error: string | null;

    // 액션들
    startRequest: () => void;
    setRequestError: (error: string) => void;

    // ✅ 스마트 결과 추가
    addSingleResult: (result: SingleBuildingRecommendationResponse) => void;
    addRangeResult: (result: RangeRecommendationResponse) => void;
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

    moveBuildingToTop: (buildingId: number) => {
        const { buildings } = get();
        const targetIndex = buildings.findIndex(b => b.building.building_id === buildingId);
        if (targetIndex <= 0) return;

        const newBuildings = [...buildings];
        const [targetBuilding] = newBuildings.splice(targetIndex, 1);
        newBuildings.unshift(targetBuilding);

        console.log('⬆️ [moveBuildingToTop] 맨 위로 이동:', buildingId);
        set({ buildings: newBuildings });
    },

    syncMarkersWithBuildings: () => {
        const { buildings, recommendationMarkers } = get();

        if (buildings.length === 0) {
            set({ recommendationMarkers: [] });
            return;
        }

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
                survivalRate: getDisplayFailureRate(topCategory.survivalRate),
                type: 'recommendation' as const,
                source: building.source,
                isHighlighted: preservedState.isHighlighted,
                hidden: !building.isVisible || preservedState.hidden,
                color: building.source === 'db' ? 'purple' : building.source === 'range' ? 'green' : 'blue'
            };
        }).filter((marker): marker is RecommendationMarker => marker !== null);

        set({ recommendationMarkers: newMarkers });
    },

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

    // ✅ 스마트 Single 결과 처리
    addSingleResult: (result: SingleBuildingRecommendationResponse) => {
        const { buildings } = get();
        const buildingId = result.building.building_id;

        console.log('📥 [addSingleResult] 새 Single 결과:', buildingId);

        const existingIndex = buildings.findIndex(b => b.building.building_id === buildingId);

        const newCategories = result.result.map((cat, index) => ({
            category: cat.category,
            survivalRate: cat.survivalRate,
            rank: index + 1,
            sessionId: `single-${buildingId}-${Date.now()}`,
            isRangeResult: false
        }));

        const newData = {
            building: result.building,
            categories: newCategories
        };

        if (existingIndex >= 0) {
            // ✅ 스마트 병합 적용
            const existing = buildings[existingIndex];
            const merged = smartMerge(existing, newData, 'single');

            const newBuildings = [merged, ...buildings.filter(b => b.building.building_id !== buildingId)];
            set({ buildings: newBuildings });
        } else {
            // 새 건물 추가
            const newBuilding: BuildingRecommendation = {
                building: result.building,
                categories: newCategories,
                source: 'single',
                timestamp: Date.now(),
                lastUpdated: result.meta.last_at,
                isVisible: true
            };

            set({ buildings: [newBuilding, ...buildings] });
        }

        set({ isLoading: false, error: null });

        setTimeout(() => {
            get().syncMarkersWithBuildings();
            get().highlightMarker(buildingId);
        }, 100);
    },

    // ✅ 스마트 Range 결과 처리
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
                isRangeResult: true,
                sessionId: `range-${buildingId}-${Date.now()}`
            };

            const newData = {
                building: {
                    building_id: buildingId,
                    lat: Number(item.lat),
                    lng: Number(item.lng)
                },
                categories: [rangeCategory]
            };

            if (existingIndex >= 0) {
                // ✅ 스마트 병합 적용
                const existing = newBuildings[existingIndex];
                const merged = smartMerge(existing, newData, 'range');
                newBuildings[existingIndex] = merged;
            } else {
                // 새 건물 생성
                newBuildings.unshift({
                    building: newData.building,
                    categories: [rangeCategory],
                    source: 'range',
                    timestamp: Date.now(),
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

        setTimeout(() => get().syncMarkersWithBuildings(), 100);
    },

    // ✅ DB API 응답 구조에 맞는 mergeWithBackendResults
    mergeWithBackendResults: (backendResults: any[]) => {
        console.log('🔄 [mergeWithBackendResults] DB 결과 병합:', backendResults.length);

        const { buildings } = get();
        const now = Date.now();
        const updatedBuildings = [...buildings];

        backendResults.forEach(item => {
            console.log('📝 [DB ITEM] 원본 데이터:', item);

            // ✅ DB API 응답 구조 처리
            const buildingId = item.buildingId;
            const buildingLat = Number(item.lat);
            const buildingLng = Number(item.lng);
            const isFavorite = !!item.favorite;

            if (!buildingId) {
                console.warn('⚠️ [WARNING] buildingId가 없는 DB 항목:', item);
                return;
            }

            // ✅ categories 배열을 CategoryInfo로 변환
            const dbCategories: CategoryInfo[] = (item.categories || []).map((cat: any, index: number) => {
                console.log(`  📝 [CATEGORY] ${index + 1}/${item.categories.length}:`, {
                    category: cat.category,
                    survivalRate: cat.survivalRate
                });

                return {
                    category: cat.category,
                    survivalRate: cat.survivalRate || [],
                    rank: index + 1, // DB에서는 이미 정렬되어 왔다고 가정
                    isRangeResult: false,
                    sessionId: `db-${buildingId}-${Date.now()}-${index}`
                };
            });

            if (dbCategories.length === 0) {
                console.warn('⚠️ [WARNING] categories가 비어있는 DB 항목:', item);
                return;
            }

            const existingIndex = updatedBuildings.findIndex(
                b => b.building.building_id === buildingId
            );

            const buildingInfo = {
                building_id: buildingId,
                lat: buildingLat,
                lng: buildingLng
            };

            const newBuilding: BuildingRecommendation = {
                building: buildingInfo,
                categories: dbCategories,
                source: 'db',
                timestamp: now,
                lastUpdated: new Date().toISOString(),
                isFavorite: isFavorite,
                isVisible: true
            };

            if (existingIndex >= 0) {
                const existing = updatedBuildings[existingIndex];

                // 최신 검색 결과가 30초 이내면 DB 데이터 무시
                if (existing.source !== 'db' && existing.timestamp && (now - existing.timestamp) < 30000) {
                    console.log('🔄 최신 검색 결과 유지, DB 데이터 무시:', buildingId);
                    return;
                }

                const merged = smartMerge(existing, newBuilding, 'db');
                merged.isFavorite = isFavorite; // DB의 favorite 상태가 진짜
                updatedBuildings[existingIndex] = merged;

                console.log('✅ [DB UPDATE] 기존 건물 업데이트:', {
                    buildingId,
                    categories: merged.categories.length,
                    isFavorite: merged.isFavorite
                });
            } else {
                updatedBuildings.push(newBuilding);

                console.log('✅ [DB ADD] 새 DB 건물 추가:', {
                    buildingId,
                    categories: dbCategories.length,
                    isFavorite
                });
            }
        });

        // ✅ 폐업률 기준으로 각 건물의 카테고리 재정렬
        const finalBuildings = updatedBuildings.map(building => ({
            ...building,
            categories: building.categories
                .map(cat => ({
                    ...cat,
                    score: calculateCategoryScore(cat.survivalRate)
                }))
                .sort((a, b) => a.score - b.score) // 폐업률 낮은 순
                .map((cat, index) => ({
                    category: cat.category,
                    survivalRate: cat.survivalRate,
                    rank: index + 1,
                    sessionId: cat.sessionId,
                    isRangeResult: cat.isRangeResult || false
                }))
        }));

        set({ buildings: finalBuildings });

        console.log('✅ [DB MERGE] DB 병합 완료:', {
            totalBuildings: finalBuildings.length,
            dbBuildings: finalBuildings.filter(b => b.source === 'db').length
        });

        // ✅ 마커 즉시 동기화 (좋아요 상태 반영)
        setTimeout(() => get().syncMarkersWithBuildings(), 50);
    },

    deleteCategoryFromBuilding: (buildingId: number, categoryId: number) => {
        const { buildings } = get();

        const updatedBuildings = buildings.map(building => {
            if (building.building.building_id === buildingId) {
                const filteredCategories = building.categories.filter(cat => cat.category_id !== categoryId);

                const rerankedCategories = filteredCategories
                    .map(cat => ({
                        category: cat.category,
                        survivalRate: cat.survivalRate,
                        sessionId: cat.sessionId,
                        isRangeResult: cat.isRangeResult || false,
                        score: calculateCategoryScore(cat.survivalRate)
                    }))
                    .sort((a, b) => a.score - b.score)
                    .map((cat, index) => ({
                        category: cat.category,
                        survivalRate: cat.survivalRate,
                        rank: index + 1,
                        sessionId: cat.sessionId,
                        isRangeResult: cat.isRangeResult
                    }));

                return {
                    ...building,
                    categories: rerankedCategories
                };
            }
            return building;
        }).filter(building => building.categories.length > 0);

        console.log('🗑️ [deleteCategoryFromBuilding] 폐업률 기준 재정렬:', buildingId, categoryId);
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

    // ✅ 좋아요 상태 업데이트 시 마커도 즉시 동기화
    updateBuildingFavorite: (buildingId: number, isFavorite: boolean) => {
        const { buildings } = get();

        const updatedBuildings = buildings.map(building =>
            building.building.building_id === buildingId
                ? { ...building, isFavorite }
                : building
        );

        set({ buildings: updatedBuildings });

        console.log('💖 [updateBuildingFavorite] 좋아요 상태 업데이트:', {
            buildingId,
            isFavorite
        });

        // ✅ 마커 즉시 동기화
        setTimeout(() => get().syncMarkersWithBuildings(), 50);
    },

    // 마커 관리
    setRecommendationMarkers: (markers: RecommendationMarker[]) => {
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

export const useBuildings = () => useRecommendationStore(state => state.buildings);
export const useRecommendationMarkers = () => useRecommendationStore(state => state.recommendationMarkers);
export const useRecommendationLoading = () => useRecommendationStore(state => state.isLoading);
export const useRecommendationError = () => useRecommendationStore(state => state.error);
