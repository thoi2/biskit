import { create } from 'zustand';
import { MapBounds } from '../types';

// Map 상태
interface MapState {
  mapBounds: MapBounds | null;
  isSearching: boolean;
  activeTab: 'search' | 'recommend' | 'result' | 'profile';
  selectedCategories: string[];
  highlightedStoreId: number | null;
  highlightedRecommendationId: string | null;
}

// Map 액션
interface MapActions {
  setMapBounds: (bounds: MapBounds | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  setActiveTab: (tab: MapState['activeTab']) => void;
  setSelectedCategories: (categories: string[]) => void;
  setHighlightedStore: (storeId: number | null) => void;
  setHighlightedRecommendation: (id: string | null) => void;
  clearMapState: () => void;
}

// Map Store
export const useMapStore = create<MapState & MapActions>((set) => ({
  // 초기 상태
  mapBounds: null,
  isSearching: false,
  activeTab: 'search',
  selectedCategories: [],
  highlightedStoreId: null,
  highlightedRecommendationId: null,

  // 액션들
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  setHighlightedStore: (storeId) => set({ highlightedStoreId: storeId }),
  setHighlightedRecommendation: (id) => set({ highlightedRecommendationId: id }),

  clearMapState: () => set({
    selectedCategories: [],
    highlightedStoreId: null,
    highlightedRecommendationId: null,
    isSearching: false,
  }),
}));
