// components/MarkerPopup.tsx

import { MapMarkerItem } from '../../types';

interface MarkerPopupProps {
    item: MapMarkerItem;
    onClose: () => void;
    getMarkerColorClass: (probability: number) => string;
}

export function MarkerPopup({ item, onClose, getMarkerColorClass }: MarkerPopupProps) {
    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-64">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    ✕
                </button>
            </div>
            <div className="space-y-2">
                <p className="text-sm text-gray-600">{item.address}</p>
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
              폐업률 {item.closureProbability}%
            </span>
                    )}
                </div>
            </div>
        </div>
    );
}
