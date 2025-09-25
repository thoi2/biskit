'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useMapStore } from '../store/mapStore';
import { useStoreStore } from '../../stores/store/storesStore';
import { useRecommendationStore } from '../../ai/store';
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
  // 🎯 store에서 데이터 가져오기
  const { stores } = useStoreStore();
  const { recommendationResult } = useRecommendationStore();
  const {
    isSearching,
    selectedCategories,
    setMapBounds,
    setActiveTab,
    setHighlightedStore,
    setHighlightedRecommendation,
    setCoordinates,
    setMap,
    activeTab,         // 🎯 추가
    isDrawingMode,     // 🎯 추가
    recommendPin,      // 🎯 추가
    setRecommendPin,   // 🎯 추가
  } = useMapStore();

  // Store 액션들
  const { selectStore } = useStoreStore();

  const { handlers } = useBiskitData(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MapMarkerItem | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<MapMarkerItem[] | null>(null);
  const [map, setMapInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(3);

  const MAX_SEARCH_LEVEL = 2;
  const isSearchAvailable = currentLevel <= MAX_SEARCH_LEVEL;

  // recommendationResult를 배열로 변환
  const recommendations = useMemo(() => {
    if (!recommendationResult) return [];
    return Array.isArray(recommendationResult) ? recommendationResult : [recommendationResult];
  }, [recommendationResult]);

  // 필터링된 상가만 계산
  const mapItems: MapMarkerItem[] = useMemo(() => {
    if (!selectedCategories || selectedCategories.length === 0) {
      return [];
    }

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
          name: store.displayName || `${store.storeName} ${store.branchName || ''}`.trim(),
          category: store.categoryName || store.bizCategoryCode,
          address: store.roadAddress,
          coordinates: { lat: store.lat, lng: store.lng },
          type: 'store' as const,
          closureProbability: undefined,
        }));

    const filteredRecommendations = safeRecommendations
        .map((rec: any, index: number) => {
          const getRiskLevel = (level: any): 'low' | 'medium' | 'high' | undefined => {
            if (level === 'low' || level === 'medium' || level === 'high') {
              return level;
            }
            return 'medium';
          };

          return {
            id: `recommendation-${rec.building?.building_id || index}`,
            name: String(rec.building?.building_name || '추천 건물'),
            category: String(rec.category || '추천'),
            address: String(rec.building?.road_address || ''),
            coordinates: {
              lat: Number(rec.building?.latitude) || 0,
              lng: Number(rec.building?.longitude) || 0
            },
            type: 'recommendation' as const,
            closureProbability: rec.score ? Number(rec.score) : undefined,
            riskLevel: getRiskLevel(rec.riskLevel),
          };
        })
        .filter(rec => rec.coordinates.lat && rec.coordinates.lng);

    return [...filteredStores, ...filteredRecommendations];
  }, [stores, selectedCategories, recommendations]);

  // 🎯 추천 핀 생성 함수
  const createRecommendPin = useCallback((lat: number, lng: number) => {
    if (!map) return null;

    const position = new window.kakao.maps.LatLng(lat, lng);

    // 핀 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: position,
      map: map,
      image: new window.kakao.maps.MarkerImage(
          'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.163 24.837 0 16 0z" 
                  fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
            <circle cx="16" cy="16" r="8" fill="white"/>
            <circle cx="16" cy="16" r="4" fill="#1e40af"/>
          </svg>
        `),
          new window.kakao.maps.Size(32, 40),
          { offset: new window.kakao.maps.Point(16, 40) }
      )
    });

    return marker;
  }, [map]);

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
          const recId = item.id.replace('recommendation-', '');
          setHighlightedRecommendation(recId);
          setHighlightedStore(null);
          setTimeout(() => setHighlightedRecommendation(null), 3000);
        }
      },
      [stores, selectStore, setActiveTab, setHighlightedStore, setHighlightedRecommendation],
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
        map.setLevel(4);
      },
      [map],
  );

  // 마커 관리 훅 사용
  const { markers } = useMapMarkers({
    map,
    mapItems,
    stores: stores || [],
    recommendations: recommendations || [],
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
        if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
          setIsLoading(false);
          return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer,drawing`;

        script.onload = () => {
          if (isMounted) {
            setIsLoading(false);
          }
        };

        script.onerror = () => {
          if (isMounted) {
            setLoadError('카카오맵 API를 불러올 수 없습니다.');
            setIsLoading(false);
          }
        };

        document.head.appendChild(script);
      } catch {
        if (isMounted) {
          setLoadError('카카오맵 로딩 중 오류가 발생했습니다.');
          setIsLoading(false);
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
      if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
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
        setMapInstance(kakaoMap);
        setMap(kakaoMap);

        setTimeout(() => {
          kakaoMap.relayout();
        }, 100);
      });
    };

    initializeMap();
  }, [isLoading, loadError, setMap]);

  // 🎯 지도 커서 변경 효과
  useEffect(() => {
    if (!map) return;

    const mapContainer = map.getNode();
    if (isDrawingMode) {
      mapContainer.style.cursor = 'crosshair';
    } else {
      mapContainer.style.cursor = 'grab';
    }
  }, [map, isDrawingMode]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!map) return;

    const handleZoomChanged = () => {
      const level = map.getLevel();
      setCurrentLevel(level);
    };

    const handleMapClick = (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      // 🎯 추천 탭에서만 핀 찍기
      if (activeTab === 'recommend') {
        // 좌표 저장
        setCoordinates({ lat, lng });

        // 기존 핀 제거하고 새 핀 생성
        const newPin = createRecommendPin(lat, lng);
        setRecommendPin(newPin);
      }

      handlers.handleMapClick(lat, lng);
      setSelectedItem(null);
      setSelectedCluster(null);
    };

    window.kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChanged);
    window.kakao.maps.event.addListener(map, 'click', handleMapClick);

    setCurrentLevel(map.getLevel());

    return () => {
      if (map && window.kakao && window.kakao.maps) {
        try {
          window.kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChanged);
          window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
        } catch {
          console.warn('이벤트 리스너 제거 중 오류');
        }
      }
    };
  }, [map, handlers.handleMapClick, setCoordinates, activeTab, createRecommendPin, setRecommendPin]);

  // 지도 컨테이너 크기 변화 감지
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
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>

        {/* 지도 컨테이너 */}
        <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />

        {/* 🎯 추천 탭일 때 안내 메시지 */}
        {activeTab === 'recommend' && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
              📍 지도를 클릭하여 분석 위치를 선택하세요
            </div>
        )}

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
