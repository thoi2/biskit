// components/StoreListSection.tsx

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/lib/components/ui/badge';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Store } from '@/lib/types/store';
import { useMapStore } from '@/features/map/store/mapStore';
import { StoreItem } from './StoreItem';
import { EmptyState } from './EmptyState';

interface StoreListSectionProps {
    stores: Store[];
    selectedCategories: string[];
    onToggleHideStore: (id: number) => void;
    onDeleteStore: (id: number) => void;
}

export function StoreListSection({
                                     stores,
                                     selectedCategories,
                                     onToggleHideStore,
                                     onDeleteStore,
                                 }: StoreListSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        setHighlightedStore,
        setHighlightedRecommendation,
        highlightedStoreId,
        activeTab, // 🔥 추가
    } = useMapStore();

    // 필터링된 상가
    const filteredStores = stores.filter(store => {
        if (selectedCategories.length === 0) return false;
        const categoryName = store.categoryName || store.bizCategoryCode;
        return selectedCategories.some(category =>
            categoryName.includes(category)
        );
    });

    // 🔥 자동 스크롤 (activeTab 체크 추가)
    useEffect(() => {
        if (highlightedStoreId && scrollRef.current && activeTab === 'result') {
            const highlightedElement = scrollRef.current.querySelector(`[data-store-id="${highlightedStoreId}"]`);
            if (highlightedElement) {
                if (!isExpanded) {
                    setIsExpanded(true);
                }
                setTimeout(() => {
                    highlightedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, isExpanded ? 100 : 400); // 🔥 이미 펼쳐져 있으면 짧게, 아니면 길게
            }
        }
    }, [highlightedStoreId, activeTab, isExpanded]); // 🔥 activeTab 의존성 추가

    const handleStoreClick = (storeId: number) => {
        setHighlightedStore(storeId);
        setHighlightedRecommendation(null);
        setTimeout(() => setHighlightedStore(null), 3000);
    };

    const hasSearched = stores.length > 0;
    const hasSelectedFilters = selectedCategories.length > 0;

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-700">검색된 상가</span>
                    <Badge variant="outline" className="text-xs h-5">{filteredStores.length}개</Badge>
                    {filteredStores.filter(s => s.hidden).length > 0 && (
                        <Badge variant="outline" className="text-xs h-5 bg-gray-100">
                            숨김 {filteredStores.filter(s => s.hidden).length}개
                        </Badge>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 transition-transform duration-200" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600 transition-transform duration-200" />
                )}
            </div>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                {isExpanded && (
                    <div className="px-3 pb-3 border-t">
                        {filteredStores.length > 0 ? (
                            <div
                                ref={scrollRef}
                                className="space-y-2 mt-3 max-h-[350px] overflow-y-auto"
                            >
                                {filteredStores.map(store => (
                                    <StoreItem
                                        key={`store-${store.id}`}
                                        store={store}
                                        isHighlighted={highlightedStoreId === store.id}
                                        onToggleHide={onToggleHideStore}
                                        onDelete={onDeleteStore}
                                        onClick={handleStoreClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                type={
                                    !hasSearched ? 'no-search' :
                                        !hasSelectedFilters ? 'no-filters' : 'no-results'
                                }
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
