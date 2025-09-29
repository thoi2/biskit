// src/features/map/components/ClusterPopup.tsx
interface ClusterPopupProps {
    type: 'store' | 'ai';
    items: any[];
    onClose: () => void;
    onItemClick: (item: any) => void;
    onViewAllClick: () => void;
    getMarkerColorClass?: (probability: number) => string;
}

export function ClusterPopup({
                                 type,
                                 items,
                                 onClose,
                                 onItemClick,
                                 onViewAllClick,
                                 getMarkerColorClass
                             }: ClusterPopupProps) {

    // ✅ 기본 색상 함수 (없을 경우 대비)
    const defaultColorClass = (probability: number) => {
        if (probability >= 80) return 'bg-red-500';
        if (probability >= 60) return 'bg-orange-500';
        if (probability >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getColor = getMarkerColorClass || defaultColorClass;

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-80 max-w-96">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">
                        이 위치의 {type === 'store' ? '상가' : 'AI 추천'}들 ({items.length}개)
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="닫기"
                >
                    ✕
                </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onItemClick(item)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                    type === 'store' ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {type === 'store' ? '상가' : 'AI'}
                </span>
                                <span className="font-medium text-sm">
                  {type === 'store'
                      ? (item.displayName || item.storeName || '상가명 없음')
                      : `건물 ${item.building?.building_id || item.buildingId}`
                  }
                </span>
                            </div>

                            {/* ✅ AI 추천인 경우 생존율 표시 */}
                            {type === 'ai' && (
                                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                                    getColor(Math.round(item.categories?.[0]?.survivalRate?.[4] || item.survivalRate || 0))
                                }`}>
                  {Math.round(item.categories?.[0]?.survivalRate?.[4] || item.survivalRate || 0)}%
                </span>
                            )}
                        </div>

                        <p className="text-xs text-gray-600 mt-1">
                            {type === 'store'
                                ? (item.categoryName || item.bizCategoryCode || '업종 없음')
                                : (item.categories?.[0]?.category || item.category || '추천 업종')
                            }
                        </p>

                        {type === 'store' && item.roadAddress && (
                            <p className="text-xs text-gray-500 mt-1">{item.roadAddress}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-3 pt-3 border-t">
                <button
                    onClick={onViewAllClick}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                    전체 목록 결과 탭에서 보기
                </button>
            </div>
        </div>
    );
}
