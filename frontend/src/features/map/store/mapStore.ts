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

  // 🎯 드로잉 상태 (다각형 추가)
  isDrawingMode: boolean;
  drawingType: 'rectangle' | 'circle' | 'polygon';

  // 추천 탭 핀 상태
  recommendPin: any | null;

  // 🎯 추천 마커들 (AI 분석 결과)
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

  // 드로잉 액션
  setIsDrawingMode: (isDrawing: boolean) => void;
  setDrawingType: (type: 'rectangle' | 'circle' | 'polygon') => void;

  // 추천 핀 액션
  setRecommendPin: (pin: any | null) => void;

  // 🎯 추천 마커 액션들
  setRecommendationMarkers: (markers: RecommendationMarker[]) => void;
  addRecommendationMarker: (marker: RecommendationMarker) => void;
  removeRecommendationMarker: (markerId: string) => void;
  clearRecommendationMarkers: () => void;
}

// Map Store
export const useMapStore = create<MapState & MapActions>(set => ({
  // 초기 상태
  mapBounds: null,
  isSearching: false,
  activeTab: 'search',
  selectedCategories: [],
  highlightedStoreId: null,
  highlightedRecommendationId: null,
  coordinates: { lat: null, lng: null },
  map: null,

  // 드로잉 초기 상태
  isDrawingMode: false,
  drawingType: 'rectangle',

  // 추천 핀 초기 상태
  recommendPin: null,

  // 🎯 추천 마커 초기 상태
  recommendationMarkers: [],

  // 액션들
  setMapBounds: bounds => set({ mapBounds: bounds }),
  setIsSearching: isSearching => set({ isSearching }),
  setActiveTab: tab => set(state => ({
    activeTab: tab,
    // 탭 변경시 추천 핀 제거
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

  // 드로잉 액션들
  setIsDrawingMode: isDrawing => set({ isDrawingMode: isDrawing }),
  setDrawingType: type => set({ drawingType: type }),

  // 추천 핀 액션
  setRecommendPin: pin => set(state => {
    if (state.recommendPin) {
      state.recommendPin.setMap(null);
    }
    return { recommendPin: pin };
  }),

  // 🎯 추천 마커 액션들
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
          isSearching: false,
          coordinates: { lat: null, lng: null },
          map: null,
          isDrawingMode: false,
          drawingType: 'rectangle',
          recommendPin: null,
          recommendationMarkers: [], // 🎯 추천 마커도 초기화
        };
      }),
}));

// 🎯 타입 export (다른 파일에서 사용)
export type { RecommendationMarker };
