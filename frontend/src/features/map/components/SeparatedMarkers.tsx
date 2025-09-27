// src/features/map/components/SeparatedMarkers.tsx
'use client';

import { useState, useCallback } from 'react';
import { useStoreMarkers } from '../hooks/useStoreMarkers';
import { useAIMarkers } from '../hooks/useAIMarkers';
import { useMapStore } from '../store/mapStore';
import { useStoreStore } from '../../stores/store/storesStore';
import { useRecommendationStore } from '../../ai/store';
import { ClusterPopup } from './ClusterPopup';

interface SeparatedMarkersProps {
    map: any;
    selectedCategories: string[];
}

export function SeparatedMarkers({ map, selectedCategories }: SeparatedMarkersProps) {
    const {
        setActiveTab,
        setHighlightedStore,
        setHighlightedRecommendation,
        highlightedStoreId,
        highlightedRecommendationId
    } = useMapStore();

    const { selectStore } = useStoreStore();
    const { highlightMarker, clearHighlight } = useRecommendationStore();

    // 클러스터/팝업 상태
    const [selectedStoreCluster, setSelectedStoreCluster] = useState<any[] | null>(null);

    // ✅ 색상 함수 정의
    const getMarkerColorClass = (probability: number) => {
        if (probability >= 80) return 'bg-red-500';
        if (probability >= 60) return 'bg-orange-500';
        if (probability >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    // ✅ 상가 클릭 핸들러 (안정화)
    const handleStoreClick = useCallback((store: any) => {
        console.log('📦 [상가 클릭] ID:', store.id);

        // ✅ AI 하이라이트 먼저 해제
        clearHighlight();
        setHighlightedRecommendation(null);

        // 상가 하이라이트 및 선택
        const storeId = typeof store.id === 'string' ? parseInt(store.id) : store.id;
        setHighlightedStore(storeId);
        selectStore(store);
        setActiveTab('result');

        // 지도 중심 이동
        if (map && store.lat && store.lng) {
            const moveLatLng = new window.kakao.maps.LatLng(store.lat, store.lng);
            map.setCenter(moveLatLng);
        }
    }, [map, clearHighlight, setHighlightedRecommendation, setHighlightedStore, selectStore, setActiveTab]);

    // ✅ 상가 클러스터 클릭 핸들러
    const handleStoreClusterClick = useCallback((stores: any[]) => {
        console.log('📦 [상가 클러스터 클릭] 개수:', stores.length);
        setSelectedStoreCluster(stores);
    }, []);

    // ✅ AI 마커 클릭 핸들러 (안정화)
    const handleAIMarkerClick = useCallback((building: any) => {
        const buildingId = building.building?.building_id || building.buildingId;
        console.log('🤖 [AI 마커 클릭] ID:', buildingId);

        // ✅ 상가 하이라이트 먼저 해제
        setHighlightedStore(null);

        // AI 추천 하이라이트
        setHighlightedRecommendation(String(buildingId));
        highlightMarker(buildingId);
        setActiveTab('result');

        // 지도 중심 이동
        if (map && building.building?.lat && building.building?.lng) {
            const moveLatLng = new window.kakao.maps.LatLng(
                building.building.lat,
                building.building.lng
            );
            map.setCenter(moveLatLng);
        }
    }, [map, setHighlightedStore, setHighlightedRecommendation, highlightMarker, setActiveTab]);

    // ✅ 클러스터 팝업에서 상가 선택
    const handleStoreClusterItemClick = useCallback((store: any) => {
        setSelectedStoreCluster(null);
        handleStoreClick(store);
    }, [handleStoreClick]);

    // ✅ 상가 마커 Hook
    const { storeMarkers } = useStoreMarkers({
        map,
        selectedCategories,
        onStoreClick: handleStoreClick,
        onClusterClick: handleStoreClusterClick
    });

    // ✅ AI 마커 Hook
    const { aiMarkers, markerCount, favoriteCount } = useAIMarkers({
        map,
        onAIMarkerClick: handleAIMarkerClick
    });

    console.log('🎯 [SeparatedMarkers] 마커 상태:', {
        stores: storeMarkers.length,
        ai: markerCount,
        favorites: favoriteCount,
        highlightedStore: highlightedStoreId,
        highlightedRecommendation: highlightedRecommendationId
    });

    return (
        <>
            {/* ✅ 상가 클러스터 팝업 */}
            {selectedStoreCluster && (
                <ClusterPopup
                    type="store"
                    items={selectedStoreCluster}
                    onClose={() => setSelectedStoreCluster(null)}
                    onItemClick={handleStoreClusterItemClick}
                    onViewAllClick={() => {
                        setSelectedStoreCluster(null);
                        setActiveTab('result');
                    }}
                    getMarkerColorClass={getMarkerColorClass}
                />
            )}
        </>
    );
}
