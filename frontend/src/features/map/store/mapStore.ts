import { create } from 'zustand';
import { MapBounds } from '../types';

// 위경도 타입 정의
interface Coordinates {
  lat: number | null;
  lng: number | null;
}

// Map 상태
interface MapState {
  mapBounds: MapBounds | null;
  isSearching: boolean;
  activeTab: 'search' | 'recommend' | 'result' | 'profile';
  selectedCategories: string[];
  highlightedStoreId: number | null;
  highlightedRecommendationId: string | null;
  coordinates: Coordinates; // 🔥 위경도 상태 추가
}

// Map 액션
interface MapActions {
  setMapBounds: (bounds: MapBounds | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  setActiveTab: (tab: MapState['activeTab']) => void;
  setSelectedCategories: (categories: string[]) => void;
  setHighlightedStore: (storeId: number | null) => void;
  setHighlightedRecommendation: (id: string | null) => void;
  setCoordinates: (coords: Coordinates) => void; // 🔥 위경도 설정 액션 추가
  clearMapState: () => void;
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
  coordinates: { lat: null, lng: null }, // 🔥 위경도 초기 상태

  // 액션들
  setMapBounds: bounds => set({ mapBounds: bounds }),
  setIsSearching: isSearching => set({ isSearching }),
  setActiveTab: tab => set({ activeTab: tab }),
  setSelectedCategories: categories => set({ selectedCategories: categories }),
  setHighlightedStore: storeId => set({ highlightedStoreId: storeId }),
  setHighlightedRecommendation: id => set({ highlightedRecommendationId: id }),
  setCoordinates: coords => set({ coordinates: coords }), // 🔥 위경도 설정 액션 구현

  clearMapState: () =>
    set({
      selectedCategories: [],
      highlightedStoreId: null,
      highlightedRecommendationId: null,
      isSearching: false,
      coordinates: { lat: null, lng: null }, // 🔥 상태 초기화 시 위경도도 초기화
    }),
}));
