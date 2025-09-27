// src/features/map/hooks/useAIMarkers.ts
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRecommendationStore } from '../../ai/store';
import { useMapStore } from '../store/mapStore';

interface UseAIMarkersProps {
  map: any;
  onAIMarkerClick: (building: any) => void;
}

export function useAIMarkers({ map, onAIMarkerClick }: UseAIMarkersProps) {
  const { buildings } = useRecommendationStore();
  const { highlightedRecommendationId } = useMapStore();
  const [aiMarkers, setAiMarkers] = useState<any[]>([]);
  const objectUrlsRef = useRef<string[]>([]);

  // ✅ 이전 상태를 추적하는 ref 추가
  const prevDataRef = useRef<{
    buildingCount: number;
    buildingsHash: string;
    highlightedId: string | null;
    mapInstance: any;
  }>({
    buildingCount: 0,
    buildingsHash: '',
    highlightedId: null,
    mapInstance: null
  });

  // ✅ SVG -> Blob URL 변환 (안정된 함수)
  const svgToObjectUrl = useCallback((svg: string): string => {
    const cleaned = svg.replace(/\s+/g, ' ').trim();
    const blob = new Blob([cleaned], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  // ✅ AI 마커 SVG 생성 (안정된 함수)
  const createAIMarkerSvg = useCallback((
      style: 'default' | 'favorite' | 'highlighted',
      survivalRate: number,
      buildingId: number
  ) => {
    const displayRate = Math.round(survivalRate);

    if (style === 'highlighted') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r="25" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.8">
          <animate attributeName="r" values="22;32;22" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="27" cy="27" r="18" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="27" cy="27" r="12" fill="white" opacity="0.95"/>
        <text x="27" y="31" text-anchor="middle" fill="#3B82F6" font-size="11" font-weight="bold">${displayRate}%</text>
        <text x="27" y="10" text-anchor="middle" fill="#FFD700" font-size="8" font-weight="bold">#${buildingId}</text>
      </svg>`;
    }
    else if (style === 'favorite') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="#EC4899" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="20" r="12" fill="white" opacity="0.95"/>
        <text x="20" y="24" text-anchor="middle" fill="#EC4899" font-size="10" font-weight="bold">${displayRate}%</text>
        <text x="20" y="8" text-anchor="middle" fill="white" font-size="12">❤️</text>
      </svg>`;
    }
    else {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <circle cx="18" cy="18" r="15" fill="#3B82F6" stroke="white" stroke-width="2"/>
        <circle cx="18" cy="18" r="10" fill="white" opacity="0.95"/>
        <text x="18" y="22" text-anchor="middle" fill="#3B82F6" font-size="11" font-weight="bold">${displayRate}%</text>
        <text x="18" y="6" text-anchor="middle" fill="#3B82F6" font-size="7">#${buildingId}</text>
      </svg>`;
    }
  }, []);

  // ✅ 표시할 건물 목록 (안정된 memo)
  const visibleBuildings = useMemo(() => {
    return buildings.filter(building => building.isVisible !== false);
  }, [buildings]);

  // ✅ 건물 데이터 해시 생성 (변경 감지용)
  const buildingsHash = useMemo(() => {
    return JSON.stringify(
        visibleBuildings.map(b => ({
          id: b.building.building_id,
          lat: b.building.lat,
          lng: b.building.lng,
          visible: b.isVisible,
          favorite: b.isFavorite,
          categories: b.categories.length
        }))
    );
  }, [visibleBuildings]);

  // ✅ AI 마커 생성/업데이트 (변경 감지 최적화)
  useEffect(() => {
    // ✅ 현재 상태 스냅샷
    const currentData = {
      buildingCount: visibleBuildings.length,
      buildingsHash,
      highlightedId: highlightedRecommendationId,
      mapInstance: map
    };

    // ✅ 변경사항 감지
    const hasChanged =
        currentData.buildingCount !== prevDataRef.current.buildingCount ||
        currentData.buildingsHash !== prevDataRef.current.buildingsHash ||
        currentData.highlightedId !== prevDataRef.current.highlightedId ||
        currentData.mapInstance !== prevDataRef.current.mapInstance;

    // ✅ 변경사항이 없으면 스킵
    if (!hasChanged) {
      console.log('🤖 [AI 마커] 변경사항 없음 - 스킵');
      return;
    }

    console.log('🤖 [AI 마커] 변경 감지:', {
      buildingCount: currentData.buildingCount,
      highlighted: currentData.highlightedId,
      hasMap: !!map
    });

    // ✅ 이전 상태 업데이트
    prevDataRef.current = currentData;

    // 지도가 없으면 종료
    if (!map) {
      console.log('🤖 [AI 마커] 지도 없음 - 스킵');
      return;
    }

    console.log('🤖 [AI 마커] 생성 시작:', visibleBuildings.length);

    // 기존 마커 제거
    aiMarkers.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (error) {
        console.warn('AI 마커 제거 실패:', error);
      }
    });

    // 기존 URL 해제
    objectUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('URL 해제 실패:', error);
      }
    });
    objectUrlsRef.current = [];

    // ✅ 데이터가 없으면 빈 배열로 설정 (조건부)
    if (visibleBuildings.length === 0) {
      if (aiMarkers.length > 0) {
        setAiMarkers([]);
      }
      return;
    }

    const newMarkers: any[] = [];

    visibleBuildings.forEach(building => {
      const buildingId = building.building.building_id;
      const isHighlighted = String(buildingId) === highlightedRecommendationId;
      const isFavorite = building.isFavorite || false;

      // ✅ 상태별 마커 스타일 결정
      let markerStyle: 'default' | 'favorite' | 'highlighted' = 'default';
      if (isHighlighted) markerStyle = 'highlighted';
      else if (isFavorite) markerStyle = 'favorite';

      // ✅ 생존율 계산 (5년차 기준)
      const topCategory = building.categories[0];
      const survivalRate = topCategory?.survivalRate?.[4] || 0;

      const svgString = createAIMarkerSvg(markerStyle, survivalRate, buildingId);
      const url = svgToObjectUrl(svgString);

      // 크기 설정
      let markerSize = { width: 36, height: 36 };
      if (markerStyle === 'highlighted') markerSize = { width: 54, height: 54 };
      else if (markerStyle === 'favorite') markerSize = { width: 40, height: 40 };

      const markerImage = new window.kakao.maps.MarkerImage(
          url,
          new window.kakao.maps.Size(markerSize.width, markerSize.height),
          { offset: new window.kakao.maps.Point(markerSize.width / 2, markerSize.height / 2) }
      );

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(building.building.lat, building.building.lng),
        map: map,
        image: markerImage,
        title: `AI 추천 건물 ${buildingId}`,
        zIndex: isHighlighted ? 1000 : isFavorite ? 500 : 100,
      });

      marker._markerType = 'ai';
      marker._buildingData = building;

      // 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onAIMarkerClick(building);
      });

      newMarkers.push(marker);
    });

    setAiMarkers(newMarkers);

    console.log('🤖 [AI 마커] 완료:', {
      buildings: visibleBuildings.length,
      markers: newMarkers.length,
      favorites: visibleBuildings.filter(b => b.isFavorite).length,
      highlighted: visibleBuildings.filter(b => String(b.building.building_id) === highlightedRecommendationId).length
    });

  }, [
    // ✅ 안정된 의존성만 포함
    map,
    visibleBuildings.length, // ✅ 배열이 아닌 길이만
    buildingsHash, // ✅ 해시로 변경 감지
    highlightedRecommendationId,
  ]); // ✅ 함수들은 제외 (useCallback으로 안정화됨)

  // ✅ cleanup
  useEffect(() => {
    return () => {
      console.log('🧹 [AI 마커] cleanup');
      aiMarkers.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (error) {
          console.warn('마커 정리 실패:', error);
        }
      });

      objectUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('URL 해제 실패:', error);
        }
      });
      objectUrlsRef.current = [];
    };
  }, []); // ✅ cleanup은 한번만

  return { aiMarkers };
}
