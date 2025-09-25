import { create } from 'zustand';
import { Store } from '@/features/stores/types/store';
import {useMapStore} from "@/features/map/store/mapStore";

// Store 상태
interface StoreState {
    stores: Store[];
    selectedStore: Store | null;
}

// Store 액션
interface StoreActions {
    setStores: (stores: Store[]) => void;
    selectStore: (store: Store | null) => void;
    addStore: (store: Store) => void;
    updateStore: (storeId: number, updates: Partial<Store>) => void;
    toggleStoreHide: (storeId: number) => void;
    deleteStore: (storeId: number) => void;
    clearStores: () => void;
}

// Store Store
export const useStoreStore = create<StoreState & StoreActions>((set, get) => ({
    // 초기 상태
    stores: [],
    selectedStore: null,

    // 액션들
    setStores: (stores) => set({ stores }),
    selectStore: (store) => set({ selectedStore: store }),

    addStore: (store) => set((state) => ({
        stores: [...state.stores, store]
    })),

    updateStore: (storeId, updates) => set((state) => ({
        stores: state.stores.map(store =>
            store.id === storeId
                ? { ...store, ...updates }
                : store
        )
    })),

    toggleStoreHide: (storeId) => set((state) => ({
        stores: state.stores.map(store =>
            store.id === storeId
                ? { ...store, hidden: !store.hidden }
                : store
        )
    })),

    deleteStore: (storeId) => set((state) => ({
        stores: state.stores.filter(store => store.id !== storeId),
        // 선택된 상가가 삭제되는 경우 선택 해제
        selectedStore: state.selectedStore?.id === storeId ? null : state.selectedStore,
    })),

    clearStores: () => set({
        stores: [],
        selectedStore: null,
    }),
}));

// 🔥 Store Selector 함수들
export const useStoreSelectors = () => {
    const { stores } = useStoreStore();
    const { selectedCategories } = useMapStore();

    // 🎯 중복 제거한 모든 상가 (좌표 기준)
    const uniqueStores = stores.reduce((acc, store) => {
        const lat = store.lat;
        const lng = store.lng;

        // 좌표가 없으면 제외
        if (!lat || !lng) return acc;

        // 좌표 기준 중복 체크 (소수점 5자리까지)
        const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
        if (!acc.find(s => `${s.lat?.toFixed(5)}_${s.lng?.toFixed(5)}` === key)) {
            acc.push(store);
        }
        return acc;
    }, [] as Store[]);

    return {
        // 필터링된 상가들 (숨김 제외)
        visibleStores: stores.filter(store => !store.hidden),

        // 선택된 카테고리로 필터링된 상가들
        filteredStores: stores.filter(storeItem => {
            if (selectedCategories.length === 0) return false;
            const categoryName = storeItem.categoryName || storeItem.bizCategoryCode;
            return selectedCategories.some(category =>
                categoryName.includes(category)
            );
        }),

        // 🎯 중복 제거된 모든 상가 (좌표 기준)
        uniqueStores: uniqueStores,

        // 🎯 중복 제거된 상가 좌표만 (API 전송용)
        uniqueStoreCoords: uniqueStores.map(store => ({
            id: store.id,
            name: store.displayName ||
                `${store.storeName} ${store.branchName || ''}`.trim() ||
                '상가명 미상',
            address: store.roadAddress || '주소 미상',
            lat: store.lat,
            lng: store.lng,
            categoryName: store.categoryName || store.bizCategoryCode || '업종 미상'
        })),

        // 통계 정보
        storeStats: {
            totalStores: stores.length,
            uniqueStores: uniqueStores.length,
            hiddenStores: stores.filter(s => s.hidden).length,
            visibleStores: stores.filter(s => !s.hidden).length,
        }
    };
};
