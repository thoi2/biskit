// hooks/useBiskitData.ts
import { useState, useEffect } from 'react';
import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/features/ai/types/recommendation';
import { getStoresInBoundsAPI, mapBoundsToApiBounds } from '@/lib/store-api';
import { useMapStore } from '../store/mapStore';
import { MapBounds } from '../types';

// Mock recommendation results
const mockRecommendationResults: RecommendationResult[] = [
  {
    id: 'rec1',
    businessName: '강남역 스타벅스',
    address: '서울시 강남구 강남대로 123',
    businessType: '카페',
    closureProbability: {
      year1: 15,
      year2: 28,
      year3: 42,
      year4: 58,
      year5: 75,
    },
    coordinates: { lat: 37.5665, lng: 126.978 },
    riskLevel: 'medium' as const,
    isFavorite: false,
    hidden: false,
  },
  {
    id: 'rec2',
    businessName: '홍대 미용실 클립',
    address: '서울시 마포구 홍익로 67',
    businessType: '미용실',
    closureProbability: {
      year1: 25,
      year2: 45,
      year3: 65,
      year4: 80,
      year5: 90,
    },
    coordinates: { lat: 37.5563, lng: 126.9236 },
    riskLevel: 'high' as const,
    isFavorite: true,
    hidden: false,
  },
];

export function useBiskitData(user: Record<string, any> | null) {
  const {
    stores,
    isSearching,
    mapBounds,
    selectedCategories, // 🔥 Zustand에서 가져옴
    setStores,
    setIsSearching,
    selectStore,
    selectRecommendation,
    clearResults,
    setActiveTab,
    setSelectedCategories, // 🔥 Zustand에서 가져옴
  } = useMapStore();

  // 🔥 로컬 useState 제거 (Zustand 사용)
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [recommendationResults, setRecommendationResults] = useState<
      RecommendationResult[]
  >(mockRecommendationResults);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 🔥 지도 영역 검색 API 호출 함수
  // 🔥 지도 영역 검색 API 호출 함수 - 탭 이동 제거
  const handleSearchInArea = async (bounds: MapBounds) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      console.log('지도 검색 시작:', bounds);

      const apiBounds = mapBoundsToApiBounds(bounds);
      const storeData = await getStoresInBoundsAPI(apiBounds);

      console.log(`검색 완료: ${storeData.length}개 상가 발견`);

      // 상가 데이터 업데이트 (Zustand 스토어 사용)
      setStores(storeData);

      // 선택된 카테고리 필터 적용
      applyFilters(storeData, selectedCategories);

      if (storeData.length === 0) {
        setSearchError('해당 영역에서 상가를 찾을 수 없습니다.');
      } else {
        // 🔥 성공 메시지 표시 (옵션)
        console.log(`✅ ${storeData.length}개 상가 로딩 완료 - 왼쪽 필터에서 업종을 선택하세요`);
      }
    } catch (error) {
      console.error('지도 검색 실패:', error);
      setSearchError(
          error instanceof Error
              ? error.message
              : '상가 검색 중 오류가 발생했습니다.',
      );
      setStores([]);
      setFilteredStores([]);
    } finally {
      setIsSearching(false);
    }
  };


  // 🔥 mapBounds가 변경되면 검색 실행
  useEffect(() => {
    if (mapBounds) {
      handleSearchInArea(mapBounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapBounds]);

  // 카테고리 필터 적용 함수
  const applyFilters = (storeData: Store[], categories: string[]) => {
    if (categories.length === 0) {
      setFilteredStores(storeData);
    } else {
      const filtered = storeData.filter(store =>
          categories.some(category =>
              (store.categoryName || store.bizCategoryCode).includes(category),
          ),
      );
      setFilteredStores(filtered);
    }
  };

  // 🔥 필터 변경 시 Zustand 업데이트
  const handleFilterChange = (categories: string[]) => {
    setSelectedCategories(categories); // 🔥 Zustand에 업데이트
    applyFilters(stores, categories);
  };

  const handleStoreSelect = (store: Store) => {
    console.log('Selected store:', store);
    selectStore(store);
  };

  const handleStoreClick = (store: Store) => {
    console.log('Store clicked on map:', store);
    selectStore(store);
  };

  // 🔥 완전 삭제 함수 (X 버튼용)
  const handleDeleteStore = (storeId: number) => {
    console.log('Deleting store:', storeId);

    // 1. Zustand 스토어에서 완전 제거
    const newStores = stores.filter(store => store.id !== storeId);
    setStores(newStores);

    // 2. 로컬 필터된 스토어에서도 완전 제거
    setFilteredStores(prev => prev.filter(store => store.id !== storeId));

    // 3. 선택된 상가가 삭제된 상가라면 선택 해제
    selectStore(null);
  };

  const handleRecommendationClick = (recommendation: RecommendationResult) => {
    console.log('Recommendation clicked on map:', recommendation);
    selectRecommendation(recommendation);
  };

  const handleToggleHideStore = (storeId: number) => {
    const newStores = stores.map(store =>
        store.id === storeId ? { ...store, hidden: !store.hidden } : store,
    );
    setStores(newStores);
    setFilteredStores(prev =>
        prev.map(store =>
            store.id === storeId ? { ...store, hidden: !store.hidden } : store,
        ),
    );
  };

  const handleAnalysisRequest = (
      analysisType: string,
      params: Record<string, any>,
  ) => {
    console.log('Analysis requested:', analysisType, params);
    setRecommendationResults(mockRecommendationResults);
    setActiveTab('result');
  };

  const handleToggleRecommendationFavorite = (id: string) => {
    if (!user) {
      alert('찜 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }

    setRecommendationResults(prev =>
        prev.map(result =>
            result.id === id
                ? { ...result, isFavorite: !result.isFavorite }
                : result,
        ),
    );
  };

  const handleToggleHideRecommendation = (id: string) => {
    setRecommendationResults(prev =>
        prev.map(result =>
            result.id === id ? { ...result, hidden: !result.hidden } : result,
        ),
    );
  };

  const handleDeleteRecommendation = (id: string) => {
    setRecommendationResults(prev => prev.filter(result => result.id !== id));
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log(`지도 클릭: ${lat}, ${lng}`);
  };

  // 검색 결과 초기화
  const handleClearResults = () => {
    clearResults(); // 이미 selectedCategories 초기화 포함됨
    setFilteredStores([]);
    setSearchError(null);
  };

  const handleStoreHighlight = (store: Store) => {
    console.log('Store highlighted:', store);
    selectStore(store);
  };

  const handlers = {
    handleFilterChange,
    handleStoreSelect,
    handleStoreClick,
    handleRecommendationClick,
    handleToggleHideStore,
    handleAnalysisRequest,
    handleToggleRecommendationFavorite,
    handleToggleHideRecommendation,
    handleDeleteRecommendation,
    handleMapClick,
    handleSearchInArea,
    handleClearResults,
    handleDeleteStore,
    handleStoreHighlight,
  };

  return {
    selectedCategories, // 🔥 Zustand에서 가져온 것 반환
    stores: filteredStores,
    recommendationResults,
    isSearching,
    searchError,
    handlers,
  };
}
