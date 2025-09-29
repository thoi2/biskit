// src/features/ai/components/FavoritesSection.tsx
import { useState, useMemo } from 'react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/lib/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRecommendationStore } from '@/features/ai/store';
import { useRecommendMutations } from '@/features/ai/hooks/useRecommendMutation';
import { BuildingRecommendationItem } from './BuildingRecommendationItem'; // ✅ Import

export function FavoritesSection() {
    const { user } = useAuth();
    const { buildings, updateBuildingFavorite, deleteBuilding, toggleBuildingVisibility } = useRecommendationStore();
    const { deleteLikeMutation, deleteResultMutation } = useRecommendMutations();

    const [isExpanded, setIsExpanded] = useState(true);

    // ✅ 실제 좋아요된 건물들 필터링
    const favoriteBuildings = useMemo(() => {
        return buildings.filter(building => building.isFavorite);
    }, [buildings]);

    // ✅ 좋아요 토글 핸들러
    const handleToggleFavorite = async (buildingId: number, currentIsFavorite: boolean) => {
        const newIsFavorite = !currentIsFavorite;

        // ✅ 즉시 UI 업데이트
        updateBuildingFavorite(buildingId, newIsFavorite);

        try {
            if (newIsFavorite) {
                // 좋아요 추가 - 필요시 API 호출
            } else {
                // 좋아요 해제
                await deleteLikeMutation.mutateAsync(buildingId.toString());
            }
        } catch (error) {
            console.error('좋아요 토글 실패:', error);
            // ✅ 실패 시 원래 상태로 되돌리기
            updateBuildingFavorite(buildingId, currentIsFavorite);
        }
    };

    // ✅ 건물 삭제 핸들러
    const handleDelete = async (buildingId: number) => {
        try {
            await deleteResultMutation.mutateAsync(buildingId.toString());
            deleteBuilding(buildingId);
        } catch (error) {
            console.error('건물 삭제 실패:', error);
        }
    };

    // ✅ 건물 클릭 핸들러 (선택적)
    const handleBuildingClick = (buildingId: number) => {
        console.log('🔍 [찜목록] 건물 클릭:', buildingId);
        // 필요시 지도로 이동하거나 다른 액션 수행
    };

    // ✅ 가시성 토글 핸들러
    const handleToggleVisibility = (buildingId: number, isVisible: boolean) => {
        toggleBuildingVisibility(buildingId);
    };

    if (!user) return null;

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-sm text-red-600">내 찜 목록</span>
                    <Badge variant="outline" className="text-xs h-5 border-red-200 text-red-600">
                        {favoriteBuildings.length}개
                    </Badge>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-red-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-red-500" />
                )}
            </div>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                {isExpanded && (
                    <div className="border-t border-red-100">
                        {favoriteBuildings.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <Heart className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-500 text-sm font-medium mb-1">찜한 추천이 없습니다</p>
                                <p className="text-xs text-gray-400">
                                    AI 추천 결과에 하트를 눌러 저장해보세요
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                                {favoriteBuildings.map(building => (
                                    <div key={building.building.building_id} className="relative">
                                        {/* ✅ 찜 표시 오버레이 */}
                                        <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-full shadow-lg">
                                            찜 ♥
                                        </div>

                                        {/* ✅ BuildingRecommendationItem 재사용 */}
                                        <BuildingRecommendationItem
                                            building={building.building}
                                            categories={building.categories}
                                            source={building.source}
                                            isFavorite={building.isFavorite || false}
                                            isHighlighted={false} // 찜 목록에서는 하이라이트 안함
                                            isVisible={building.isVisible !== false}
                                            user={user}
                                            onToggleFavorite={handleToggleFavorite}
                                            onDelete={handleDelete}
                                            onClick={handleBuildingClick}
                                            onToggleVisibility={handleToggleVisibility}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
