// src/features/map/store/mapStore.ts
import { create } from 'zustand';
import { MapBounds } from '../types';

// 위경도 타입 정의
interface Coordinates {
  lat: number | null;
  lng: number | null;
}

// 🎯 추천 마커 타입 정의
interface RecommendationMarker {
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
  isDrawingActive: boolean;
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
  setIsDrawingActive: (active: boolean) => void;
  setDrawingType: (type: 'rectangle' | 'circle' | 'polygon') => void;

  // 추천 핀 액션
  setRecommendPin: (pin: any | null) => void;

  // 추천 마커 액션들
  setRecommendationMarkers: (markers: RecommendationMarker[]) => void;
  addRecommendationMarker: (marker: RecommendationMarker) => void;
  removeRecommendationMarker: (markerId: string) => void;
  clearRecommendationMarkers: () => void;

  // ✅ 지도 이동 액션 추가
  moveToLocation: (lat: number, lng: number, level?: number, animate?: boolean) => void;
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
  isDrawingActive: false,
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
  setIsDrawingActive: active => set({ isDrawingActive: active }),
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

  // ✅ 지도 이동 함수 추가
  moveToLocation: (lat: number, lng: number, level = 4, animate = true) => {
    const { map } = get();
    if (!map || !lat || !lng) {
      console.warn('🗺️ 지도 이동 실패: 지도 또는 좌표가 없음');
      return;
    }

    console.log('🗺️ 지도 이동:', { lat, lng, level, animate });

    try {
      const moveLatLng = new window.kakao.maps.LatLng(lat, lng);

      if (animate) {
        // ✅ 부드러운 애니메이션 이동
        map.panTo(moveLatLng);
      } else {
        // ✅ 즉시 이동
        map.setCenter(moveLatLng);
      }

      // ✅ 줌 레벨 조정 (현재보다 확대할 때만)
      if (level && map.getLevel() > level) {
        map.setLevel(level);
      }
    } catch (error) {
      console.error('🗺️ 지도 이동 중 오류:', error);
    }
  },

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
          isDrawingActive: false,
          drawingType: 'rectangle',
          recommendPin: null,
          recommendationMarkers: [],
        };
      }),
}));

// 타입 export
export type { RecommendationMarker, Coordinates, ActiveHighlight, MapState, MapActions };
