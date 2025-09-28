// src/features/map/components/KakaoMap.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store/mapStore';
import { useBiskitData } from '../../stores/hooks/useBiskitData';
import { MapBounds, MapMarkerItem } from '../types';
import { MapControls } from './MapControls';
import { LoadingAndError } from './LoadingAndError';
import { LocationSelector } from './LocationSelector';
import { SeparatedMarkers } from './SeparatedMarkers';

declare global {
  interface Window {
    kakao: any;
    __debugMap: any;
    currentKakaoMap: any;
  }
}

export function KakaoMap() {
  // ✅ 사용하지 않는 변수들 제거
  const {
    isSearching,
    selectedCategories,
    setMapBounds,
    setCoordinates,
    setMap,
    activeTab,
    isDrawingMode,
    isDrawingActive,
    setRecommendPin,
    map,
  } = useMapStore();

  const { handlers } = useBiskitData(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MapMarkerItem | null>(null);
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
      zIndex: 400
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

        // 전역에 저장하여 디버깅 및 접근성 향상
        window.__debugMap = kakaoMap;
        window.currentKakaoMap = kakaoMap;

        console.log('🗺️ 지도 생성 완료:', {
          map: !!kakaoMap,
          level: kakaoMap.getLevel(),
          center: kakaoMap.getCenter()
        });

        setMap(kakaoMap);

        setTimeout(() => {
          kakaoMap.relayout();
        }, 100);
      });
    };

    initializeMap();
  }, [isLoading, loadError, setMap]);

  // ✅ 이벤트 리스너 등록 (드로잉 모드 고려)
  useEffect(() => {
    if (!map) return;

    console.log('🎧 이벤트 리스너 등록 시작', {
      isDrawingMode,
      isDrawingActive,
      activeTab
    });

    const handleZoomChanged = () => {
      const newLevel = map.getLevel();
      setCurrentLevel(newLevel);
      console.log('🔍 줌 레벨 변경:', newLevel);
    };

    const handleMapClick = (mouseEvent: any) => {
      // ✅ 현재 상태 확인
      const currentState = useMapStore.getState();

      // 드로잉이 실제로 진행 중일 때만 차단
      if (currentState.isDrawingActive) {
        console.log('🚫 드로잉 진행 중 - 지도 클릭 차단');
        if (mouseEvent.stop) mouseEvent.stop();
        return false;
      }

      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      console.log('🗺️ 지도 클릭:', {
        lat,
        lng,
        activeTab: currentState.activeTab,
        isDrawingMode: currentState.isDrawingMode,
        isDrawingActive: currentState.isDrawingActive
      });

      // ✅ 추천 탭에서 핀 생성
      if (currentState.activeTab === 'recommend') {
        console.log('📍 추천 핀 생성 시작');
        setCoordinates({ lat, lng });
        const newPin = createRecommendPin(lat, lng);
        setRecommendPin(newPin);
        console.log('✅ 추천 핀 생성 완료');
      }

      // 기존 로직 실행
      handlers.handleMapClick(lat, lng);
      setSelectedItem(null);
    };

    // ✅ 줌 이벤트는 항상 등록
    window.kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChanged);

    // ✅ 클릭 이벤트는 드로잉 모드가 아닐 때만 등록
    if (!isDrawingMode) {
      console.log('✅ 지도 클릭 이벤트 등록');
      window.kakao.maps.event.addListener(map, 'click', handleMapClick);
    } else {
      console.log('⏭️ 드로잉 모드 - 지도 클릭 이벤트 스킵');
    }

    setCurrentLevel(map.getLevel());

    return () => {
      console.log('🧹 이벤트 리스너 정리');
      if (map && window.kakao?.maps) {
        try {
          window.kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChanged);
          window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
        } catch (e) {
          console.warn('이벤트 리스너 제거 중 오류:', e);
        }
      }
    };
  }, [map, isDrawingMode, isDrawingActive, activeTab, createRecommendPin, setCoordinates, setRecommendPin, handlers, setSelectedItem]);

  // 지도 크기 변화 감지
  useEffect(() => {
    if (!map || !mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        console.log('📐 지도 크기 변경 - relayout 실행');
        map.relayout();
      }, 200);
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
    if (bounds) {
      console.log('🔍 상가 검색 실행:', bounds);
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

  if (isLoading || loadError) {
    return <LoadingAndError isLoading={isLoading} loadError={loadError} />;
  }
v
  const searchButtonInfo = getSearchButtonInfo(currentLevel);

  return (
      <div className="relative w-full h-full">
        {/* 🔥 지도 컨테이너 - kakao-map-container 클래스 추가 */}
        <div ref={mapRef} className="kakao-map-container w-full h-full rounded-lg overflow-hidden" />

        {/* ✅ 통합 마커 시스템 */}
        <SeparatedMarkers map={map} selectedCategories={selectedCategories} />

        {/* 추천 탭 안내 */}
        {activeTab === 'recommend' && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-10">
              📍 지도를 클릭하여 분석 위치를 선택하세요
            </div>
        )}

        {/* 드로잉 모드 안내 */}
        {isDrawingMode && (
            <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-10">
              ✏️ 드로잉 모드 활성화
              {isDrawingActive && <span className="ml-2">- 그리는 중...</span>}
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

        {/* ✅ selectedItem 팝업 (사용 시에만 표시) */}
        {selectedItem && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-64">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedItem.name}</h3>
                  {selectedItem.category && (
                      <p className="text-sm text-gray-600">{selectedItem.category}</p>
                  )}
                </div>
                <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {selectedItem.address && (
                    <p className="text-sm text-gray-600">{selectedItem.address}</p>
                )}
                <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                  selectedItem.type === 'store' ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {selectedItem.type === 'store' ? '상가' : 'AI추천'}
              </span>
                  {selectedItem.closureProbability && (
                      <span className="px-2 py-1 rounded text-xs font-medium text-white bg-orange-500">
                  {selectedItem.closureProbability}%
                </span>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
