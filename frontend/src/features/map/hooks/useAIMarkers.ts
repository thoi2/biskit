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
  const markersRef = useRef<any[]>([]);

  // ✅ 이전 상태 추적
  const prevDataRef = useRef<{
    buildingIds: number[];
    favoriteIds: number[];
    visibleIds: number[];
    highlightedId: string | null;
    mapInstance: any;
  }>({
    buildingIds: [],
    favoriteIds: [],
    visibleIds: [],
    highlightedId: null,
    mapInstance: null
  });

  // ✅ SVG -> Blob URL 변환
  const svgToObjectUrl = useCallback((svg: string): string => {
    const cleaned = svg.replace(/\s+/g, ' ').trim();
    const blob = new Blob([cleaned], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  // ✅ 단순화된 AI 마커 SVG 생성
  const createAIMarkerSvg = useCallback((
      isFavorite: boolean,
      survivalRate: number,
      buildingId: number,
      isHighlighted: boolean = false
  ) => {
    const displayRate = Math.round(100 - survivalRate);

    if (isFavorite) {
      // 좋아요 마커
      if (isHighlighted) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="25" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.8">
            <animate attributeName="r" values="22;32;22" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="27" cy="27" r="18" fill="#EC4899" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="27" cy="27" r="12" fill="white" opacity="0.95"/>
          <text x="27" y="31" text-anchor="middle" fill="#EC4899" font-size="11" font-weight="bold">${displayRate}%</text>
          <text x="27" y="10" text-anchor="middle" fill="#FFD700" font-size="8" font-weight="bold">#${buildingId}</text>
          <text x="27" y="5" text-anchor="middle" fill="#EC4899" font-size="10">❤️</text>
        </svg>`;
      } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <circle cx="20" cy="20" r="18" fill="#EC4899" stroke="white" stroke-width="2"/>
          <circle cx="20" cy="20" r="12" fill="white" opacity="0.95"/>
          <text x="20" y="24" text-anchor="middle" fill="#EC4899" font-size="10" font-weight="bold">${displayRate}%</text>
          <text x="20" y="8" text-anchor="middle" fill="white" font-size="12">❤️</text>
        </svg>`;
      }
    } else {
      // 기본 마커
      if (isHighlighted) {
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
      } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">
          <circle cx="18" cy="18" r="15" fill="#3B82F6" stroke="white" stroke-width="2"/>
          <circle cx="18" cy="18" r="10" fill="white" opacity="0.95"/>
          <text x="18" y="22" text-anchor="middle" fill="#3B82F6" font-size="11" font-weight="bold">${displayRate}%</text>
          <text x="18" y="6" text-anchor="middle" fill="#3B82F6" font-size="7">#${buildingId}</text>
        </svg>`;
      }
    }
  }, []);

  // ✅ 표시할 건물 목록
  const visibleBuildings = useMemo(() => {
    return buildings.filter(building => building.isVisible !== false);
  }, [buildings]);

  // ✅ 현재 상태 스냅샷
  const currentSnapshot = useMemo(() => {
    const buildingIds = visibleBuildings.map(b => b.building.building_id).sort((a, b) => a - b);
    const favoriteIds = visibleBuildings.filter(b => b.isFavorite).map(b => b.building.building_id).sort((a, b) => a - b);
    const visibleIds = visibleBuildings.map(b => b.building.building_id).sort((a, b) => a - b);

    return {
      buildingIds,
      favoriteIds,
      visibleIds,
      highlightedId: highlightedRecommendationId,
      mapInstance: map
    };
  }, [visibleBuildings, highlightedRecommendationId, map]);

  // ✅ 마커 정리 함수
  const cleanupMarkers = useCallback(() => {
    console.log('🧹 [AI 마커] 기존 마커 정리:', markersRef.current.length);

    markersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (error) {
        console.warn('마커 제거 실패:', error);
      }
    });
    markersRef.current = [];

    objectUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('URL 해제 실패:', error);
      }
    });
    objectUrlsRef.current = [];
  }, []);

  // ✅ AI 마커 생성/업데이트
  useEffect(() => {
    // 변경사항 감지
    const hasChanged =
        JSON.stringify(currentSnapshot.buildingIds) !== JSON.stringify(prevDataRef.current.buildingIds) ||
        JSON.stringify(currentSnapshot.favoriteIds) !== JSON.stringify(prevDataRef.current.favoriteIds) ||
        currentSnapshot.highlightedId !== prevDataRef.current.highlightedId ||
        currentSnapshot.mapInstance !== prevDataRef.current.mapInstance;

    if (!hasChanged) {
      console.log('🤖 [AI 마커] 변경사항 없음 - 스킵');
      return;
    }

    console.log('🤖 [AI 마커] 변경 감지:', {
      이전_건물수: prevDataRef.current.buildingIds.length,
      현재_건물수: currentSnapshot.buildingIds.length,
      이전_좋아요: prevDataRef.current.favoriteIds.length,
      현재_좋아요: currentSnapshot.favoriteIds.length,
      하이라이트_변경: prevDataRef.current.highlightedId !== currentSnapshot.highlightedId,
    });

    prevDataRef.current = currentSnapshot;

    if (!map) {
      console.log('🤖 [AI 마커] 지도 없음 - 스킵');
      cleanupMarkers();
      setAiMarkers([]);
      return;
    }

    if (visibleBuildings.length === 0) {
      console.log('🤖 [AI 마커] 건물 없음 - 스킵');
      cleanupMarkers();
      setAiMarkers([]);
      return;
    }

    console.log('🤖 [AI 마커] 생성 시작:', {
      total: visibleBuildings.length,
      favorites: currentSnapshot.favoriteIds.length,
      highlighted: currentSnapshot.highlightedId
    });

    cleanupMarkers();

    const newMarkers: any[] = [];

    visibleBuildings.forEach(building => {
      const buildingId = building.building.building_id;
      const isHighlighted = String(buildingId) === highlightedRecommendationId;
      const isFavorite = !!building.isFavorite;

      // ✅ 생존율 계산
      const topCategory = building.categories[0];
      let survivalRate = 50;
      if (topCategory?.survivalRate?.length > 0) {
        const failureRate = topCategory.survivalRate[4] || topCategory.survivalRate[0];
        survivalRate = 100 - failureRate;
      }

      console.log(`🤖 [건물 ${buildingId}] favorite: ${isFavorite}, highlighted: ${isHighlighted}, survivalRate: ${survivalRate}`);

      const svgString = createAIMarkerSvg(isFavorite, survivalRate, buildingId, isHighlighted);
      const url = svgToObjectUrl(svgString);

      // ✅ 크기 설정
      let markerSize = { width: 36, height: 36 };
      if (isHighlighted) markerSize = { width: 54, height: 54 };
      else if (isFavorite) markerSize = { width: 40, height: 40 };

      try {
        const markerImage = new window.kakao.maps.MarkerImage(
            url,
            new window.kakao.maps.Size(markerSize.width, markerSize.height),
            { offset: new window.kakao.maps.Point(markerSize.width / 2, markerSize.height / 2) }
        );

        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(building.building.lat, building.building.lng),
          map: map,
          image: markerImage,
          title: `AI 추천 건물 ${buildingId} ${isFavorite ? '(찜)' : ''}`,
          zIndex: isHighlighted ? 1000 : isFavorite ? 500 : 100,
        });

        // ✅ 마커 메타데이터
        marker._markerType = 'ai';
        marker._buildingId = buildingId;
        marker._isFavorite = isFavorite;
        marker._isHighlighted = isHighlighted;
        marker._buildingData = building;

        // 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          console.log('🤖 [AI 마커] 클릭:', buildingId);
          onAIMarkerClick(building);
        });

        newMarkers.push(marker);
      } catch (error) {
        console.error(`마커 생성 실패 (건물 ${buildingId}):`, error);
      }
    });

    markersRef.current = newMarkers;
    setAiMarkers(newMarkers);

    console.log('🤖 [AI 마커] 완료:', {
      생성됨: newMarkers.length,
      favorites: newMarkers.filter(m => m._isFavorite).length,
      highlighted: newMarkers.filter(m => m._isHighlighted).length
    });

  }, [
    currentSnapshot.buildingIds.join(','),
    currentSnapshot.favoriteIds.join(','),
    currentSnapshot.highlightedId,
    currentSnapshot.mapInstance,
    visibleBuildings,
    map,
    highlightedRecommendationId,
    cleanupMarkers,
    svgToObjectUrl,
    createAIMarkerSvg,
    onAIMarkerClick
  ]);

  // ✅ cleanup
  useEffect(() => {
    return () => {
      console.log('🧹 [AI 마커] 전체 cleanup');
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  return {
    aiMarkers,
    markerCount: aiMarkers.length,
    favoriteCount: aiMarkers.filter(m => m._isFavorite).length
  };
}
