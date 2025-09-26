// src/features/map/store/mapStore.ts
import { create } from 'zustand';

export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

// ✅ MapMarkerItem 인터페이스 추가
export interface MapMarkerItem {
  id: number;
  lat: number;
  lng: number;
  name: string;
  category?: string;
  categoryName?: string;
  bizCategoryCode?: string;
  address?: string;
  phone?: string;
  // 기타 필요한 필드들
}

// 위경도 타입 정의
interface Coordinates {
  lat: number | null;
  lng: number | null;
}

// 🎯 추천 마커 타입 정의
export interface RecommendationMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'recommendation';
  title: string;
  category: string;
  survivalRate: number;
  buildingId: number;
  isAreaResult?: boolean;
}

// ✅ 통합 하이라이트 타입 정의
interface ActiveHighlight {
  type: 'store' | 'recommendation' | null;
  id: string | number | null;
}

// Map 상태
interface MapState {
  mapBounds: MapBounds | null;
  isSearching: boolean;
  activeTab: 'search' | 'recommend' | 'result' | 'profile';
  selectedCategories: string[];
  highlightedStoreId: number | null;
  highlightedRecommendationId: string | null;
  coordinates: Coordinates;
  map: any | null;

  // ✅ 통합 하이라이트 상태
  activeHighlight: ActiveHighlight;

  // 드로잉 상태 (다각형 추가)
  isDrawingMode: boolean;
  isDrawingActive: boolean; // ✅ 추가
  drawingType: 'rectangle' | 'circle' | 'polygon';

  // 추천 탭 핀 상태
  recommendPin: any | null;

  // 추천 마커들 (AI 분석 결과)
  recommendationMarkers: RecommendationMarker[];
}

// Map 액션
interface MapActions {
  setMapBounds: (bounds: MapBounds | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  setActiveTab: (tab: MapState['activeTab']) => void;
  setSelectedCategories: (categories: string[]) => void;
  setHighlightedStore: (storeId: number | null) => void;
  setHighlightedRecommendation: (id: string | null) => void;
  setCoordinates: (coords: Coordinates) => void;
  setMap: (mapInstance: any) => void;
  clearMapState: () => void;

  // ✅ 통합 하이라이트 관리
  setActiveHighlight: (type: 'store' | 'recommendation' | null, id: string | number | null) => void;
  clearAllHighlights: () => void;

  // 드로잉 액션
  setIsDrawingMode: (isDrawing: boolean) => void;
  setIsDrawingActive: (active: boolean) => void; // ✅ 여기에 추가되어야 함!
  setDrawingType: (type: 'rectangle' | 'circle' | 'polygon') => void;

  // 추천 핀 액션
  setRecommendPin: (pin: any | null) => void;

  // 추천 마커 액션들
  setRecommendationMarkers: (markers: RecommendationMarker[]) => void;
  addRecommendationMarker: (marker: RecommendationMarker) => void;
  removeRecommendationMarker: (markerId: string) => void;
  clearRecommendationMarkers: () => void;
}

// Map Store
export const useMapStore = create<MapState & MapActions>()((set, get) => ({
  // 초기 상태
  mapBounds: null,
  isSearching: false,
  activeTab: 'search',
  selectedCategories: [],
  highlightedStoreId: null,
  highlightedRecommendationId: null,
  coordinates: { lat: null, lng: null },
  map: null,

  // ✅ 통합 하이라이트 초기 상태
  activeHighlight: {
    type: null,
    id: null
  },

  // 드로잉 초기 상태
  isDrawingMode: false,
  isDrawingActive: false, // ✅ 초기 상태 추가
  drawingType: 'rectangle',

  // 추천 핀 초기 상태
  recommendPin: null,

  // 추천 마커 초기 상태
  recommendationMarkers: [],

  // 기존 액션들
  setMapBounds: bounds => set({ mapBounds: bounds }),
  setIsSearching: isSearching => set({ isSearching }),
  setActiveTab: tab => set(state => ({
    activeTab: tab,
    ...(tab !== 'recommend' && state.recommendPin && {
      recommendPin: (() => {
        state.recommendPin.setMap(null);
        return null;
      })()
    })
  })),
  setSelectedCategories: categories => set({ selectedCategories: categories }),
  setHighlightedStore: storeId => set({ highlightedStoreId: storeId }),
  setHighlightedRecommendation: id => set({ highlightedRecommendationId: id }),
  setCoordinates: coords => set({ coordinates: coords }),
  setMap: mapInstance => set({ map: mapInstance }),

  // ✅ 통합 하이라이트 관리
  setActiveHighlight: (type, id) => {
    console.log('🎯 setActiveHighlight:', { type, id });

    // 이전 하이라이트 해제
    const { activeHighlight } = get();
    if (activeHighlight.type && activeHighlight.id) {
      console.log('🔘 이전 하이라이트 해제:', activeHighlight);

      // AI 스토어의 하이라이트 해제 (동적 import로 순환 참조 방지)
      if (activeHighlight.type === 'recommendation') {
        import('@/features/ai/store').then(({ useRecommendationStore }) => {
          const { clearHighlight } = useRecommendationStore.getState();
          clearHighlight?.();
        });
      }
    }

    // 새 하이라이트 설정
    set({
      activeHighlight: { type, id },
      highlightedStoreId: type === 'store' ? id as number : null,
      highlightedRecommendationId: type === 'recommendation' ? String(id) : null
    });

    // AI 스토어 하이라이트 설정
    if (type === 'recommendation' && id) {
      import('@/features/ai/store').then(({ useRecommendationStore }) => {
        const { highlightMarker } = useRecommendationStore.getState();
        highlightMarker?.(Number(id));
      });
    }
  },

  clearAllHighlights: () => {
    console.log('🔘 모든 하이라이트 해제');

    // AI 스토어 하이라이트 해제
    import('@/features/ai/store').then(({ useRecommendationStore }) => {
      const { clearHighlight } = useRecommendationStore.getState();
      clearHighlight?.();
    });

    set({
      activeHighlight: { type: null, id: null },
      highlightedStoreId: null,
      highlightedRecommendationId: null
    });
  },

  // 드로잉 액션들
  setIsDrawingMode: isDrawing => set({ isDrawingMode: isDrawing }),
  setIsDrawingActive: active => set({ isDrawingActive: active }), // ✅ 구현 추가!
  setDrawingType: type => set({ drawingType: type }),

  // 추천 핀 액션
  setRecommendPin: pin => set(state => {
    if (state.recommendPin) {
      state.recommendPin.setMap(null);
    }
    return { recommendPin: pin };
  }),

  // 추천 마커 액션들
  setRecommendationMarkers: markers => set({ recommendationMarkers: markers }),

  addRecommendationMarker: marker => set(state => ({
    recommendationMarkers: [...state.recommendationMarkers, marker]
  })),

  removeRecommendationMarker: markerId => set(state => ({
    recommendationMarkers: state.recommendationMarkers.filter(marker => marker.id !== markerId)
  })),

  clearRecommendationMarkers: () => set({ recommendationMarkers: [] }),

  clearMapState: () =>
      set(state => {
        if (state.recommendPin) {
          state.recommendPin.setMap(null);
        }

        return {
          selectedCategories: [],
          highlightedStoreId: null,
          highlightedRecommendationId: null,
          activeHighlight: { type: null, id: null },
          isSearching: false,
          coordinates: { lat: null, lng: null },
          map: null,
          isDrawingMode: false,
          isDrawingActive: false, // ✅ clearMapState에도 추가
          drawingType: 'rectangle',
          recommendPin: null,
          recommendationMarkers: [],
        };
      }),
}));
