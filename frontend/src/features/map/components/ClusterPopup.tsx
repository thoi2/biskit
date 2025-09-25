// components/ClusterPopup.tsx

import { MapMarkerItem } from '../types';

interface ClusterPopupProps {
    items: MapMarkerItem[];
    onClose: () => void;
    onItemClick: (item: MapMarkerItem) => void;
    onViewAllClick: () => void;
    getMarkerColorClass: (probability: number) => string;
}

export function ClusterPopup({
                                 items,
                                 onClose,
                                 onItemClick,
                                 onViewAllClick,
                                 getMarkerColorClass,
                             }: ClusterPopupProps) {
    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-80 max-w-96">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">이 위치의 매장들 ({items.length}개)</h3>
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
                                {item.type === 'store' ? (
                                    <span className="px-2 py-1 rounded text-xs font-medium text-white bg-blue-500">
                    상가
                  </span>
                                ) : (
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium text-white ${getMarkerColorClass(
                                            item.closureProbability || 0,
                                        )}`}
                                    >
                    {item.closureProbability}%
                  </span>
                                )}
                                <span className="font-medium text-sm">{item.name}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{item.category}</p>
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
