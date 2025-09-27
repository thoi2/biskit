// BuildingRecommendationItem.tsx
import { useState, useEffect, useRef } from 'react';
import { Heart, Trash2, MapPin, Target, ChevronDown, ChevronUp, Eye, EyeOff, ArrowUp } from 'lucide-react';
import { GmsDetailModal } from './GmsDetailModal';
import { useMapStore } from '@/features/map/store/mapStore';

interface BuildingCategory {
    category: string;
    category_id?: number;
    survivalRate: number[];
    rank?: number;
    isRangeResult?: boolean;
    sessionId?: string;
}

interface BuildingRecommendationItemProps {
    building: {
        building_id: number;
        lat: number;
        lng: number;
    };
    categories: BuildingCategory[];
    source: 'single' | 'range' | 'db';
    isFavorite: boolean;
    isHighlighted: boolean;
    isVisible: boolean;
    user: any;
    onToggleFavorite: (buildingId: number, isFavorite: boolean) => void;
    onDelete: (buildingId: number) => void;
    onCategoryDelete?: (buildingId: number, categoryId: number) => void;
    onClick: (buildingId: number) => void;
    onToggleVisibility?: (buildingId: number, isVisible: boolean) => void;
    onMoveToTop?: (buildingId: number) => void;
}

export function BuildingRecommendationItem({
                                               building,
                                               categories,
                                               source,
                                               isFavorite,
                                               isHighlighted,
                                               isVisible,
                                               user,
                                               onToggleFavorite,
                                               onDelete,
                                               onCategoryDelete,
                                               onClick,
                                               onToggleVisibility,
                                               onMoveToTop
                                           }: BuildingRecommendationItemProps) {
    const [showAllCategories, setShowAllCategories] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);

    // ✅ 지도 이동 함수 가져오기
    const { moveToLocation } = useMapStore();

    // ✅ 모달 상태
    const [gmsModal, setGmsModal] = useState<{
        isOpen: boolean;
        category: string;
        rank?: number;
    }>({
        isOpen: false,
        category: '',
        rank: undefined
    });

    // ✅ 하이라이트 시 자동 스크롤 및 펼치기
    useEffect(() => {
        if (isHighlighted && itemRef.current) {
            console.log('🎯 하이라이트된 건물로 스크롤:', building.building_id);

            setShowAllCategories(true);

            setTimeout(() => {
                itemRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });

                setTimeout(() => {
                    if (itemRef.current) {
                        const rect = itemRef.current.getBoundingClientRect();
                        if (rect.top < 100) {
                            window.scrollBy(0, -50);
                        }
                    }
                }, 200);
            }, 100);
        }
    }, [isHighlighted, building.building_id]);

    if (!building?.building_id || !categories?.length) {
        return null;
    }

    // ✅ 소스별 뱃지 색상
    const getSourceBadge = () => {
        switch (source) {
            case 'single':
                return 'bg-blue-100 text-blue-600';
            case 'range':
                return 'bg-green-100 text-green-600';
            case 'db':
                return 'bg-purple-100 text-purple-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getSourceLabel = () => {
        switch (source) {
            case 'single':
                return '단일';
            case 'range':
                return '범위';
            case 'db':
                return 'DB';
            default:
                return '?';
        }
    };

    const getSurvivalColor = (rate: number) => {
        if (rate >= 70) return 'text-green-600 bg-green-50 border-green-200';
        if (rate >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-orange-600 bg-orange-50 border-orange-200';
    };

    const SurvivalRateDisplay = ({ rates, isCompact = false }: { rates: number[], isCompact?: boolean }) => {
        if (!Array.isArray(rates) || rates.length === 0) {
            return <span className="text-gray-400 text-xs">데이터 없음</span>;
        }

        return (
            <div className={`flex items-center gap-1 ${isCompact ? 'flex-wrap' : ''}`}>
                {rates.map((rate, index) => (
                    <div key={index} className={`flex flex-col items-center ${isCompact ? 'min-w-0' : ''}`}>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${getSurvivalColor(rate)} ${
                            isCompact ? 'text-xs px-1 py-0.5' : ''
                        }`}>
                            {rate.toFixed(1)}%
                        </span>
                        <span className={`text-xs text-gray-400 mt-0.5 ${isCompact ? 'text-xs' : ''}`}>
                            {index + 1}년
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const handleDetailView = (category: BuildingCategory, e: React.MouseEvent) => {
        e.stopPropagation();

        console.log('🔍 GMS 상세보기 모달 열기:', {
            buildingId: building.building_id,
            category: category.category,
            rank: category.rank
        });

        setGmsModal({
            isOpen: true,
            category: category.category,
            rank: category.rank
        });
    };

    const closeModal = () => {
        setGmsModal({
            isOpen: false,
            category: '',
            rank: undefined
        });
    };

    const handleMoveToTop = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onMoveToTop) {
            console.log('⬆️ 맨 위로 이동:', building.building_id);
            onMoveToTop(building.building_id);

            setTimeout(() => {
                itemRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    };

    // ✅ 건물 클릭 핸들러 (지도 이동 포함)
    const handleBuildingClick = () => {
        console.log('🏢 건물 클릭:', building.building_id);

        // 기존 클릭 로직
        onClick(building.building_id);

        // ✅ 지도 이동 추가
        moveToLocation(building.lat, building.lng, 4);
    };

    const topCategory = categories[0];
    const otherCategories = categories.slice(1);
    const hasMultipleCategories = categories.length > 1;

    return (
        <>
            <div
                ref={itemRef}
                className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-all duration-500 hover:shadow-sm relative ${
                    isHighlighted
                        ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md ring-2 ring-orange-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                } ${!isVisible ? 'opacity-60' : ''}`}
                onClick={handleBuildingClick} // ✅ 수정된 핸들러 사용
                data-building-id={building.building_id}
            >
                {/* 🎯 헤더 - 건물 정보 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${
                            isHighlighted
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse'
                                : 'bg-gradient-to-r from-orange-400 to-pink-400'
                        }`}>
                            #{building.building_id}
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-sm text-gray-800">
                                    건물 {building.building_id}
                                    {/* ✅ 소스 뱃지 */}
                                    <span className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full ${getSourceBadge()}`}>
                                        {getSourceLabel()}
                                    </span>
                                    {isHighlighted && (
                                        <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full animate-bounce">
                                            NEW
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({categories.length}개 업종)
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span>{Number(building.lat).toFixed(4)}, {Number(building.lng).toFixed(4)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 🎯 액션 버튼들 */}
                    <div className="flex items-center gap-0.5">
                        {/* ✅ 맨 위로 이동 버튼 */}
                        {isHighlighted && onMoveToTop && (
                            <button
                                onClick={handleMoveToTop}
                                className="p-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-sm"
                                title="결과 맨 위로 이동"
                            >
                                <ArrowUp className="w-3 h-3" />
                            </button>
                        )}

                        {onToggleVisibility && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleVisibility(building.building_id, !isVisible);
                                }}
                                className={`p-1 rounded-md transition-colors ${
                                    isVisible
                                        ? 'hover:bg-blue-50 text-gray-600'
                                        : 'hover:bg-gray-50 bg-gray-100 text-gray-400'
                                }`}
                                title={isVisible ? "지도에서 숨기기" : "지도에 표시하기"}
                            >
                                {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                        )}

                        {user && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(building.building_id, isFavorite);
                                }}
                                className={`p-1 rounded-md transition-colors ${
                                    isFavorite
                                        ? 'text-pink-500 hover:bg-pink-50'
                                        : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                                }`}
                                title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                            >
                                <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        )}

                        {user && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(building.building_id);
                                }}
                                className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                title="건물 삭제"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 🎯 최고 업종 (1등) */}
                <div className="space-y-2">
                    <div className={`p-3 rounded-md transition-all duration-300 ${
                        isHighlighted ? 'bg-orange-100' : 'bg-gray-50'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                    isHighlighted
                                        ? 'text-orange-500 bg-orange-200'
                                        : 'text-purple-500 bg-purple-100'
                                }`}>
                                    #{topCategory.rank || 1}
                                </span>
                                <span className="text-sm font-medium text-gray-800">{topCategory.category}</span>
                                {topCategory.isRangeResult && (
                                    <span className="text-xs px-1 py-0.5 bg-green-100 text-green-600 rounded">범위</span>
                                )}
                            </div>

                            {/* ✅ 상세보기 버튼 */}
                            <button
                                onClick={(e) => handleDetailView(topCategory, e)}
                                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                    isHighlighted
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                🔍 상세보기
                            </button>
                        </div>

                        <SurvivalRateDisplay rates={topCategory.survivalRate} />
                    </div>

                    {/* ✅ 더보기 버튼 */}
                    {hasMultipleCategories && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAllCategories(!showAllCategories);
                            }}
                            className={`w-full flex items-center justify-center gap-1 py-1 text-xs transition-colors ${
                                isHighlighted
                                    ? 'text-orange-600 hover:text-orange-800'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {showAllCategories ? (
                                <>
                                    <ChevronUp className="w-3 h-3" />
                                    접기
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3 h-3" />
                                    +{otherCategories.length}개 업종 더보기
                                </>
                            )}
                        </button>
                    )}

                    {/* ✅ 다른 업종들 */}
                    {showAllCategories && otherCategories.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-gray-100 animate-slideDown">
                            {otherCategories.map((category, index) => (
                                <div key={`${category.category}-${index}`} className="p-2 bg-white rounded border border-gray-100 hover:border-gray-200 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1 py-0.5 rounded-full">
                                                #{category.rank || (index + 2)}
                                            </span>
                                            <span className="text-xs text-gray-700 font-medium">{category.category}</span>
                                            {category.isRangeResult && (
                                                <span className="text-xs px-1 py-0.5 bg-green-100 text-green-600 rounded">범위</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {onCategoryDelete && category.category_id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCategoryDelete(building.building_id, category.category_id!);
                                                    }}
                                                    className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                                    title="이 업종만 삭제"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => handleDetailView(category, e)}
                                                className="px-2 py-0.5 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                            >
                                                상세보기
                                            </button>
                                        </div>
                                    </div>

                                    <SurvivalRateDisplay rates={category.survivalRate} isCompact={true} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ GMS 상세보기 모달 */}
            <GmsDetailModal
                isOpen={gmsModal.isOpen}
                onClose={closeModal}
                buildingId={building.building_id}
                category={gmsModal.category}
                rank={gmsModal.rank}
                lat={building.lat}
                lng={building.lng}
                survivalRate={categories.find(c => c.category === gmsModal.category)?.survivalRate}
            />
        </>
    );
}
