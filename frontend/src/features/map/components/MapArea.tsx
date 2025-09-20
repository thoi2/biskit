import { KakaoMap } from '@/features/map/components/kakao-map';

export function MapArea() {
  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
      {/* 🔥 필요한 Props만 전달 */}
      <KakaoMap />
    </div>
  );
}
