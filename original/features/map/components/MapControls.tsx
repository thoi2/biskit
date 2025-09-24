// components/MapControls.tsx

import { Search } from 'lucide-react';

interface MapControlsProps {
    isSearching: boolean;
    currentLevel: number;
    isSearchAvailable: boolean;
    searchButtonInfo: {
        available: boolean;
        buttonText: string;
        message: string;
    };
    onSearchClick: () => void;
    maxSearchLevel: number;
}

export function MapControls({
                                isSearching,
                                currentLevel,
                                isSearchAvailable,
                                searchButtonInfo,
                                onSearchClick,
                                maxSearchLevel,
                            }: MapControlsProps) {
    return (
        <>
            {/* 검색 버튼 */}
            <div className="absolute top-4 right-4 z-20">
                {searchButtonInfo.available ? (
                    <button
                        onClick={onSearchClick}
                        disabled={isSearching}
                        className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors ${
                            isSearching
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                    >
                        <Search className="w-4 h-4" />
                        {isSearching ? '검색 중...' : searchButtonInfo.buttonText}
                    </button>
                ) : (
                    <div className="bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg min-w-64">
                        <div className="text-sm">
                            <div className="font-medium mb-1">🔍 {searchButtonInfo.buttonText}</div>
                            <div className="text-xs opacity-90">{searchButtonInfo.message}</div>
                            <div className="text-xs opacity-75 mt-1">💡 마우스 휠이나 더블클릭으로 확대하세요</div>
                        </div>
                    </div>
                )}
            </div>

            {/* 레벨 표시 */}
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow text-sm text-gray-700 z-20 border">
                <div className="flex items-center gap-2">
                    <span className="font-medium">레벨 {currentLevel}</span>
                    <span
                        className={`w-2 h-2 rounded-full ${
                            isSearchAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    ></span>
                    <span
                        className={`text-xs ${
                            isSearchAvailable ? 'text-green-600' : 'text-red-600'
                        }`}
                    >
            {isSearchAvailable ? '검색 가능' : '검색 불가'}
          </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {currentLevel === 1 && '약 20m 축척'}
                    {currentLevel === 2 && '약 30m 축척'}
                    {currentLevel > 2 && `레벨 ${maxSearchLevel} 이하로 확대 필요`}
                </div>
            </div>
        </>
    );
}
