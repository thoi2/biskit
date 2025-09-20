import { KakaoMap } from '@/lib/components/kakao-map';
import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/lib/types/recommendation';

interface MapBounds {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
}

interface MapAreaProps {
    stores?: Store[];
    recommendations?: RecommendationResult[];
    onStoreClick?: (store: Store) => void;
    onRecommendationClick?: (recommendation: RecommendationResult) => void;
    onMapClick?: (lat: number, lng: number) => void;
    onSearchInArea?: (bounds: MapBounds) => void;
    isSearching?: boolean;
}

export function MapArea({
                            stores,
                            recommendations,
                            onStoreClick,
                            onRecommendationClick,
                            onMapClick,
                            onSearchInArea,
                            isSearching,
                        }: MapAreaProps) {
    return (
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
            <KakaoMap
                stores={stores}
                recommendations={recommendations}
                onStoreClick={onStoreClick}
                onRecommendationClick={onRecommendationClick}
                onMapClick={onMapClick}
                onSearchInArea={onSearchInArea}
                isSearching={isSearching}
                showSearchControls={true}
            />
        </div>
    );
}
