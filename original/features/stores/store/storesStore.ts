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

        // 통계 정보
        storeStats: {
            totalStores: stores.length,
            hiddenStores: stores.filter(s => s.hidden).length,
            visibleStores: stores.filter(s => !s.hidden).length,
        }
    };
};
