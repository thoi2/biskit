// MapArea.tsx 수정

import { KakaoMap } from '@/features/map/components/kakao-map';

export function MapArea() {
    return (
        <div className="w-full h-full min-w-0 min-h-0 overflow-hidden relative">
            <KakaoMap />
        </div>
    );
}
