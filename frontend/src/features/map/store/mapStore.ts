import { create } from 'zustand';
import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/lib/types/recommendation';
import { MapBounds } from '../types';

// Zustand 스토어의 상태(State) 타입
interface MapState {
  stores: Store[];
  recommendations: RecommendationResult[];
  selectedStore: Store | null;
  selectedRecommendation: RecommendationResult | null;
  isSearching: boolean;
  mapBounds: MapBounds | null; // 현재 지도 영역
  activeTab: 'search' | 'recommend' | 'result' | 'profile'; // activeTab 상태 추가
}

// Zustand 스토어의 액션(Actions) 타입
interface MapActions {
  setStores: (stores: Store[]) => void;
  setRecommendations: (recommendations: RecommendationResult[]) => void;
  selectStore: (store: Store | null) => void;
  selectRecommendation: (recommendation: RecommendationResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  clearResults: () => void; // 초기화 액션
  setActiveTab: (tab: MapState['activeTab']) => void; // activeTab을 변경하는 액션 추가
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
  activeTab: 'search', // 초기 상태 설정
  setActiveTab: tab => set({ activeTab: tab }),
  setStores: stores => set({ stores }),
  setRecommendations: recommendations => set({ recommendations }),
  selectStore: store =>
    set({ selectedStore: store, selectedRecommendation: null }), // 하나를 선택하면 다른 하나는 null
  selectRecommendation: recommendation =>
    set({ selectedRecommendation: recommendation, selectedStore: null }),
  setIsSearching: isSearching => set({ isSearching }),
  setMapBounds: bounds => set({ mapBounds: bounds }),
  clearResults: () => set({ stores: [], recommendations: [] }),
}));
