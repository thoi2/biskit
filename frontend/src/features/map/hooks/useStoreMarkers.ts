// src/features/map/hooks/useStoreMarkers.ts
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useStoreStore } from '../../stores/store/storesStore';
import { useMapStore } from '../store/mapStore';

interface UseStoreMarkersProps {
    map: any;
    selectedCategories: string[];
    onStoreClick: (store: any) => void;
    onClusterClick: (stores: any[]) => void;
}

export function useStoreMarkers({
                                    map,
                                    selectedCategories,
                                    onStoreClick,
                                    onClusterClick
                                }: UseStoreMarkersProps) {
    const { stores } = useStoreStore();
    const { highlightedStoreId } = useMapStore();
    const [storeMarkers, setStoreMarkers] = useState<any[]>([]);
    const objectUrlsRef = useRef<string[]>([]);

    // ✅ 이전 상태를 추적하는 ref 추가
    const prevDataRef = useRef<{
        storeCount: number;
        selectedCategories: string;
        highlightedStoreId: number | null;
        mapInstance: any;
    }>({
        storeCount: 0,
        selectedCategories: '',
        highlightedStoreId: null,
        mapInstance: null
    });

    // ✅ SVG -> Blob URL 변환 (의존성 없음)
    const svgToObjectUrl = useCallback((svg: string): string => {
        const cleaned = svg.replace(/\s+/g, ' ').trim();
        const blob = new Blob([cleaned], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        objectUrlsRef.current.push(url);
        return url;
    }, []);

    // ✅ 상가 마커 SVG 생성 (의존성 없음)
    const createStoreSvg = useCallback((isHighlighted: boolean) => {
        if (isHighlighted) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.8">
          <animate attributeName="r" values="18;28;18" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="24" cy="24" r="18" fill="#22DD22" stroke="white" stroke-width="3"/>
        <circle cx="24" cy="24" r="10" fill="rgba(255,255,255,0.3)"/>
        <text x="24" y="28" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🏪</text>
      </svg>`;
        } else {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <circle cx="16" cy="16" r="14" fill="#22C55E" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">🏪</text>
      </svg>`;
        }
    }, []);

    // ✅ 클러스터 SVG 생성 (의존성 없음)
    const createClusterSvg = useCallback((count: number, isHighlighted: boolean) => {
        const displayCount = count > 99 ? '99+' : String(count);

        if (isHighlighted) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="24" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.8">
          <animate attributeName="r" values="20;30;20" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="26" cy="26" r="20" fill="#22C55E" stroke="white" stroke-width="3"/>
        <circle cx="26" cy="26" r="15" fill="white" opacity="0.9"/>
        <text x="26" y="31" text-anchor="middle" fill="#22C55E" font-size="14" font-weight="bold">${displayCount}</text>
      </svg>`;
        } else {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="#22C55E" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="20" r="13" fill="white" opacity="0.9"/>
        <text x="20" y="24" text-anchor="middle" fill="#22C55E" font-size="14" font-weight="bold">${displayCount}</text>
      </svg>`;
        }
    }, []);

    // ✅ 좌표별 클러스터링 (의존성 없음)
    const groupStoresByCoordinates = useCallback((storeList: any[]) => {
        const groups: Record<string, any[]> = {};

        storeList.forEach(store => {
            const key = `${store.lat.toFixed(5)}_${store.lng.toFixed(5)}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(store);
        });

        return groups;
    }, []);

    // ✅ 필터링된 상가 목록 (안정된 의존성)
    const visibleStores = useMemo(() => {
        if (!stores || selectedCategories.length === 0) return [];

        return stores
            .filter(store => !store.hidden)
            .filter(store => {
                const categoryName = store.categoryName || store.bizCategoryCode;
                return selectedCategories.some(category =>
                    categoryName && categoryName.includes(category)
                );
            });
    }, [stores, selectedCategories]);

    // ✅ 상가 마커 생성/업데이트 (변경 감지 최적화)
    useEffect(() => {
        // ✅ 현재 상태 스냅샷
        const currentData = {
            storeCount: visibleStores.length,
            selectedCategories: JSON.stringify(selectedCategories),
            highlightedStoreId,
            mapInstance: map
        };

        // ✅ 변경사항 감지 (깊은 비교)
        const hasChanged =
            currentData.storeCount !== prevDataRef.current.storeCount ||
            currentData.selectedCategories !== prevDataRef.current.selectedCategories ||
            currentData.highlightedStoreId !== prevDataRef.current.highlightedStoreId ||
            currentData.mapInstance !== prevDataRef.current.mapInstance;

        // ✅ 변경사항이 없으면 스킵
        if (!hasChanged) {
            console.log('📦 [상가 마커] 변경사항 없음 - 스킵');
            return;
        }

        console.log('📦 [상가 마커] 변경 감지:', {
            storeCount: currentData.storeCount,
            categories: selectedCategories.length,
            highlighted: currentData.highlightedStoreId,
            hasMap: !!map
        });

        // ✅ 이전 상태 업데이트
        prevDataRef.current = currentData;

        // 지도가 없거나 데이터가 없으면 마커 제거
        if (!map || visibleStores.length === 0) {
            console.log('📦 [상가 마커] 조건 미충족 - 마커 제거');

            // 기존 마커 제거
            storeMarkers.forEach(marker => {
                try {
                    marker.setMap(null);
                } catch (error) {
                    console.warn('상가 마커 제거 실패:', error);
                }
            });

            // ✅ 조건문으로 setState 호출 최소화
            if (storeMarkers.length > 0) {
                setStoreMarkers([]);
            }
            return;
        }

        console.log('📦 [상가 마커] 생성 시작:', visibleStores.length);

        // 기존 마커 제거
        storeMarkers.forEach(marker => {
            try {
                marker.setMap(null);
            } catch (error) {
                console.warn('상가 마커 제거 실패:', error);
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

        // 좌표별 그룹화
        const storeGroups = groupStoresByCoordinates(visibleStores);
        const newMarkers: any[] = [];

        Object.entries(storeGroups).forEach(([coordinateKey, storeList]) => {
            const [lat, lng] = coordinateKey.split('_').map(Number);
            const markerPosition = new window.kakao.maps.LatLng(lat, lng);

            if (storeList.length === 1) {
                // ✅ 단일 상가 마커
                const store = storeList[0];
                const isHighlighted = highlightedStoreId === store.id;

                const svgString = createStoreSvg(isHighlighted);
                const url = svgToObjectUrl(svgString);
                const markerSize = isHighlighted
                    ? { width: 48, height: 48 }
                    : { width: 32, height: 32 };

                const markerImage = new window.kakao.maps.MarkerImage(
                    url,
                    new window.kakao.maps.Size(markerSize.width, markerSize.height),
                    { offset: new window.kakao.maps.Point(markerSize.width / 2, markerSize.height / 2) }
                );

                const marker = new window.kakao.maps.Marker({
                    position: markerPosition,
                    map: map,
                    image: markerImage,
                    title: store.displayName || store.storeName,
                    zIndex: isHighlighted ? 300 : 100,
                });

                marker._markerType = 'store';
                marker._storeData = store;

                // ✅ 이벤트 리스너는 한번만 등록
                window.kakao.maps.event.addListener(marker, 'click', () => {
                    onStoreClick(store);
                });

                newMarkers.push(marker);

            } else {
                // ✅ 클러스터 마커
                const isClusterHighlighted = storeList.some(store =>
                    highlightedStoreId === store.id
                );

                const clusterSvg = createClusterSvg(storeList.length, isClusterHighlighted);
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
                    map: map,
                    image: clusterImage,
                    title: `상가 클러스터 ${storeList.length}개`,
                    zIndex: isClusterHighlighted ? 400 : 200,
                });

                clusterMarker._markerType = 'store-cluster';
                clusterMarker._storeList = storeList;

                // 클릭 이벤트
                window.kakao.maps.event.addListener(clusterMarker, 'click', () => {
                    onClusterClick(storeList);
                });

                newMarkers.push(clusterMarker);
            }
        });

        setStoreMarkers(newMarkers);

        console.log('📦 [상가 마커] 완료:', {
            stores: visibleStores.length,
            groups: Object.keys(storeGroups).length,
            markers: newMarkers.length
        });

    }, [
        // ✅ 안정된 의존성만 포함
        map,
        visibleStores.length, // ✅ 배열 자체가 아닌 길이만
        highlightedStoreId,
        JSON.stringify(selectedCategories), // ✅ 문자열로 안정화
    ]); // ✅ 함수들은 useCallback으로 안정화했으므로 제외

    // ✅ cleanup
    useEffect(() => {
        return () => {
            console.log('🧹 [상가 마커] cleanup');
            storeMarkers.forEach(marker => {
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

    return { storeMarkers };
}
