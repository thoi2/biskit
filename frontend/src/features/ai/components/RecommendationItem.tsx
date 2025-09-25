// features/ai/components/RecommendationItem.tsx

import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, Trash2 } from 'lucide-react';
import { SingleBuildingRecommendationResponse } from '@/features/ai/types';

// ✅ 1. Props 타입 최신화
interface RecommendationItemProps {
  recommendation: SingleBuildingRecommendationResponse;
  isHighlighted: boolean;
  user: Record<string, any> | null;
  onToggleFavorite: (buildingId: number, isFavorite: boolean) => void;
  onDelete: (buildingId: number) => void;
  onClick: (buildingId: number) => void;
}

export function RecommendationItem({
  recommendation,
  isHighlighted,
  user,
  onToggleFavorite,
  onDelete,
  onClick,
}: RecommendationItemProps) {
  // ✅ 2. 새로운 데이터 구조에 맞게 비구조화 할당
  const { building, result } = recommendation;

  // AI 추천 결과는 여러 업종일 수 있으므로, 가장 확률 높은 첫 번째 결과를 대표로 사용
  const primaryResult = result?.[0];

  // ✅ 3. isFavorite 상태는 API 응답에 없으므로, 우선 false로 가정합니다.
  // (실제로는 찜 목록(useRecommendQuery) 데이터와 비교하여 이 값을 결정해야 합니다)
  const isFavorite = false;

  // ✅ 4. 생존율을 폐업률로 변환
  const closureRate = primaryResult
    ? (100 - primaryResult.survivalRate).toFixed(1)
    : 'N/A';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    if (!user) {
      alert('찜 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }
    onToggleFavorite(building.building_id, isFavorite);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(building.building_id);
  };

  return (
    <div
      // ✅ 5. 데이터 속성 및 키를 building_id로 변경
      data-building-id={building.building_id}
      className={`p-3 border rounded-lg bg-white hover:bg-orange-50 transition-all cursor-pointer ${
        isHighlighted
          ? 'ring-2 ring-orange-500 transform scale-[1.02]'
          : 'border-gray-200'
      }`}
      onClick={() => onClick(building.building_id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Badge className="text-white bg-orange-500 w-fit">AI 추천</Badge>
          <span className="font-semibold text-base text-gray-800">
            {/* ✅ 6. 대표 추천 업종 이름 표시 */}
            {primaryResult?.category || '추천 업종 없음'}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteClick}
            className={`h-8 w-8 p-0 ${
              isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={user ? '찜하기/찜 해제' : '로그인 후 이용 가능'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
            title="목록에서 완전 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {/* ✅ 7. 주소 정보가 없으므로 좌표로 대체 (API 수정 필요) */}
        위치: {building.lat.toFixed(4)}, {building.lng.toFixed(4)}
      </div>
      <div className="mt-1 text-sm font-medium text-orange-600">
        1년 내 폐업률: {closureRate}%
      </div>
    </div>
  );
}
