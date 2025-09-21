import { create } from 'zustand';
import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/features/ai/types/recommendation';
import { MapBounds } from '../types';

// Zustand 스토어의 상태(State) 타입
interface MapState {
  stores: Store[];
  recommendations: RecommendationResult[];
  selectedStore: Store | null;
  selectedRecommendation: RecommendationResult | null;
  isSearching: boolean;
  mapBounds: MapBounds | null;
  activeTab: 'search' | 'recommend' | 'result' | 'profile';
  selectedCategories: string[];
  highlightedStoreId: number | null; // 🔥 추가
  highlightedRecommendationId: string | null; // 🔥 추가
}

// Zustand 스토어의 액션(Actions) 타입
interface MapActions {
  setStores: (stores: Store[]) => void;
  setRecommendations: (recommendations: RecommendationResult[]) => void;
  selectStore: (store: Store | null) => void;
  selectRecommendation: (recommendation: RecommendationResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  clearResults: () => void;
  setActiveTab: (tab: MapState['activeTab']) => void;
  setSelectedCategories: (categories: string[]) => void;
  setHighlightedStore: (storeId: number | null) => void; // 🔥 추가
  setHighlightedRecommendation: (id: string | null) => void; // 🔥 추가
}

// 스토어 생성
export const useMapStore = create<MapState & MapActions>(set => ({
  // 초기 상태
  stores: [],
  recommendations: [],
  selectedStore: null,
  selectedRecommendation: null,
  isSearching: false,
  mapBounds: null,
  activeTab: 'search',
  selectedCategories: [],
  highlightedStoreId: null, // 🔥 추가
  highlightedRecommendationId: null, // 🔥 추가

  // 액션들
  setActiveTab: tab => set({ activeTab: tab }),
  setStores: stores => set({ stores }),
  setRecommendations: recommendations => set({ recommendations }),
  selectStore: store =>
      set({ selectedStore: store, selectedRecommendation: null }),
  selectRecommendation: recommendation =>
      set({ selectedRecommendation: recommendation, selectedStore: null }),
  setIsSearching: isSearching => set({ isSearching }),
  setMapBounds: bounds => set({ mapBounds: bounds }),
  setSelectedCategories: categories => set({ selectedCategories: categories }),
  setHighlightedStore: (storeId) => set({ highlightedStoreId: storeId }), // 🔥 추가
  setHighlightedRecommendation: (id) => set({ highlightedRecommendationId: id }), // 🔥 추가
  clearResults: () => set({
    stores: [],
    recommendations: [],
    selectedCategories: [],
    highlightedStoreId: null, // 🔥 추가
    highlightedRecommendationId: null, // 🔥 추가
  }),
}));
