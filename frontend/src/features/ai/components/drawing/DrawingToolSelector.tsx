'use client';

import { Button } from '@/lib/components/ui/button';
import { Label } from '@/lib/components/ui/label';
import { Square, Circle, Hexagon } from 'lucide-react';

interface Props {
    drawingType: 'rectangle' | 'circle' | 'polygon';
    setDrawingType: (type: 'rectangle' | 'circle' | 'polygon') => void;
    canUseAreaRecommendation: boolean;
}

export default function DrawingToolSelector({
                                                drawingType,
                                                setDrawingType,
                                                canUseAreaRecommendation
                                            }: Props) {
    return (
        <div className="space-y-2">
            <Label className="text-xs mb-2 block">영역 그리기 도구</Label>
            <div className="grid grid-cols-3 gap-2">
                <Button
                    onClick={() => setDrawingType('rectangle')}
                    disabled={!canUseAreaRecommendation}
                    className={`h-12 transition-all duration-200 ${
                        drawingType === 'rectangle'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    variant={drawingType === 'rectangle' ? 'default' : 'outline'}
                >
                    <div className="flex flex-col items-center gap-1">
                        <Square className="w-4 h-4" />
                        <span className="text-xs font-medium">사각형</span>
                    </div>
                </Button>
                <Button
                    onClick={() => setDrawingType('circle')}
                    disabled={!canUseAreaRecommendation}
                    className={`h-12 transition-all duration-200 ${
                        drawingType === 'circle'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    variant={drawingType === 'circle' ? 'default' : 'outline'}
                >
                    <div className="flex flex-col items-center gap-1">
                        <Circle className="w-4 h-4" />
                        <span className="text-xs font-medium">원형</span>
                    </div>
                </Button>
                <Button
                    onClick={() => setDrawingType('polygon')}
                    disabled={!canUseAreaRecommendation}
                    className={`h-12 transition-all duration-200 ${
                        drawingType === 'polygon'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    variant={drawingType === 'polygon' ? 'default' : 'outline'}
                >
                    <div className="flex flex-col items-center gap-1">
                        <Hexagon className="w-4 h-4" />
                        <span className="text-xs font-medium">다각형</span>
                    </div>
                </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
                {drawingType === 'rectangle' ? '📐 사각형으로 영역을 선택합니다' :
                    drawingType === 'circle' ? '⭕ 원형으로 영역을 선택합니다' :
                        '🔷 다각형으로 복잡한 영역을 선택합니다'}
            </p>
        </div>
    );
}
