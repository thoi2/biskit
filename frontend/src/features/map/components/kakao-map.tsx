// src/features/map/components/KakaoMap.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { useStoreStore } from '../../stores/store/storesStore';
import { useRecommendationStore } from '../../ai/store';
import { useBiskitData } from '../../stores/hooks/useBiskitData';
import { MapBounds, MapMarkerItem } from '../types';
import { MapControls } from './MapControls';
import { MarkerPopup } from './markers/MarkerPopup';
import { ClusterPopup } from './ClusterPopup';
import { LoadingAndError } from './LoadingAndError';
import { LocationSelector } from './LocationSelector';
import { UnifiedMarkers } from './markers/UnifiedMarkers';

declare global {
  interface Window {
    kakao: any;
    __debugMap: any;
    currentKakaoMap: any;
  }
}

export function KakaoMap() {
  const { stores } = useStoreStore();
  const { recommendationMarkers } = useRecommendationStore();

  const {
    isSearching,
    selectedCategories,
    setMapBounds,
    setActiveTab,
    setCoordinates,
    setMap,
    activeTab,
    isDrawingMode,
    setRecommendPin,
    map, // ✅ useMapStore의 map 사용
  } = useMapStore();

  const { handlers } = useBiskitData(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MapMarkerItem | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<MapMarkerItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(3);

  const MAX_SEARCH_LEVEL = 2;
  const isSearchAvailable = currentLevel <= MAX_SEARCH_LEVEL;

  // ✅ 안전한 btoa 함수
  const safeBtoa = useCallback((str: string): string => {
    try {
      const bytes = new TextEncoder().encode(str);
      const binaryString = String.fromCharCode(...bytes);
      return btoa(binaryString);
    } catch (error) {
      console.warn('safeBtoa 실패:', error);
      try {
        return btoa(str);
      } catch (fallbackError) {
        return btoa(str.replace(/[^\x00-\x7F]/g, ""));
      }
    }
  }, []);

  // ✅ 추천 핀 생성 함수
  const createRecommendPin = useCallback((lat: number, lng: number) => {
    if (!map) return null;

    const position = new window.kakao.maps.LatLng(lat, lng);

    const pinSvg = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        
        <path d="M20 0C8.954 0 0 8.954 0 20c0 11.045 20 30 20 30s20-18.955 20-30C40 8.954 31.046 0 20 0z" 
              fill="#3B82F6" 
              stroke="#1E40AF" 
              stroke-width="2"
              filter="url(#pin-shadow)"/>
        
        <circle cx="20" cy="20" r="12" fill="white" opacity="0.9"/>
        <circle cx="20" cy="20" r="8" fill="#1E40AF"/>
        <circle cx="20" cy="20" r="4" fill="white"/>
        
        <circle cx="20" cy="20" r="6" 
                fill="none" 
                stroke="#60A5FA" 
                stroke-width="2" 
                opacity="0.6">
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;

    const marker = new window.kakao.maps.Marker({
      position: position,
      map: map,
      image: new window.kakao.maps.MarkerImage(
          'data:image/svg+xml;base64,' + safeBtoa(pinSvg),
          new window.kakao.maps.Size(40, 50),
          { offset: new window.kakao.maps.Point(20, 50) }
      ),
      title: '분석 위치 선택',
      zIndex: 400 // ✅ 추천 핀은 가장 위에
    });

    window.kakao.maps.event.addListener(marker, 'click', () => {
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 10px; text-align: center; font-family: 'Pretendard', sans-serif;">
            <div style="margin-bottom: 6px;">
              <span style="font-size: 16px;">📍</span>
            </div>
            <p style="margin: 0; font-size: 12px; font-weight: 600; color: #3B82F6;">
              분석 위치
            </p>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
              위도: ${lat.toFixed(6)}<br>
              경도: ${lng.toFixed(6)}
            </p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 10px; color: #9CA3AF;">
                이 위치에서 AI 분석을 실행합니다
              </p>
            </div>
          </div>
        `,
        removable: true
      });
      infoWindow.open(map, marker);
    });

    return marker;
  }, [map, safeBtoa]);

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
          if (isMounted) setIsLoading(false);
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

        // ✅ 전역에 저장하여 디버깅 및 접근성 향상
        window.__debugMap = kakaoMap;
        window.currentKakaoMap = kakaoMap;

        console.log('🗺️ 지도 생성 완료:', {
          map: !!kakaoMap,
          level: kakaoMap.getLevel(),
          center: kakaoMap.getCenter()
        });

        setMap(kakaoMap); // ✅ useMapStore에 저장

        setTimeout(() => {
          kakaoMap.relayout();
        }, 100);
      });
    };

    initializeMap();
  }, [isLoading, loadError, setMap]);

  // 지도 커서 변경 효과
  useEffect(() => {
    if (!map) return;
    const mapContainer = map.getNode();
    if (isDrawingMode) {
      mapContainer.style.cursor = 'crosshair';
    } else if (activeTab === 'recommend') {
      mapContainer.style.cursor = 'crosshair';
    } else {
      mapContainer.style.cursor = 'grab';
    }
  }, [map, isDrawingMode, activeTab]);

  // 이벤트 리스너
  useEffect(() => {
    if (!map) return;

    const handleZoomChanged = () => setCurrentLevel(map.getLevel());

    const handleMapClick = (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      if (activeTab === 'recommend') {
        setCoordinates({ lat, lng });
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
      if (map && window.kakao?.maps) {
        try {
          window.kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChanged);
          window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
        } catch {
          console.warn('이벤트 리스너 제거 중 오류');
        }
      }
    };
  }, [map, handlers.handleMapClick, setCoordinates, activeTab, createRecommendPin, setRecommendPin]);

  // 지도 크기 변화 감지
  useEffect(() => {
    if (!map || !mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => map.relayout(), 200);
    });

    resizeObserver.observe(mapRef.current);
    return () => resizeObserver.disconnect();
  }, [map]);

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
    if (bounds) setMapBounds(bounds);
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

  if (isLoading || loadError) {
    return <LoadingAndError isLoading={isLoading} loadError={loadError} />;
  }

  const searchButtonInfo = getSearchButtonInfo(currentLevel);

  return (
      <div className="relative w-full h-full">
        {/* 지도 컨테이너 */}
        <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />

        {/* ✅ 통합 마커 시스템 */}
        <UnifiedMarkers map={map} selectedCategories={selectedCategories} />

        {/* 추천 탭 안내 */}
        {activeTab === 'recommend' && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-10">
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

        <LocationSelector onLocationSelect={() => {}} />

        {/* 팝업들 */}
        {selectedItem && !selectedCluster && (
            <MarkerPopup
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                getMarkerColorClass={() => 'bg-blue-500'}
            />
        )}

        {selectedCluster && (
            <ClusterPopup
                items={selectedCluster}
                onClose={() => setSelectedCluster(null)}
                onItemClick={(item) => setSelectedItem(item)}
                onViewAllClick={() => {
                  setActiveTab('result');
                  setSelectedCluster(null);
                }}
                getMarkerColorClass={() => 'bg-orange-500'}
            />
        )}
      </div>
  );
}
