// MapArea.tsx 수정

import { KakaoMap } from '@/features/map/components/kakao-map';

export function MapArea() {
    return (
        <div className="relative w-full h-full min-w-0 min-h-0 overflow-hidden">
            <div className="absolute inset-0">   {/* ← 부모를 꽉 채움 */}
                <KakaoMap />
            </div>
        </div>
    );
}
