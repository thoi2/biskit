'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useMapStore } from '../store/mapStore';
import { useStoreStore } from '../../stores/store/storesStore'; // 🔥 추가
import { useRecommendationStore } from '../../ai/store'; // 🔥 추가
import { useBiskitData } from '../../stores/hooks/useBiskitData';
import { useMapMarkers } from '../hooks/useMapMarkers';
import { MapBounds, MapMarkerItem } from '../types';
import { MapControls } from './MapControls';
import { MarkerPopup } from './MarkerPopup';
import { ClusterPopup } from './ClusterPopup';
import { LoadingAndError } from './LoadingAndError';
import { LocationSelector } from './LocationSelector';

declare global {
  interface Window {
    kakao: any;
  }
}

export function KakaoMap() {
  // 🔥 분리된 store들에서 데이터 가져오기
  const { stores } = useStoreStore();
  const { recommendations } = useRecommendationStore();
  const {
    isSearching,
    selectedCategories,
    setMapBounds,
    setActiveTab,
    setHighlightedStore,
    setHighlightedRecommendation,
  } = useMapStore();

  // Store 액션들
  const { selectStore } = useStoreStore();
  const { selectRecommendation } = useRecommendationStore();

  const { handlers } = useBiskitData(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MapMarkerItem | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<
    MapMarkerItem[] | null
  >(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(3);

  const MAX_SEARCH_LEVEL = 2;
  const isSearchAvailable = currentLevel <= MAX_SEARCH_LEVEL;

  // 필터링된 상가만 계산 - 🔥 안전한 기본값 적용
  const mapItems: MapMarkerItem[] = useMemo(() => {
    if (!selectedCategories || selectedCategories.length === 0) {
      return [];
    }

    // 🔥 안전한 기본값으로 undefined 체크
    const safeStores = stores || [];
    const safeRecommendations = recommendations || [];

    const filteredStores = safeStores
      .filter(store => !store.hidden)
      .filter(store => {
        const categoryName = store.categoryName || store.bizCategoryCode;
        return selectedCategories.some(category =>
          categoryName.includes(category),
        );
      })
      .map(store => ({
        id: `store-${store.id}`,
        name:
          store.displayName ||
          `${store.storeName} ${store.branchName || ''}`.trim(),
        category: store.categoryName || store.bizCategoryCode,
        address: store.roadAddress,
        coordinates: { lat: store.lat, lng: store.lng },
        type: 'store' as const,
        closureProbability: undefined,
      }));

    const filteredRecommendations = safeRecommendations
      .filter(rec => !rec.hidden)
      .map(rec => ({
        id: `recommendation-${rec.id}`,
        name: rec.businessName,
        category: rec.businessType,
        address: rec.address,
        coordinates: rec.coordinates,
        type: 'recommendation' as const,
        closureProbability: rec.closureProbability.year1,
        riskLevel: rec.riskLevel,
      }));

    return [...filteredStores, ...filteredRecommendations];
  }, [stores, selectedCategories, recommendations]);

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback(
    (item: MapMarkerItem) => {
      setSelectedItem(item);
      setSelectedCluster(null);
      setActiveTab('result');

      if (item.type === 'store') {
        const store = (stores || []).find(s => `store-${s.id}` === item.id);
        if (store) {
          selectStore(store);
          setHighlightedStore(store.id);
          setHighlightedRecommendation(null);
          setTimeout(() => setHighlightedStore(null), 3000);
        }
      } else if (item.type === 'recommendation') {
        const recommendation = (recommendations || []).find(
          r => `recommendation-${r.id}` === item.id,
        );
        if (recommendation) {
          selectRecommendation(recommendation);
          setHighlightedRecommendation(recommendation.id);
          setHighlightedStore(null);
          setTimeout(() => setHighlightedRecommendation(null), 3000);
        }
      }
    },
    [
      stores,
      recommendations,
      selectStore,
      selectRecommendation,
      setActiveTab,
      setHighlightedStore,
      setHighlightedRecommendation,
    ],
  );

  // 클러스터 클릭 핸들러
  const handleClusterClick = useCallback(
    (items: MapMarkerItem[]) => {
      setSelectedCluster(items);
      setSelectedItem(null);
      setActiveTab('result');
    },
    [setActiveTab],
  );

  // 클러스터 아이템 클릭 핸들러
  const handleClusterItemClick = useCallback(
    (item: MapMarkerItem) => {
      setSelectedItem(item);
      handleMarkerClick(item);
    },
    [handleMarkerClick],
  );

  // 지역 선택 핸들러
  const handleLocationSelect = useCallback(
    (coordinates: { lat: number; lng: number }) => {
      if (!map) return;

      const moveLatLon = new window.kakao.maps.LatLng(
        coordinates.lat,
        coordinates.lng,
      );
      map.setCenter(moveLatLon);
      map.setLevel(4); // 적당한 확대 레벨로 설정
    },
    [map],
  );

  // 마커 관리 훅 사용
  const { markers } = useMapMarkers({
    map,
    mapItems,
    stores: stores || [], // 🔥 안전한 기본값
    recommendations: recommendations || [], // 🔥 안전한 기본값
    onMarkerClick: handleMarkerClick,
    onClusterClick: handleClusterClick,
  });

  const getCurrentBounds = useCallback((): MapBounds | null => {
    if (!map) return null;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    return {
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() },
    };
  }, [map]);

  const handleSearchButtonClick = useCallback(() => {
    if (!isSearchAvailable) return;

    const bounds = getCurrentBounds();
    if (bounds) {
      setMapBounds(bounds);
    }
  }, [isSearchAvailable, getCurrentBounds, setMapBounds]);

  const getSearchButtonInfo = useCallback((level: number) => {
    if (level <= MAX_SEARCH_LEVEL) {
      return {
        available: true,
        buttonText: '상가 데이터 로딩',
        message: `레벨 ${level} - 검색 가능`,
      };
    } else {
      return {
        available: false,
        buttonText: '지도를 더 확대하세요',
        message: `현재 레벨 ${level} → 레벨 ${MAX_SEARCH_LEVEL} 이하로 확대 필요`,
      };
    }
  }, []);

  const getMarkerColorClass = (probability: number) => {
    if (probability >= 80) return 'bg-red-500';
    if (probability >= 60) return 'bg-orange-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // 카카오맵 스크립트 로딩
  useEffect(() => {
    let isMounted = true;
    const loadKakaoMap = async () => {
      try {
        if (
          typeof window !== 'undefined' &&
          window.kakao &&
          window.kakao.maps
        ) {
          setIsLoading(false);
          console.log('카카오맵 스크립트가 이미 로드되었습니다. ✅');
          return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;

        script.onload = () => {
          if (isMounted) {
            setIsLoading(false);
            console.log('카카오맵 스크립트 로딩 성공! 🎉');
          }
        };

        // script.onerror: 이 부분에 디버그 코드를 추가합니다.
        script.onerror = e => {
          if (isMounted) {
            const errorMsg = '카카오맵 API 스크립트 로딩 실패 😭';
            setLoadError(errorMsg);
            setIsLoading(false);
            console.error(errorMsg, e); // 오류 객체(e)를 함께 출력하여 상세 정보를 확인
          }
        };

        document.head.appendChild(script);
      } catch (e) {
        if (isMounted) {
          const errorMsg = '카카오맵 로딩 중 예외 발생 😥';
          setLoadError(errorMsg);
          setIsLoading(false);
          console.error(errorMsg, e); // catch 블록에서 잡힌 예외(e)를 출력
        }
      }
    };

    loadKakaoMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (isLoading || loadError || !mapRef.current) return;

    const initializeMap = () => {
      if (
        typeof window === 'undefined' ||
        !window.kakao ||
        !window.kakao.maps
      ) {
        setTimeout(initializeMap, 100);
        return;
      }

      window.kakao.maps.load(() => {
        const container = mapRef.current;
        if (!container) return;

        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };

        const kakaoMap = new window.kakao.maps.Map(container, options);
        setMap(kakaoMap);

        setTimeout(() => {
          kakaoMap.relayout();
        }, 100);
      });
    };

    initializeMap();
  }, [isLoading, loadError]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!map) return;

    const handleZoomChanged = () => {
      const level = map.getLevel();
      setCurrentLevel(level);
    };

    const handleMapClick = (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      handlers.handleMapClick(latlng.getLat(), latlng.getLng());
      setSelectedItem(null);
      setSelectedCluster(null);
    };

    window.kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChanged);
    window.kakao.maps.event.addListener(map, 'click', handleMapClick);

    setCurrentLevel(map.getLevel());

    return () => {
      if (map && window.kakao && window.kakao.maps) {
        try {
          window.kakao.maps.event.removeListener(
            map,
            'zoom_changed',
            handleZoomChanged,
          );
          window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
        } catch {
          console.warn('이벤트 리스너 제거 중 오류:');
        }
      }
    };
  }, [map, handlers.handleMapClick]);

  // 지도 컨테이너 크기 변화 감지 (사이드바 접기/펼치기 포함)
  useEffect(() => {
    if (!map || !mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => map.relayout(), 200);
    });

    resizeObserver.observe(mapRef.current);
    return () => resizeObserver.disconnect();
  }, [map]);

  // 로딩 및 에러 상태
  if (isLoading || loadError) {
    return <LoadingAndError isLoading={isLoading} loadError={loadError} />;
  }

  const searchButtonInfo = getSearchButtonInfo(currentLevel);

  return (
    <div className="relative w-full h-full">
      {/* 애니메이션 CSS */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* 지도 컨트롤들 */}
      <MapControls
        isSearching={isSearching}
        currentLevel={currentLevel}
        isSearchAvailable={isSearchAvailable}
        searchButtonInfo={searchButtonInfo}
        onSearchClick={handleSearchButtonClick}
        maxSearchLevel={MAX_SEARCH_LEVEL}
      />

      {/* 지역 선택기 */}
      <LocationSelector onLocationSelect={handleLocationSelect} />

      {/* 단일 마커 팝업 */}
      {selectedItem && !selectedCluster && (
        <MarkerPopup
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          getMarkerColorClass={getMarkerColorClass}
        />
      )}

      {/* 클러스터 팝업 */}
      {selectedCluster && (
        <ClusterPopup
          items={selectedCluster}
          onClose={() => setSelectedCluster(null)}
          onItemClick={handleClusterItemClick}
          onViewAllClick={() => {
            setActiveTab('result');
            setSelectedCluster(null);
          }}
          getMarkerColorClass={getMarkerColorClass}
        />
      )}
    </div>
  );
}
