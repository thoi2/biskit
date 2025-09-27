// src/features/map/components/SeparatedMarkers.tsx
'use client';

import { useState } from 'react';
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
    const { highlightMarker } = useRecommendationStore();

    // 클러스터/팝업 상태
    const [selectedStoreCluster, setSelectedStoreCluster] = useState<any[] | null>(null);

    // ✅ 색상 함수 정의
    const getMarkerColorClass = (probability: number) => {
        if (probability >= 80) return 'bg-red-500';
        if (probability >= 60) return 'bg-orange-500';
        if (probability >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    // ✅ 상가 클릭 핸들러
    const handleStoreClick = (store: any) => {
        console.log('📦 상가 마커 클릭:', store.id);

        // 다른 하이라이트 해제
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
    };

    // ✅ 상가 클러스터 클릭 핸들러
    const handleStoreClusterClick = (stores: any[]) => {
        console.log('📦 상가 클러스터 클릭:', stores.length, '개');
        setSelectedStoreCluster(stores);
    };

    // ✅ AI 마커 클릭 핸들러
    const handleAIMarkerClick = (building: any) => {
        console.log('🤖 AI 마커 클릭:', building.building.building_id);

        const buildingId = building.building?.building_id || building.buildingId;

        // 다른 하이라이트 해제
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
    };

    // ✅ 클러스터 팝업에서 상가 선택
    const handleStoreClusterItemClick = (store: any) => {
        setSelectedStoreCluster(null);
        handleStoreClick(store);
    };

    // ✅ 상가 마커 Hook
    const { storeMarkers } = useStoreMarkers({
        map,
        selectedCategories,
        onStoreClick: handleStoreClick,
        onClusterClick: handleStoreClusterClick
    });

    // ✅ AI 마커 Hook
    const { aiMarkers } = useAIMarkers({
        map,
        onAIMarkerClick: handleAIMarkerClick
    });

    console.log('🎯 [SeparatedMarkers] 총 마커:', {
        stores: storeMarkers.length,
        ai: aiMarkers.length,
        total: storeMarkers.length + aiMarkers.length,
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
