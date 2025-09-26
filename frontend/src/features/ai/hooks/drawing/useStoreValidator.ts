// src/features/map/hooks/useStoreValidator.ts
import { useCallback } from 'react';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useAreaCalculator } from './useAreaCalculator';

const AREA_LIMITS = {
    MAX_AREA: 5000000,
    MAX_STORES: 200,
    MIN_STORES: 1,
};

export function useStoreValidator() {
    const { stores } = useStoreStore();
    const { calculatePolygonArea } = useAreaCalculator();

    const validateAndGetStoresInArea = useCallback((polygon: any[], category: string) => {
        const areaSize = calculatePolygonArea(polygon);

        const filteredStores = stores.filter(store => {
            if (category) {
                const storeCategoryName = store.categoryName || store.bizCategoryCode || '';
                if (!storeCategoryName.includes(category)) return false;
            }

            const lat = store.lat;
            const lng = store.lng;
            if (!lat || !lng) return false;

            return true;
        });

        const uniqueStores = filteredStores.reduce((acc, store) => {
            const key = `${store.lat?.toFixed(5)}_${store.lng?.toFixed(5)}`;
            if (!acc.find(s => `${s.lat?.toFixed(5)}_${s.lng?.toFixed(5)}` === key)) {
                acc.push(store);
            }
            return acc;
        }, [] as typeof stores);

        let isValid = true;
        let errorMessage = '';
        let shouldDelete = false;

        if (areaSize > AREA_LIMITS.MAX_AREA) {
            isValid = false;
            shouldDelete = true;
            errorMessage = `영역이 너무 큽니다. 최대 ${(AREA_LIMITS.MAX_AREA / 1000000).toFixed(1)}km² 이하여야 합니다.`;
        } else if (uniqueStores.length < AREA_LIMITS.MIN_STORES) {
            isValid = false;
            errorMessage = `분석에 필요한 상가가 부족합니다. 최소 ${AREA_LIMITS.MIN_STORES}개 이상의 상가가 필요합니다.`;
        } else if (uniqueStores.length > AREA_LIMITS.MAX_STORES) {
            isValid = false;
            errorMessage = `상가가 너무 많습니다. 최대 ${AREA_LIMITS.MAX_STORES}개 이하의 영역을 선택해주세요.`;
        }

        return {
            stores: uniqueStores.slice(0, AREA_LIMITS.MAX_STORES),
            area: areaSize,
            storeCount: uniqueStores.length,
            isValid,
            errorMessage,
            shouldDelete
        };
    }, [stores, calculatePolygonArea]);

    return { validateAndGetStoresInArea };
}
