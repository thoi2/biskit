'use client';

import { useMemo, useState } from 'react';
import { useMapMarkers } from '@/features/map/hooks/useMapMarkers';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationStore } from '@/features/ai/store';
import { MapMarkerItem } from '@/features/map/types';
import { ClusterPopup } from '../ClusterPopup';

interface UnifiedMarkersProps {
    map: any;
    selectedCategories: string[];
}

export function UnifiedMarkers({ map, selectedCategories }: UnifiedMarkersProps) {
    const { stores } = useStoreStore();
    const { setActiveTab, setHighlightedStore, setHighlightedRecommendation } = useMapStore();
    const { recommendationMarkers } = useRecommendationStore();

    // 클러스터 팝업 상태
    const [selectedCluster, setSelectedCluster] = useState<MapMarkerItem[] | null>(null);

    // ✅ 생존율 변환 함수 (690 → 6.9%)
    const convertSurvivalRate = (rate: number): number => {
        if (rate > 100) {
            return Math.round(rate / 100);
        }
        if (rate > 1) {
            return Math.round(rate);
        }
        return Math.round(rate * 100);
    };

    // ✅ 상가 마커만 따로 관리 (숨김 상태 감지 수정)
    const storeMapItems = useMemo(() => {
        console.log('📦 [상가 마커] 생성 시작');
        const items: MapMarkerItem[] = [];

        if (stores && selectedCategories && selectedCategories.length > 0) {
            const filteredStores = stores
                .filter(store => !store.hidden)  // ✅ hidden 상태 필터링
                .filter(store => {
                    const categoryName = store.categoryName || store.bizCategoryCode;
                    return selectedCategories.some(category =>
                        categoryName && categoryName.includes(category)
                    );
                });

            console.log('📦 [상가 마커] 숨김 상태 확인:', {
                totalStores: stores.length,
                hiddenStores: stores.filter(s => s.hidden).length,
                visibleStores: stores.filter(s => !s.hidden).length,
                filteredStores: filteredStores.length,
                selectedCategories: selectedCategories.length
            });

            filteredStores.forEach(store => {
                items.push({
                    id: `store-${store.id}`,
                    name: store.displayName || store.storeName || '상가명 없음',
                    category: store.categoryName || store.bizCategoryCode || '업종 정보 없음',
                    address: store.roadAddress || '주소 정보 없음',
                    coordinates: { lat: store.lat, lng: store.lng },
                    type: 'store' as const,
                    closureProbability: undefined,
                    originalData: store
                });
            });
        }

        console.log('📦 [상가 마커] 생성 완료:', items.length, '개');
        return items;
    }, [
        stores,  // ✅ 전체 stores 배열 감시 (hidden 상태 변경 감지)
        selectedCategories  // ✅ 카테고리 배열 직접 감시
    ]);

    // ✅ 추천 마커만 따로 관리 (숨김 필터링 추가)
    const recommendationMapItems = useMemo(() => {
        console.log('🤖 [추천 마커] 생성 시작');
        const items: MapMarkerItem[] = [];

        if (recommendationMarkers && recommendationMarkers.length > 0) {
            console.log('🤖 [추천 마커] 처리 중:', recommendationMarkers.length, '개');

            // ✅ 숨김 처리된 추천 제외
            const visibleRecommendations = recommendationMarkers.filter(rec => !rec.hidden);

            console.log('🤖 [추천 마커] 숨김 상태 확인:', {
                total: recommendationMarkers.length,
                hidden: recommendationMarkers.filter(r => r.hidden).length,
                visible: visibleRecommendations.length
            });

            visibleRecommendations.forEach((rec, index) => {
                const lat = Number(rec.lat);
                const lng = Number(rec.lng);

                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                    console.warn('⚠️ 잘못된 AI 추천 좌표:', rec);
                    return;
                }

                const rawRate = rec.survivalRate || 0;
                const convertedRate = convertSurvivalRate(rawRate);

                console.log('🔄 [생존율 변환]:', {
                    itemId: rec.buildingId || rec.id,
                    rawRate,
                    convertedRate,
                    rawType: typeof rawRate,
                    hidden: rec.hidden
                });

                items.push({
                    id: `recommendation-${rec.buildingId || rec.id || index}`,
                    name: rec.title || '추천 건물',
                    category: rec.category || '추천 업종',
                    address: `추천 점수: ${convertedRate}%`,
                    coordinates: { lat, lng },
                    type: 'recommendation' as const,
                    closureProbability: convertedRate,
                    originalData: rec
                });
            });
        }

        console.log('🤖 [추천 마커] 생성 완료:', items.length, '개');
        return items;
    }, [
        recommendationMarkers  // ✅ 전체 배열 감시 (hidden 상태 변경 감지)
    ]);

    // ✅ 합치기 (각각 독립적으로 변경될 수 있음)
    const allMapItems = useMemo(() => {
        const combined = [...storeMapItems, ...recommendationMapItems];

        console.log('🎯 [전체 마커] 합치기 완료:', {
            total: combined.length,
            stores: storeMapItems.length,
            recommendations: recommendationMapItems.length
        });

        return combined;
    }, [storeMapItems, recommendationMapItems]);

    // ✅ 마커 클릭 핸들러
    const handleMarkerClick = (item: MapMarkerItem) => {
        console.log('🔥 [UnifiedMarkers] 마커 클릭:', item);
        setActiveTab('result');

        if (item.type === 'store' && item.originalData) {
            const store = item.originalData;
            setHighlightedStore(store.id);
            setHighlightedRecommendation(null);
        }
        else if (item.type === 'recommendation' && item.originalData) {
            const rec = item.originalData;
            setHighlightedRecommendation(String(rec.buildingId || rec.id));
            setHighlightedStore(null);
        }
    };

    // ✅ 클러스터 클릭 핸들러
    const handleClusterClick = (items: MapMarkerItem[]) => {
        console.log('🔥 [UnifiedMarkers] 클러스터 클릭:', items.length, '개 아이템', items);
        setSelectedCluster(items);
    };

    // ✅ 클러스터 아이템 클릭 핸들러
    // UnifiedMarkers.tsx
    const handleClusterItemClick = (item: MapMarkerItem) => {
        console.log('🎯 [UnifiedMarkers] handleClusterItemClick:', item);

        const { setActiveHighlight } = useMapStore.getState();

        setSelectedCluster(null);

        // 통합 하이라이트 관리 사용
        if (item.type === 'store') {
            const storeId = parseInt(item.id.replace('store-', ''));
            setActiveHighlight('store', storeId);
        } else if (item.type === 'recommendation' && item.originalData?.buildingId) {
            setActiveHighlight('recommendation', item.originalData.buildingId);
        }

        handleMarkerClick(item);
    };

    // ✅ 전체 목록 보기 핸들러
    const handleViewAllClick = () => {
        console.log('🔥 [UnifiedMarkers] 전체 목록 보기 클릭');
        setSelectedCluster(null);
        setActiveTab('result');
    };

    // ✅ 마커 색상 클래스 함수
    const getMarkerColorClass = (probability: number) => {
        if (probability >= 80) return 'bg-red-500';
        if (probability >= 60) return 'bg-orange-500';
        if (probability >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    // ✅ 실제 지도 인스턴스 확보
    const actualMap = map || window.__debugMap || window.currentKakaoMap;

    // ✅ useMapMarkers에 합친 아이템 전달
    const { markers } = useMapMarkers({
        map: actualMap,
        mapItems: allMapItems,
        stores: [],
        recommendations: [],
        onMarkerClick: handleMarkerClick,
        onClusterClick: handleClusterClick,
    });

    return (
        <>
            {/* ✅ 클러스터 팝업 */}
            {selectedCluster && (
                <ClusterPopup
                    items={selectedCluster}
                    onClose={() => setSelectedCluster(null)}
                    onItemClick={handleClusterItemClick}
                    onViewAllClick={handleViewAllClick}
                    getMarkerColorClass={getMarkerColorClass}
                />
            )}
        </>
    );
}
