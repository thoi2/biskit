// src/features/map/hooks/useMapMarkers.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { MapMarkerItem } from '../types';
import { useMapStore } from '../store/mapStore';
import { useRecommendationStore } from '../../ai/store';
import { useStoreStore } from '../../stores/store/storesStore';

interface UseMapMarkersProps {
  map: any;
  mapItems: MapMarkerItem[];
  stores: any[];
  recommendations: any[];
  onMarkerClick: (item: MapMarkerItem) => void;
  onClusterClick: (items: MapMarkerItem[]) => void;
}

export function useMapMarkers({
                                map,
                                mapItems = [],
                                stores = [],
                                recommendations = [],
                                onMarkerClick,
                                onClusterClick,
                              }: UseMapMarkersProps) {
  const [markers, setMarkers] = useState<any[]>([]);
  const {
    highlightedStoreId,
    highlightedRecommendationId,
    setActiveTab,
    setHighlightedStore,
    setHighlightedRecommendation
  } = useMapStore();
  const { highlightMarker } = useRecommendationStore();
  const { selectStore } = useStoreStore();

  // ✅ 타입별 데이터 추적용 ref
  const prevStoreDataRef = useRef<string>('');
  const prevRecommendationDataRef = useRef<string>('');
  const prevHighlightRef = useRef<string>('');
  const firstRunRef = useRef(true);

  // ✅ Blob URL 관리용 ref
  const objectUrlsRef = useRef<string[]>([]);

  // ✅ SVG -> Blob URL 변환 유틸
  const svgToObjectUrl = useCallback((svg: string): string => {
    const cleaned = svg.replace(/\s+/g, ' ').trim();
    const blob = new Blob([cleaned], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  // SVG 생성 함수들 (기존과 동일)
  const createRecommendationSvg = useCallback((item: MapMarkerItem, isHighlighted: boolean) => {
    const displayNumber = String(item.closureProbability || 0);

    if (isHighlighted) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54">
            <circle cx="27" cy="27" r="25" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.8">
                <animate attributeName="r" values="22;32;22" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="27" cy="27" r="18" fill="#FF4444" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="27" cy="27" r="12" fill="white" opacity="0.95"/>
            <text x="27" y="31" text-anchor="middle" fill="#FF4444" font-size="12" font-weight="bold" font-family="Arial">${displayNumber}%</text>
            <circle cx="27" cy="8" r="2" fill="#FF4444" opacity="0.8"/>
        </svg>`;
    } else {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">
            <circle cx="18" cy="18" r="15" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <circle cx="18" cy="18" r="10" fill="white" opacity="0.95"/>
            <text x="18" y="22" text-anchor="middle" fill="#3B82F6" font-size="11" font-weight="bold" font-family="Arial">${displayNumber}%</text>
            <circle cx="18" cy="6" r="2" fill="#3B82F6" opacity="0.7"/>
        </svg>`;
    }
  }, []);

  const createStoreSvg = useCallback((isHighlighted: boolean) => {
    if (isHighlighted) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.8">
                <animate attributeName="r" values="18;28;18" dur="1s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="24" cy="24" r="18" fill="#22DD22" stroke="white" stroke-width="3"/>
            <circle cx="24" cy="24" r="10" fill="rgba(255,255,255,0.3)"/>
        </svg>`;
    } else {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="green" stroke="white" stroke-width="2"/>
        </svg>`;
    }
  }, []);

  const createClusterSvg = useCallback((count: number, storeCount: number, recCount: number, favCount: number = 0, isHighlighted: boolean) => {
    const displayCount = count > 99 ? '99+' : String(count);

    if (isHighlighted) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.8">
                <animate attributeName="r" values="20;30;20" dur="1s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="26" cy="26" r="20" fill="#FF8C00" stroke="white" stroke-width="3"/>
            <circle cx="26" cy="26" r="15" fill="white" opacity="0.9"/>
            <text x="26" y="31" text-anchor="middle" fill="#FF8C00" font-size="14" font-weight="bold" font-family="Arial">${displayCount}</text>
            ${storeCount > 0 ? '<circle cx="20" cy="10" r="2" fill="#22C55E" opacity="0.8"/>' : ''}
            ${recCount > 0 ? '<circle cx="26" cy="10" r="2" fill="#3B82F6" opacity="0.8"/>' : ''}
            ${favCount > 0 ? '<circle cx="32" cy="10" r="2" fill="#EC4899" opacity="0.8"/>' : ''}
        </svg>`;
    } else {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
            <circle cx="20" cy="20" r="18" fill="orange" stroke="white" stroke-width="2"/>
            <circle cx="20" cy="20" r="13" fill="white" opacity="0.9"/>
            <text x="20" y="24" text-anchor="middle" fill="orange" font-size="14" font-weight="bold" font-family="Arial">${displayCount}</text>
            ${storeCount > 0 ? '<circle cx="15" cy="7" r="2" fill="#22C55E" opacity="0.8"/>' : ''}
            ${recCount > 0 ? '<circle cx="20" cy="7" r="2" fill="#3B82F6" opacity="0.8"/>' : ''}
            ${favCount > 0 ? '<circle cx="25" cy="7" r="2" fill="#EC4899" opacity="0.8"/>' : ''}
        </svg>`;
    }
  }, []);

  // 마커 클릭 핸들러들
  const handleRecommendationClick = useCallback((item: MapMarkerItem) => {
    const recId = item.id.replace('recommendation-', '');
    setActiveTab('result');
    setHighlightedRecommendation(recId);
    setHighlightedStore(null);

    if (item.originalData?.buildingId) {
      highlightMarker(item.originalData.buildingId);
    }

    onMarkerClick(item);
  }, [setActiveTab, setHighlightedRecommendation, setHighlightedStore, highlightMarker, onMarkerClick]);

  const handleStoreClick = useCallback((item: MapMarkerItem) => {
    const storeId = parseInt(item.id.replace('store-', ''));
    const store = item.originalData;

    if (store) {
      setActiveTab('result');
      selectStore(store);
      setHighlightedStore(storeId);
      setHighlightedRecommendation(null);
    }

    onMarkerClick(item);
  }, [setActiveTab, selectStore, setHighlightedStore, setHighlightedRecommendation, onMarkerClick]);

  const handleClusterClick = useCallback((items: MapMarkerItem[]) => {
    onClusterClick(items);
  }, [onClusterClick]);

  // 좌표 그룹화 함수 (클러스터링)
  const groupItemsByCoordinates = useCallback((items: MapMarkerItem[]) => {
    const groups: Record<string, MapMarkerItem[]> = {};

    items.forEach(item => {
      const key = `${item.coordinates.lat.toFixed(5)}_${item.coordinates.lng.toFixed(5)}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, []);

  // 🔥 **핵심: 타입별 선택적 마커 생성 및 관리**
  useEffect(() => {
    const actualMap = map || window.__debugMap || window.currentKakaoMap;
    if (!actualMap) return;

    // ✅ 타입별 데이터 분리 및 해시 생성
    const storeItems = mapItems.filter(item => item.type === 'store');
    const recommendationItems = mapItems.filter(item => item.type === 'recommendation');

    const storeDataHash = JSON.stringify({
      items: storeItems.map(i => ({
        id: i.id,
        lat: i.coordinates.lat,
        lng: i.coordinates.lng,
        hidden: i.originalData?.hidden
      })),
      highlightedStoreId
    });

    const recommendationDataHash = JSON.stringify({
      items: recommendationItems.map(i => ({
        id: i.id,
        lat: i.coordinates.lat,
        lng: i.coordinates.lng,
        hidden: i.originalData?.hidden
      })),
      highlightedRecommendationId
    });

    const highlightHash = `${highlightedStoreId}_${highlightedRecommendationId}`;

    // ✅ 변경사항 감지
    const storeDataChanged = storeDataHash !== prevStoreDataRef.current;
    const recommendationDataChanged = recommendationDataHash !== prevRecommendationDataRef.current;
    const highlightChanged = highlightHash !== prevHighlightRef.current;
    const isFirstRun = firstRunRef.current;

    // ✅ 아무 변경도 없으면 스킵
    if (!isFirstRun && !storeDataChanged && !recommendationDataChanged && !highlightChanged) {
      console.log('⏭️ [useMapMarkers] 변경사항 없음 - 스킵');
      return;
    }

    console.log('🔄 [useMapMarkers] 변경사항 감지:', {
      storeDataChanged,
      recommendationDataChanged,
      highlightChanged,
      isFirstRun,
      storeCount: storeItems.length,
      recommendationCount: recommendationItems.length
    });

    // ✅ 변경된 타입에 따른 선택적 마커 제거
    const currentMarkers = [...markers];
    const survivingMarkers: any[] = [];

    if (storeDataChanged || isFirstRun) {
      console.log('📦 [상가 마커] 제거');
      currentMarkers.forEach(marker => {
        if (marker._markerType === 'store' || marker._markerType === 'cluster') {
          try {
            marker.setMap(null);
          } catch (error) {
            console.warn('상가 마커 제거 실패:', error);
          }
        } else {
          survivingMarkers.push(marker); // 상가가 아닌 마커는 보존
        }
      });
    }

    if (recommendationDataChanged || isFirstRun) {
      console.log('🤖 [추천 마커] 제거');
      const markersToCheck = storeDataChanged ? survivingMarkers : currentMarkers;
      survivingMarkers.length = 0; // 다시 초기화

      markersToCheck.forEach(marker => {
        if (marker._markerType === 'recommendation' || marker._markerType === 'cluster') {
          try {
            marker.setMap(null);
          } catch (error) {
            console.warn('추천 마커 제거 실패:', error);
          }
        } else {
          survivingMarkers.push(marker); // 추천이 아닌 마커는 보존
        }
      });
    }

    if (highlightChanged && !storeDataChanged && !recommendationDataChanged && !isFirstRun) {
      console.log('✨ [하이라이트만 변경] - 전체 재생성');
      // 하이라이트만 변경된 경우에도 전체 재생성 (SVG 특성상 필요)
      currentMarkers.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (error) {
          console.warn('마커 제거 실패:', error);
        }
      });
      survivingMarkers.length = 0;
    }

    // ✅ Blob URL 해제 (필요시에만)
    if (storeDataChanged || recommendationDataChanged || isFirstRun || highlightChanged) {
      objectUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('URL 해제 실패:', error);
        }
      });
      objectUrlsRef.current = [];
    }

    // 데이터가 없으면 빈 배열로 설정
    if (!mapItems || mapItems.length === 0) {
      setMarkers(survivingMarkers);
      prevStoreDataRef.current = storeDataHash;
      prevRecommendationDataRef.current = recommendationDataHash;
      prevHighlightRef.current = highlightHash;
      firstRunRef.current = false;
      return;
    }

    // ✅ 마커 재생성
    const itemGroups = groupItemsByCoordinates(mapItems);
    const newMarkers: any[] = [...survivingMarkers];

    console.log(`📦 [마커 재생성] 시작: ${Object.keys(itemGroups).length}개 그룹, 기존 ${survivingMarkers.length}개 보존`);

    Object.entries(itemGroups).forEach(([coordinateKey, items]) => {
      const [lat, lng] = coordinateKey.split('_').map(Number);
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);

      if (items.length === 1) {
        // 단일 마커
        const item = items[0];
        let isHighlighted = false;

        if (item.type === 'store') {
          isHighlighted = highlightedStoreId === parseInt(item.id.replace('store-', ''));
        } else if (item.type === 'recommendation') {
          const recIdFromItem = item.id.replace('recommendation-', '');
          const buildingId = item.originalData?.buildingId;
          isHighlighted = highlightedRecommendationId === recIdFromItem;
          if (!isHighlighted && buildingId) {
            isHighlighted = highlightedRecommendationId === String(buildingId);
          }
        }

        let svgString = '';
        let markerSize = { width: 32, height: 32 };

        if (item.type === 'store') {
          svgString = createStoreSvg(isHighlighted);
        } else if (item.type === 'recommendation') {
          svgString = createRecommendationSvg(item, isHighlighted);
          markerSize = { width: 36, height: 36 };
        }

        if (svgString) {
          const url = svgToObjectUrl(svgString);
          const currentSize = isHighlighted
              ? { width: markerSize.width * 1.5, height: markerSize.height * 1.5 }
              : markerSize;

          const markerImage = new window.kakao.maps.MarkerImage(
              url,
              new window.kakao.maps.Size(currentSize.width, currentSize.height),
              { offset: new window.kakao.maps.Point(currentSize.width / 2, currentSize.height / 2) }
          );

          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            map: actualMap,
            image: markerImage,
            title: item.name,
            zIndex: isHighlighted ? 200 : 100,
          });

          // ✅ 마커에 타입 정보 추가
          marker._markerType = item.type;

          // 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', () => {
            if (item.type === 'store') {
              handleStoreClick(item);
              if (onClusterClick) onClusterClick([item]);
            } else if (item.type === 'recommendation') {
              handleRecommendationClick(item);
              if (onClusterClick) onClusterClick([item]);
            }
          });

          newMarkers.push(marker);
        }

      } else {
        // 클러스터 마커
        const storeCount = items.filter(item => item.type === 'store').length;
        const recommendationCount = items.filter(item => item.type === 'recommendation').length;
        const favoriteCount = items.filter(item => item.type === 'favorite').length;

        const isClusterHighlighted = items.some(item => {
          if (item.type === 'store') {
            const storeId = parseInt(item.id.replace('store-', ''));
            return highlightedStoreId === storeId;
          } else if (item.type === 'recommendation') {
            const recIdFromItem = item.id.replace('recommendation-', '');
            const buildingId = item.originalData?.buildingId;
            const isMatch1 = highlightedRecommendationId === recIdFromItem;
            const isMatch2 = highlightedRecommendationId === String(buildingId);
            return isMatch1 || isMatch2;
          }
          return false;
        });

        const clusterSvg = createClusterSvg(items.length, storeCount, recommendationCount, favoriteCount, isClusterHighlighted);
        const clusterSize = isClusterHighlighted
            ? { width: 52, height: 52 }
            : { width: 40, height: 40 };

        const clusterUrl = svgToObjectUrl(clusterSvg);
        const clusterImage = new window.kakao.maps.MarkerImage(
            clusterUrl,
            new window.kakao.maps.Size(clusterSize.width, clusterSize.height),
            { offset: new window.kakao.maps.Point(clusterSize.width / 2, clusterSize.height / 2) }
        );

        const clusterMarker = new window.kakao.maps.Marker({
          position: markerPosition,
          map: actualMap,
          image: clusterImage,
          title: `클러스터 ${items.length}개`,
          zIndex: isClusterHighlighted ? 400 : 300,
        });

        // ✅ 클러스터 마커에 타입 정보 추가
        clusterMarker._markerType = 'cluster';

        window.kakao.maps.event.addListener(clusterMarker, 'click', () => {
          const firstRecommendation = items.find(item => item.type === 'recommendation');
          const firstStore = items.find(item => item.type === 'store');

          if (firstRecommendation) {
            const recId = firstRecommendation.id.replace('recommendation-', '');
            setHighlightedRecommendation(recId);
            setHighlightedStore(null);
          } else if (firstStore) {
            const storeId = parseInt(firstStore.id.replace('store-', ''));
            setHighlightedStore(storeId);
            setHighlightedRecommendation(null);
          }

          handleClusterClick(items);
        });

        newMarkers.push(clusterMarker);
      }
    });

    setMarkers(newMarkers);

    // 상태 업데이트
    prevStoreDataRef.current = storeDataHash;
    prevRecommendationDataRef.current = recommendationDataHash;
    prevHighlightRef.current = highlightHash;
    firstRunRef.current = false;

    console.log(`✅ [마커 재생성] 완료: 전체 ${newMarkers.length}개 (보존: ${survivingMarkers.length}, 신규: ${newMarkers.length - survivingMarkers.length})`);

  }, [map, mapItems, highlightedStoreId, highlightedRecommendationId]);

  // cleanup
  useEffect(() => {
    return () => {
      console.log('🗑️ [cleanup] 모든 마커 및 URL 제거');

      markers.forEach(marker => {
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
  }, []);

  return { markers };
}
