// hooks/useBiskitData.ts
import { useState, useEffect } from 'react';
import { Store } from '@/features/stores/types/store';
import {
  getStoresInBoundsAPI,
  mapBoundsToApiBounds,
} from '@/features/stores/api/store-api';

// 🔥 분리된 store들 import
import { useMapStore } from '../../map/store/mapStore';
import { useStoreStore } from '../../stores/store/storesStore';
import { MapBounds } from '../../map/types';

export function useBiskitData(user: Record<string, any> | null) {
  // 🔥 Map 관련 상태 (UI, 검색)
  const {
    isSearching,
    mapBounds,
    selectedCategories,
    coordinates,
    setCoordinates,
    setIsSearching,
    setSelectedCategories,
  } = useMapStore();

  // 🔥 Store 관련 상태 (상가 데이터)
  const {
    stores,
    setStores,
    selectStore,
    toggleStoreHide,
    deleteStore,
    clearStores,
  } = useStoreStore();

  // 로컬 상태 (필터링된 스토어)
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 🔥 지도 영역 검색 API 호출 함수
  const handleSearchInArea = async (bounds: MapBounds) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      console.log('지도 검색 시작:', bounds);

      const apiBounds = mapBoundsToApiBounds(bounds);
      const storeData = await getStoresInBoundsAPI(apiBounds);

      console.log(`검색 완료: ${storeData.length}개 상가 발견`);

      // 🔥 상가 데이터 업데이트 (useStoreStore에서 가져온 setStores 사용)
      setStores(storeData);

      // 선택된 카테고리 필터 적용
      applyFilters(storeData, selectedCategories);

      if (storeData.length === 0) {
        setSearchError('해당 영역에서 상가를 찾을 수 없습니다.');
      } else {
        console.log(
          `✅ ${storeData.length}개 상가 로딩 완료 - 왼쪽 필터에서 업종을 선택하세요`,
        );
      }
    } catch (error) {
      console.error('지도 검색 실패:', error);
      setSearchError(
        error instanceof Error
          ? error.message
          : '상가 검색 중 오류가 발생했습니다.',
      );
      // 🔥 에러 발생 시 빈 배열로 초기화 (useStoreStore의 setStores 사용)
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
    setSelectedCategories(categories);
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

  // 🔥 상가 숨기기/보이기 토글
  const handleToggleHideStore = (storeId: number) => {
    // Zustand store에서 토글
    toggleStoreHide(storeId);

    // 로컬 필터된 스토어에서도 업데이트
    setFilteredStores(prev =>
      prev.map(store =>
        store.id === storeId ? { ...store, hidden: !store.hidden } : store,
      ),
    );
  };

  // 🔥 상가 완전 삭제
  const handleDeleteStore = (storeId: number) => {
    console.log('Deleting store:', storeId);

    // 1. Zustand 스토어에서 완전 제거
    deleteStore(storeId);

    // 2. 로컬 필터된 스토어에서도 완전 제거
    setFilteredStores(prev => prev.filter(store => store.id !== storeId));
  };

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    console.log(`지도 클릭: ${lat}, ${lng}`);
  };

  // 검색 결과 초기화
  const handleClearResults = () => {
    clearStores(); // Zustand에서 상가 데이터 초기화
    setFilteredStores([]);
    setSearchError(null);
    setSelectedCategories([]); // 선택된 카테고리도 초기화
  };

  const handleStoreHighlight = (store: Store) => {
    console.log('Store highlighted:', store);
    selectStore(store);
  };

  // 🔥 Store 전용 핸들러들 (추천 관련 제거)
  const handlers = {
    handleFilterChange,
    handleStoreSelect,
    handleStoreClick,
    handleToggleHideStore,
    handleMapClick,
    handleSearchInArea,
    handleClearResults,
    handleDeleteStore,
    handleStoreHighlight,
  };

  return {
    selectedCategories,
    stores: filteredStores, // 필터링된 상가 목록
    isSearching,
    searchError,
    handlers,
  };
}
