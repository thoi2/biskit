// src/features/ai/store.ts
import { create } from 'zustand';

interface RecommendationState {
    recommendationResults: SingleBuildingRecommendationResponse[];  // ✅ any[] → 구체적 타입
    recommendationMarkers: any[];
    isLoading: boolean;
    error: string | null;
    startRequest: () => void;
    setRequestSuccess: (result: SingleBuildingRecommendationResponse) => void;  // ✅ any → 구체적 타입
    setRequestError: (error: string) => void;
    setRecommendationMarkers: (markers: any[]) => void;
    addRecommendationMarker: (marker: any) => void;
    clearRecommendations: () => void;
    deleteRecommendation: (buildingId: number) => void;
    highlightMarker: (buildingId: number) => void;
    mergeWithCurrentResults: (userResults: SingleBuildingRecommendationResponse[]) => void;  // ✅ 타입 지정
    loadUserResults: (userResults: SingleBuildingRecommendationResponse[]) => void;  // ✅ 타입 지정
    syncMarkersWithResults: () => void;

    // ✅ 숨김 기능 추가
    hideRecommendation: (buildingId: number) => void;
    showRecommendation: (buildingId: number) => void;
    toggleRecommendationVisibility: (buildingId: number) => void;

    // ✅ 하이라이트 해제 기능 추가
    clearHighlight: () => void;
}

