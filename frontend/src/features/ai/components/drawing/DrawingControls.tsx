'use client';

import { Button } from '@/lib/components/ui/button';
import { Square, Circle, Hexagon, AlertTriangle, X } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';

interface Props {
    canUseAreaRecommendation: boolean;
    isDrawingMode: boolean;
    drawingType: 'rectangle' | 'circle' | 'polygon';
    areaCategory: string;
}

export default function DrawingControls({
                                            canUseAreaRecommendation,
                                            isDrawingMode,
                                            drawingType,
                                            areaCategory
                                        }: Props) {
    const { setIsDrawingMode } = useMapStore();

    return (
        <>
            {/* 드로잉 버튼 */}
            <Button
                onClick={() => setIsDrawingMode(true)}
                disabled={!canUseAreaRecommendation || isDrawingMode || !areaCategory}
                className={`w-full transition-all duration-200 ${
                    isDrawingMode
                        ? 'bg-yellow-500 text-white'
                        : !areaCategory
                            ? 'bg-gray-400 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                size="lg"
            >
                <div className="flex items-center justify-center gap-2">
                    {isDrawingMode ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>영역을 {drawingType === 'polygon' ? '클릭하여' : '드래그하여'} 선택하세요</span>
                        </>
                    ) : !areaCategory ? (
                        <>
                            <AlertTriangle className="w-4 h-4" />
                            <span>업종을 먼저 선택해주세요</span>
                        </>
                    ) : (
                        <>
                            {drawingType === 'rectangle' ? <Square className="w-4 h-4" /> :
                                drawingType === 'circle' ? <Circle className="w-4 h-4" /> :
                                    <Hexagon className="w-4 h-4" />}
                            <span>{drawingType === 'rectangle' ? '사각형' :
                                drawingType === 'circle' ? '원형' : '다각형'} 영역 그리기</span>
                        </>
                    )}
                </div>
            </Button>

            {/* 드로잉 모드 상태 표시 */}
            {isDrawingMode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">
                                {drawingType === 'rectangle' ? '📐 사각형 그리기 모드' :
                                    drawingType === 'circle' ? '⭕ 원형 그리기 모드' :
                                        '🔷 다각형 그리기 모드'}
                            </span>
                        </div>
                        <Button
                            onClick={() => setIsDrawingMode(false)}
                            size="sm"
                            variant="outline"
                            className="text-xs h-6"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                        {drawingType === 'polygon'
                            ? '지도에서 클릭하여 꼭지점을 만들고, 더블클릭으로 완료하세요'
                            : `지도에서 클릭 후 드래그하여 ${drawingType === 'rectangle' ? '사각형' : '원형'} 영역을 선택하세요`}
                    </p>
                </div>
            )}
        </>
    );
}
