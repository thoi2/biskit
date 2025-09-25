// hooks/useMapMarkers.ts

import { useEffect, useState } from 'react';
import { MapMarkerItem } from '../types';
import { useMapStore } from '../store/mapStore';

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
  mapItems,
  stores,
  recommendations,
  onMarkerClick,
  onClusterClick,
}: UseMapMarkersProps) {
  const [markers, setMarkers] = useState<any[]>([]);
  const { highlightedStoreId, highlightedRecommendationId } = useMapStore();

  // 좌표가 같은 아이템들을 그룹화하는 함수
  const groupItemsByCoordinates = (items: MapMarkerItem[]) => {
    const groups: Record<string, MapMarkerItem[]> = {};

    items.forEach(item => {
      const key = `${item.coordinates.lat.toFixed(
        5,
      )}_${item.coordinates.lng.toFixed(5)}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  };

  const getMarkerColorHex = (probability: number) => {
    if (probability >= 80) return '#ef4444';
    if (probability >= 60) return '#f97316';
    if (probability >= 40) return '#eab308';
    return '#22c55e';
  };

  // 🔥 마커 생성 및 관리
  useEffect(() => {
    if (!map) return;

    // 기존 마커들 제거
    markers.forEach(marker => marker.setMap(null));

    if (!mapItems.length) {
      setMarkers([]);
      return;
    }

    const itemGroups = groupItemsByCoordinates(mapItems);
    const newMarkers: any[] = [];

    Object.entries(itemGroups).forEach(([coordinateKey, items]) => {
      const [lat, lng] = coordinateKey.split('_').map(Number);
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);

      if (items.length === 1) {
        // 🔥 단일 마커 - DOM 요소 생성 방식으로 변경
        const item = items[0];
        const isHighlighted =
          item.type === 'store'
            ? highlightedStoreId === parseInt(item.id.replace('store-', ''))
            : highlightedRecommendationId ===
              item.id.replace('recommendation-', '');

        // 🔥 DOM 요소 생성
        const markerElement = document.createElement('div');
        markerElement.style.position = 'relative';
        markerElement.style.cursor = 'pointer';

        if (item.type === 'store') {
          markerElement.innerHTML = `
            <div style="
              width: 32px; height: 32px; background-color: #3b82f6;
              border: 2px solid white; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              font-size: 12px; font-weight: bold; color: white;
              ${
                isHighlighted
                  ? 'animation: pulse 1s infinite; transform: scale(1.2); box-shadow: 0 0 20px #3b82f6;'
                  : ''
              }
            ">🏪</div>
            <div style="
              position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
              margin-top: 4px; background: white; padding: 4px 8px; border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;
              font-size: 12px; font-weight: 500; white-space: nowrap; color: #374151;
              max-width: 200px; overflow: hidden; text-overflow: ellipsis;
              ${isHighlighted ? 'background: #3b82f6; color: white;' : ''}
            ">${item.name}</div>
          `;
        } else {
          const markerColor = getMarkerColorHex(item.closureProbability || 0);
          markerElement.innerHTML = `
            <div style="
              width: 32px; height: 32px; background-color: ${markerColor};
              border: 2px solid white; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              font-size: 10px; font-weight: bold; color: white;
              ${
                isHighlighted
                  ? 'animation: pulse 1s infinite; transform: scale(1.2); box-shadow: 0 0 20px ' +
                    markerColor +
                    ';'
                  : ''
              }
            ">${item.closureProbability}%</div>
            <div style="
              position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
              margin-top: 4px; background: white; padding: 4px 8px; border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;
              font-size: 12px; font-weight: 500; white-space: nowrap; color: #374151;
              max-width: 200px; overflow: hidden; text-overflow: ellipsis;
              ${
                isHighlighted
                  ? 'background: ' + markerColor + '; color: white;'
                  : ''
              }
            ">${item.name}</div>
          `;
        }

        // 🔥 DOM 이벤트 리스너 추가
        markerElement.addEventListener('click', e => {
          e.stopPropagation();
          console.log('Single marker clicked:', item);
          onMarkerClick(item);
        });

        const customOverlay = new window.kakao.maps.CustomOverlay({
          map: map,
          position: markerPosition,
          content: markerElement, // 🔥 DOM 요소 직접 전달
          yAnchor: 1,
          clickable: true,
        });

        newMarkers.push(customOverlay);
      } else {
        // 🔥 클러스터 마커 - DOM 요소 생성 방식으로 변경
        const storeCount = items.filter(item => item.type === 'store').length;
        const recommendationCount = items.filter(
          item => item.type === 'recommendation',
        ).length;

        const isClusterHighlighted = items.some(item => {
          if (item.type === 'store') {
            return (
              highlightedStoreId === parseInt(item.id.replace('store-', ''))
            );
          } else {
            return (
              highlightedRecommendationId ===
              item.id.replace('recommendation-', '')
            );
          }
        });

        // 🔥 DOM 요소 생성
        const clusterElement = document.createElement('div');
        clusterElement.style.position = 'relative';
        clusterElement.style.cursor = 'pointer';

        clusterElement.innerHTML = `
          <div style="
            width: 40px; height: 40px; background-color: #f59e0b;
            border: 3px solid white; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            font-size: 14px; font-weight: bold; color: white;
            ${
              isClusterHighlighted
                ? 'animation: pulse 1s infinite; transform: scale(1.2); box-shadow: 0 0 20px #f59e0b;'
                : ''
            }
          ">+${items.length}</div>
          <div style="
            position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
            margin-top: 4px; background: #f59e0b; padding: 4px 8px; border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid #d97706;
            font-size: 11px; font-weight: 500; white-space: nowrap; color: white;
            ${isClusterHighlighted ? 'background: #d97706;' : ''}
          ">${storeCount > 0 ? `상가 ${storeCount}개` : ''}${
          storeCount > 0 && recommendationCount > 0 ? ', ' : ''
        }${recommendationCount > 0 ? `추천 ${recommendationCount}개` : ''}</div>
        `;

        // 🔥 DOM 이벤트 리스너 추가
        clusterElement.addEventListener('click', e => {
          e.stopPropagation();
          console.log('Cluster marker clicked:', items);
          onClusterClick(items);
        });

        const customOverlay = new window.kakao.maps.CustomOverlay({
          map: map,
          position: markerPosition,
          content: clusterElement, // 🔥 DOM 요소 직접 전달
          yAnchor: 1,
          clickable: true,
        });

        newMarkers.push(customOverlay);
      }
    });

    setMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => {
        if (marker) {
          marker.setMap(null);
        }
      });
    };
  }, [
    map,
    mapItems,
    stores,
    // recommendations,
    onMarkerClick,
    onClusterClick,
    highlightedStoreId,
    highlightedRecommendationId,
  ]);

  return { markers };
}