export const useRecommendationStore = create<RecommendationState>()((set, get) => ({
    recommendationResults: [],
    recommendationMarkers: [],
    isLoading: false,
    error: null,

    startRequest: () => set({ isLoading: true, error: null }),

    setRequestSuccess: (result: SingleBuildingRecommendationResponse) => {
        const { recommendationResults } = get();

        console.log('📥 [setRequestSuccess] 새 결과:', result);

        // ✅ 같은 building_id가 있으면 업데이트, 없으면 추가
        const existingIndex = recommendationResults.findIndex(
            (r: SingleBuildingRecommendationResponse) => r?.building?.building_id === result?.building?.building_id
        );

        let newResults: SingleBuildingRecommendationResponse[];
        if (existingIndex >= 0) {
            // 기존 결과 업데이트
            newResults = [...recommendationResults];
            newResults[existingIndex] = result;
            console.log('🔄 기존 결과 업데이트:', result.building?.building_id);
        } else {
            // 새 결과 추가 (최신 결과를 앞에)
            newResults = [result, ...recommendationResults];
            console.log('✅ 새 결과 추가:', result.building?.building_id);
        }

        set({
            recommendationResults: newResults,
            isLoading: false,
            error: null
        });

        console.log('📊 [setRequestSuccess] 전체 결과:', newResults.length, '개');

        // 결과가 업데이트되면 마커도 자동 동기화
        setTimeout(() => {
            get().syncMarkersWithResults();
        }, 100);
    },

    setRequestError: (error: string) => set({
        error,
        isLoading: false
    }),

    setRecommendationMarkers: (markers: any[]) => {
        console.log('🎯 [setRecommendationMarkers]:', markers.length, '개 마커 설정');
        set({ recommendationMarkers: markers });
    },

    // ✅ 마커 추가 (개별) - 기존 마커 보존
    addRecommendationMarker: (marker: any) => {
        const { recommendationMarkers } = get();

        console.log('➕ [addRecommendationMarker] 마커 추가 시도:', {
            newMarker: marker,
            currentCount: recommendationMarkers.length
        });

        // buildingId와 id로 중복 체크
        const existingIndex = recommendationMarkers.findIndex(m =>
            m.buildingId === marker.buildingId || m.id === marker.id
        );

        let newMarkers;
        if (existingIndex >= 0) {
            // 기존 마커 업데이트
            newMarkers = [...recommendationMarkers];
            newMarkers[existingIndex] = { ...marker, isHighlighted: false };
            console.log('🔄 기존 마커 업데이트:', marker.buildingId);
        } else {
            // 새 마커 추가 (기존 마커 보존)
            newMarkers = [...recommendationMarkers, { ...marker, isHighlighted: false }];
            console.log('✅ 새 마커 추가:', marker.buildingId);
        }

        console.log('📍 [addRecommendationMarker] 결과:', {
            before: recommendationMarkers.length,
            after: newMarkers.length,
            markers: newMarkers.map(m => ({ id: m.id, buildingId: m.buildingId }))
        });

        set({ recommendationMarkers: newMarkers });
    },

    // ✅ 마커 하이라이트 (통합 관리를 위해 수정)
    highlightMarker: (buildingId: number) => {
        const { recommendationMarkers } = get();
        console.log('✨ [highlightMarker] 하이라이트 설정:', buildingId);

        // 모든 마커의 하이라이트 해제 후 해당 마커만 활성화
        const updatedMarkers = recommendationMarkers.map(marker => ({
            ...marker,
            isHighlighted: marker.buildingId === buildingId
        }));

        set({ recommendationMarkers: updatedMarkers });
        console.log('✨ 마커 하이라이트 설정 완료:', buildingId);
    },

    // ✅ 하이라이트 해제 함수 추가
    clearHighlight: () => {
        const { recommendationMarkers } = get();
        console.log('🔘 [clearHighlight] 모든 마커 하이라이트 해제');

        const updatedMarkers = recommendationMarkers.map(marker => ({
            ...marker,
            isHighlighted: false
        }));

        set({ recommendationMarkers: updatedMarkers });
        console.log('🔘 모든 추천 마커 하이라이트 해제 완료');
    },

    // ✅ 숨김 액션들
    hideRecommendation: (buildingId: number) => {
        const { recommendationMarkers } = get();
        console.log('👁️‍🗨️ [hideRecommendation] 숨김 처리:', buildingId);

        const updated = recommendationMarkers.map(marker =>
            marker.buildingId === buildingId
                ? { ...marker, hidden: true }
                : marker
        );

        set({ recommendationMarkers: updated });
    },

    showRecommendation: (buildingId: number) => {
        const { recommendationMarkers } = get();
        console.log('👁️ [showRecommendation] 표시 처리:', buildingId);

        const updated = recommendationMarkers.map(marker =>
            marker.buildingId === buildingId
                ? { ...marker, hidden: false }
                : marker
        );

        set({ recommendationMarkers: updated });
    },

    toggleRecommendationVisibility: (buildingId: number) => {
        const { recommendationMarkers } = get();
        const targetMarker = recommendationMarkers.find(m => m.buildingId === buildingId);

        console.log('🔄 [toggleRecommendationVisibility] 토글:', {
            buildingId,
            currentHidden: targetMarker?.hidden,
            willBeHidden: !targetMarker?.hidden
        });

        const updated = recommendationMarkers.map(marker =>
            marker.buildingId === buildingId
                ? { ...marker, hidden: !marker.hidden }
                : marker
        );

        set({ recommendationMarkers: updated });
    },

    // ✅ 사용자 기록과 현재 결과 합치기 (타입 지정)
    mergeWithCurrentResults: (userResults: SingleBuildingRecommendationResponse[]) => {
        const { recommendationResults } = get();

        // 현재 스토어 결과 (메모리)
        const currentResults = Array.isArray(recommendationResults) ? recommendationResults : [];

        // building_id로 중복 제거 맵 생성
        const mergedMap = new Map<number, SingleBuildingRecommendationResponse>();

        // 1. 백엔드 결과 먼저 추가 (기존 기록)
        userResults.forEach((result: SingleBuildingRecommendationResponse) => {
            if (result?.building?.building_id) {
                mergedMap.set(result.building.building_id, {
                    ...result,
                    isFromBackend: true // 백엔드에서 온 데이터 표시
                } as any);
            }
        });

        // 2. 현재 세션 결과 추가 (최신 우선, 중복되면 덮어씀)
        currentResults.forEach((result: SingleBuildingRecommendationResponse) => {
            if (result?.building?.building_id) {
                mergedMap.set(result.building.building_id, {
                    ...result,
                    isFromBackend: false // 현재 세션 데이터 표시
                } as any);
            }
        });

        const mergedResults = Array.from(mergedMap.values());

        console.log('🔄 데이터 합치기 완료:', {
            backendCount: userResults.length,
            currentCount: currentResults.length,
            mergedCount: mergedResults.length
        });

        set({ recommendationResults: mergedResults });

        // ✅ 결과 합치기 후 마커도 자동 동기화
        setTimeout(() => {
            get().syncMarkersWithResults();
        }, 100);
    },

    // ✅ 사용자 기록만 로드 (기존 데이터 덮어쓰기)
    loadUserResults: (userResults: SingleBuildingRecommendationResponse[]) => {
        console.log('📥 사용자 기록 로드:', userResults.length);
        set({ recommendationResults: userResults });

        // ✅ 기록 로드 후 마커도 자동 동기화
        setTimeout(() => {
            get().syncMarkersWithResults();
        }, 100);
    },

    // ✅ 결과 → 마커 동기화 핵심 함수 (숨김 상태 보존 추가)
    syncMarkersWithResults: () => {
        const { recommendationResults, recommendationMarkers } = get();

        console.log('🔄 [syncMarkersWithResults] 시작:', recommendationResults.length, '개 결과');

        if (!recommendationResults || recommendationResults.length === 0) {
            console.log('📭 [syncMarkersWithResults] 결과 없음 → 마커 초기화');
            set({ recommendationMarkers: [] });
            return;
        }

        // ✅ 기존 마커들의 hidden 상태와 하이라이트 상태 보존을 위한 맵
        const existingStates = new Map();
        recommendationMarkers.forEach(marker => {
            if (marker.buildingId) {
                existingStates.set(marker.buildingId, {
                    hidden: marker.hidden || false,
                    isHighlighted: marker.isHighlighted || false
                });
            }
        });

        // recommendationResults를 마커 형태로 변환
        const markersFromResults = recommendationResults.map((result: SingleBuildingRecommendationResponse, index: number) => {
            const building = result?.building;

            console.log(`🔍 [syncMarkersWithResults] 결과 ${index}:`, {
                building,
                building_id: building?.building_id,
                lat: building?.lat,
                lng: building?.lng,
                resultCount: result?.result?.length
            });

            // ✅ 좌표 확인 (lat, lng 사용)
            if (!building || typeof building.lat !== 'number' || typeof building.lng !== 'number') {
                console.warn(`⚠️ [syncMarkersWithResults] 잘못된 좌표 데이터 ${index}:`, building);
                return null;
            }

            // ✅ 최고 생존율 업종 찾기
            const topResult = result?.result?.[0];
            if (!topResult) {
                console.warn(`⚠️ [syncMarkersWithResults] 결과 데이터 없음 ${index}:`, result);
                return null;
            }

            // ✅ 기존 상태 보존
            const buildingId = building.building_id || index;
            const preservedState = existingStates.get(buildingId) || { hidden: false, isHighlighted: false };

            return {
                id: `ai-${buildingId}`,
                buildingId,
                title: `AI 추천 #${buildingId}`,
                category: topResult.category || '추천 업종',
                lat: Number(building.lat),
                lng: Number(building.lng),
                survivalRate: topResult.survivalRate || 0,
                type: 'recommendation' as const,
                isFromBackend: (result as any).isFromBackend || false,
                isHighlighted: preservedState.isHighlighted,  // ✅ 기존 하이라이트 상태 보존
                hidden: preservedState.hidden,  // ✅ 기존 숨김 상태 보존
                color: (result as any).isFromBackend ? 'purple' : 'blue' // 백엔드는 보라색, 현재 세션은 파란색
            };
        }).filter(marker => marker !== null); // null 제거

        console.log('✅ [syncMarkersWithResults] 변환 완료:', {
            resultCount: recommendationResults.length,
            markerCount: markersFromResults.length,
            hiddenCount: markersFromResults.filter(m => m?.hidden).length,
            highlightedCount: markersFromResults.filter(m => m?.isHighlighted).length,
            validMarkers: markersFromResults.map(m => ({
                id: m?.id,
                buildingId: m?.buildingId,
                lat: m?.lat,
                lng: m?.lng,
                category: m?.category,
                survivalRate: m?.survivalRate,
                hidden: m?.hidden,
                isHighlighted: m?.isHighlighted
            }))
        });

        set({ recommendationMarkers: markersFromResults });
    },

    deleteRecommendation: (buildingId: number) => {
        const { recommendationResults, recommendationMarkers } = get();

        // 결과와 마커 모두에서 제거
        const filteredResults = recommendationResults.filter(
            (r: SingleBuildingRecommendationResponse) => r?.building?.building_id !== buildingId
        );

        const filteredMarkers = recommendationMarkers.filter(
            (m: any) => m.buildingId !== buildingId
        );

        console.log('🗑️ [deleteRecommendation]:', {
            buildingId,
            beforeResults: recommendationResults.length,
            afterResults: filteredResults.length,
            beforeMarkers: recommendationMarkers.length,
            afterMarkers: filteredMarkers.length
        });

        set({
            recommendationResults: filteredResults,
            recommendationMarkers: filteredMarkers
        });
    },

    clearRecommendations: () => {
        console.log('🧹 [clearRecommendations] 모든 추천 초기화');
        set({
            recommendationResults: [],
            recommendationMarkers: [],
            error: null
        });
    },
}));

// 타입 정의들
export interface RecommendationItem {
    category: string;
    survivalRate: number;
}

export interface BuildingInfo {
    building_id: number;
    lat: number;
    lng: number;
}

export interface MetaData {
    source: string;
    version: string;
    last_at: string;
}

export interface SingleBuildingRecommendationResponse {
    isVisible?: boolean; // ✅ optional로 수정
    building: BuildingInfo;
    result: RecommendationItem[];
    meta: MetaData;
}

export interface RecommendRequest {
    lat: number;
    lng: number;
}

export interface RecommendCategoryRequest {
    lat: number;
    lng: number;
    category: string;
}

export interface PolygonCategoryRequest {
    polygon: RecommendRequest[];
    category: string;
}

export interface BuildingItem {
    buildingId: number;
    lat: string;
    lng: string;
    favorite: boolean;
    categories: RecommendationItem[];
}

export interface BuildingListResponse {
    items: BuildingItem[];
}

export interface DeleteCategoriesRequest {
    categories: string[];
}
