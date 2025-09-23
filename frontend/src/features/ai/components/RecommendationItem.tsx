// components/RecommendationItem.tsx

import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, Eye, EyeOff, Trash2 } from 'lucide-react';
import { RecommendationResult } from '@/features/ai/types';

interface RecommendationItemProps {
  recommendation: RecommendationResult;
  isHighlighted: boolean;
  user: Record<string, any> | null;
  onToggleFavorite: (id: string) => void;
  onToggleHide: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}

export function RecommendationItem({
  recommendation,
  isHighlighted,
  user,
  onToggleFavorite,
  onToggleHide,
  onDelete,
  onClick,
}: RecommendationItemProps) {
  const handleFavoriteClick = () => {
    if (!user) {
      alert('찜 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }
    onToggleFavorite(recommendation.id);
  };

  return (
    <div
      data-recommendation-id={recommendation.id}
      className={`p-2 border border-orange-200 rounded bg-orange-50 hover:bg-orange-100 transition-all cursor-pointer ${
        recommendation.hidden ? 'opacity-50 bg-gray-50' : ''
      } ${
        isHighlighted
          ? 'ring-2 ring-orange-500 bg-orange-200 transform scale-105'
          : ''
      }`}
      onClick={() => onClick(recommendation.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-white text-xs h-5 ${
              recommendation.hidden ? 'bg-gray-400' : 'bg-orange-500'
            }`}
          >
            추천 {recommendation.hidden ? '(숨김)' : ''}
          </Badge>
          <span
            className={`font-medium text-sm ${
              recommendation.hidden ? 'text-gray-500' : 'text-gray-900'
            }`}
          >
            {recommendation.businessName}
          </span>
        </div>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {/* 찜하기 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteClick}
            className={`h-6 w-6 p-0 ${
              recommendation.isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={user ? '찜하기/찜 해제' : '로그인 후 이용 가능'}
          >
            <Heart
              className={`w-3 h-3 ${
                recommendation.isFavorite ? 'fill-current' : ''
              }`}
            />
          </Button>

          {/* 눈 모양 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleHide(recommendation.id)}
            className={`h-6 w-6 p-0 transition-colors ${
              recommendation.hidden
                ? 'text-gray-400 hover:text-orange-500'
                : 'text-orange-500 hover:text-gray-400'
            }`}
            title={recommendation.hidden ? '지도에 표시' : '지도에서 숨기기'}
          >
            {recommendation.hidden ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </Button>

          {/* X 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                window.confirm('이 추천을 목록에서 완전히 삭제하시겠습니까?')
              ) {
                onDelete(recommendation.id);
              }
            }}
            className="text-red-500 hover:text-red-700 h-6 w-6 p-0 transition-colors"
            title="목록에서 완전 삭제"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <p
        className={`text-xs mt-1 ${
          recommendation.hidden ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        {recommendation.address}
      </p>
      <p
        className={`text-xs ${
          recommendation.hidden ? 'text-gray-400' : 'text-orange-600'
        }`}
      >
        폐업률: {recommendation.closureProbability.year1}%
      </p>
    </div>
  );
}
