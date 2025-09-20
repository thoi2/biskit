'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/lib/types/recommendation';

// 👇 타입 선언 추가
declare global {
  interface Window {
    kakao: any;
  }
}

// 마커 표시용 통합 아이템 인터페이스
interface MapMarkerItem {
  id: string;
  name: string;
  category?: string;
  address?: string;
  coordinates: { lat: number; lng: number };
  type: 'store' | 'recommendation';
  closureProbability?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  hidden?: boolean;
}

interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

interface KakaoMapProps {
  stores?: Store[];
  recommendations?: RecommendationResult[];
  onStoreClick?: (store: Store) => void;
  onRecommendationClick?: (recommendation: RecommendationResult) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onSearchInArea?: (bounds: MapBounds) => void;
  isSearching?: boolean;
  showSearchControls?: boolean; // ← 새로 추가: 검색 버튼/레벨 표시 여부 제어
}

export function KakaoMap({
                           stores = [],
                           recommendations = [],
                           onStoreClick,
                           onRecommendationClick,
                           onMapClick,
                           onSearchInArea,
                           isSearching = false,
                           showSearchControls = true, // ← 기본값 true
                         }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MapMarkerItem | null>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(3);

  // 검색 가능한 레벨 설정
  const MAX_SEARCH_LEVEL = 2;
  const isSearchAvailable = currentLevel <= MAX_SEARCH_LEVEL;

  // 🔥 useMemo로 mapItems를 메모이제이션하여 무한 리렌더링 방지
  const mapItems: MapMarkerItem[] = useMemo(() => [
    // Store 변환
    ...stores
        .filter(store => !store.hidden)
        .map(store => ({
          id: `store-${store.id}`,
          name: store.displayName || `${store.storeName} ${store.branchName}`.trim(),
          category: store.categoryName || store.bizCategoryCode,
          address: store.roadAddress,
          coordinates: { lat: store.lat, lng: store.lng },
          type: 'store' as const,
          closureProbability: undefined,
        })),
    // Recommendation 변환
    ...recommendations
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
        }))
  ], [stores, recommendations]);

  // 현재 지도 영역 가져오기
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

  // 수동 검색 버튼 클릭 핸들러
  const handleSearchButtonClick = useCallback(() => {
    if (!isSearchAvailable || !onSearchInArea) return;

    const bounds = getCurrentBounds();
    if (bounds) {
      onSearchInArea(bounds);
    }
  }, [isSearchAvailable, getCurrentBounds, onSearchInArea]);

  // 레벨에 따른 검색 버튼 메시지
  const getSearchButtonInfo = useCallback((level: number) => {
    if (level <= MAX_SEARCH_LEVEL) {
      return {
        available: true,
        buttonText: '이 지역 검색',
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
          return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;

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
      } catch (error) {
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

  // 🔥 이벤트 리스너 등록 (레벨 추적은 항상 활성화)
  useEffect(() => {
    if (!map) return;

    // 지도 레벨 변경 이벤트 리스너 (항상 등록)
    const handleZoomChanged = () => {
      const level = map.getLevel();
      setCurrentLevel(level);
      console.log(`현재 지도 레벨: ${level}, 검색 가능: ${level <= MAX_SEARCH_LEVEL}`);
    };

    // 지도 클릭 이벤트 리스너
    const handleMapClick = (mouseEvent: any) => {
      if (onMapClick) {
        const latlng = mouseEvent.latLng;
        onMapClick(latlng.getLat(), latlng.getLng());
      }
    };

    // 이벤트 리스너 등록
    window.kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChanged);

    if (onMapClick) {
      window.kakao.maps.event.addListener(map, 'click', handleMapClick);
    }

    // 초기 레벨 설정
    setCurrentLevel(map.getLevel());

    // cleanup 함수
    return () => {
      if (map && window.kakao && window.kakao.maps) {
        try {
          window.kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChanged);
          if (onMapClick) {
            window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
          }
        } catch (error) {
          console.warn('이벤트 리스너 제거 중 오류:', error);
        }
      }
    };
  }, [map, onMapClick]);

  // 윈도우 리사이즈 이벤트 리스너
  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      setTimeout(() => {
        map.relayout();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  // 마커 생성
  useEffect(() => {
    if (!map) return;

    // 기존 마커들 제거
    markers.forEach(marker => marker.setMap(null));

    if (!mapItems.length) {
      setMarkers([]);
      return;
    }

    const newMarkers = mapItems.map(item => {
      const markerPosition = new window.kakao.maps.LatLng(
          item.coordinates.lat,
          item.coordinates.lng,
      );

      // Store와 Recommendation 구분하여 마커 생성
      let customMarkerContent: string;

      if (item.type === 'store') {
        // Store 마커 (파란색 상가 아이콘)
        customMarkerContent = `
          <div style="position: relative; cursor: pointer;">
            <div style="
              width: 32px; height: 32px; background-color: #3b82f6;
              border: 2px solid white; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              font-size: 12px; font-weight: bold; color: white;
            ">🏪</div>
            <div style="
              position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
              margin-top: 4px; background: white; padding: 4px 8px; border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;
              font-size: 12px; font-weight: 500; white-space: nowrap; color: #374151;
              max-width: 200px; overflow: hidden; text-overflow: ellipsis;
            ">${item.name}</div>
          </div>
        `;
      } else {
        // Recommendation 마커 (폐업률에 따른 색상)
        const markerColor = getMarkerColorHex(item.closureProbability || 0);
        customMarkerContent = `
          <div style="position: relative; cursor: pointer;">
            <div style="
              width: 32px; height: 32px; background-color: ${markerColor};
              border: 2px solid white; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              font-size: 10px; font-weight: bold; color: white;
            ">${item.closureProbability}%</div>
            <div style="
              position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
              margin-top: 4px; background: white; padding: 4px 8px; border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;
              font-size: 12px; font-weight: 500; white-space: nowrap; color: #374151;
              max-width: 200px; overflow: hidden; text-overflow: ellipsis;
            ">${item.name}</div>
          </div>
        `;
      }

      const customOverlay = new window.kakao.maps.CustomOverlay({
        map: map,
        position: markerPosition,
        content: customMarkerContent,
        yAnchor: 1,
        clickable: true,
      });

      // 마커 클릭 이벤트
      const handleMarkerClick = () => {
        setSelectedItem(item);

        if (item.type === 'store' && onStoreClick) {
          const store = stores.find(s => `store-${s.id}` === item.id);
          if (store) onStoreClick(store);
        } else if (item.type === 'recommendation' && onRecommendationClick) {
          const recommendation = recommendations.find(r => `recommendation-${r.id}` === item.id);
          if (recommendation) onRecommendationClick(recommendation);
        }
      };

      window.kakao.maps.event.addListener(customOverlay, 'click', handleMarkerClick);

      return customOverlay;
    });

    setMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => {
        if (marker) {
          marker.setMap(null);
        }
      });
    };
  }, [map, mapItems]);

  const getMarkerColorHex = (probability: number) => {
    if (probability >= 80) return '#ef4444'; // 빨강
    if (probability >= 60) return '#f97316'; // 주황
    if (probability >= 40) return '#eab308'; // 노랑
    return '#22c55e'; // 초록
  };

  const getMarkerColorClass = (probability: number) => {
    if (probability >= 80) return 'bg-red-500';
    if (probability >= 60) return 'bg-orange-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // 로딩 중
  if (isLoading) {
    return (
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600">카카오맵을 불러오는 중...</div>
            </div>
          </div>
        </div>
    );
  }

  // 에러 발생
  if (loadError) {
    return (
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-red-600 mb-2">⚠️ {loadError}</div>
              <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
    );
  }

  const searchButtonInfo = getSearchButtonInfo(currentLevel);

  return (
      <div className="relative w-full h-full">
        <div
            ref={mapRef}
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ minHeight: '500px' }}
        />

        {/* 🔥 검색 기능이 있고 showSearchControls가 true일 때만 검색 버튼 표시 */}
        {showSearchControls && onSearchInArea && (
            <div className="absolute top-4 right-4 z-20">
              {searchButtonInfo.available ? (
                  <button
                      onClick={handleSearchButtonClick}
                      disabled={isSearching}
                      className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors ${
                          isSearching
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                  >
                    <Search className="w-4 h-4" />
                    {isSearching ? '검색 중...' : searchButtonInfo.buttonText}
                  </button>
              ) : (
                  <div className="bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg min-w-64">
                    <div className="text-sm">
                      <div className="font-medium mb-1">🔍 {searchButtonInfo.buttonText}</div>
                      <div className="text-xs opacity-90">{searchButtonInfo.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        💡 마우스 휠이나 더블클릭으로 확대하세요
                      </div>
                    </div>
                  </div>
              )}
            </div>
        )}

        {/* 🔥 showSearchControls가 true일 때 항상 레벨 표시 */}
        {showSearchControls && (
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow text-sm text-gray-700 z-20 border">
              <div className="flex items-center gap-2">
                <span className="font-medium">레벨 {currentLevel}</span>
                <span
                    className={`w-2 h-2 rounded-full ${
                        isSearchAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`}
                ></span>
                <span
                    className={`text-xs ${
                        isSearchAvailable ? 'text-green-600' : 'text-red-600'
                    }`}
                >
              {isSearchAvailable ? '검색 가능' : '검색 불가'}
            </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentLevel === 1 && '약 20m 축척'}
                {currentLevel === 2 && '약 30m 축척'}
                {currentLevel > 2 && `레벨 ${MAX_SEARCH_LEVEL} 이하로 확대 필요`}
              </div>
            </div>
        )}

        {/* 선택된 마커 정보 표시 */}
        {selectedItem && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-64">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedItem.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedItem.category}
                  </p>
                </div>
                <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{selectedItem.address}</p>
                <div className="flex items-center gap-2">
                  {selectedItem.type === 'store' ? (
                      <span className="px-2 py-1 rounded text-xs font-medium text-white bg-blue-500">
                  상가
                </span>
                  ) : (
                      <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${getMarkerColorClass(
                              selectedItem.closureProbability || 0,
                          )}`}
                      >
                  폐업률 {selectedItem.closureProbability}%
                </span>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
