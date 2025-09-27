// src/features/ai/components/drawing/AreaInfoDisplay.tsx
'use client';

import { Button } from '@/lib/components/ui/button';
import { Square, Circle, Hexagon, X } from 'lucide-react';

interface PolygonPoint {
    lat: number;
    lng: number;
}

interface AreaInfo {
    area: number;
    storeCount: number;
    isValid: boolean;
    errorMessage?: string;
}

interface Props {
    drawnArea: PolygonPoint[] | null;
    areaInfo: AreaInfo | null;
    drawingType: 'rectangle' | 'circle' | 'polygon';
    onClear: () => void;
}

export default function AreaInfoDisplay({
                                            drawnArea,
                                            areaInfo,
                                            drawingType,
                                            onClear
                                        }: Props) {
    if (!drawnArea || !areaInfo) return null;

    // ✅ 면적 단위 개선
    const formatArea = (areaSquareMeters: number) => {
        if (areaSquareMeters === 0) return '0㎡';

        if (areaSquareMeters < 1000) {
            return `${areaSquareMeters.toFixed(1)}㎡`;
        } else if (areaSquareMeters < 10000) {
            return `${areaSquareMeters.toFixed(0)}㎡`;
        } else {
            const hectares = areaSquareMeters / 10000;
            return `${hectares.toFixed(2)}ha`;
        }
    };

    return (
        <>
            {/* 선택된 영역 정보 */}
            <div className={`p-3 border rounded-lg ${
                areaInfo.isValid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
            }`}>
                <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 ${
                        areaInfo.isValid ? 'text-green-700' : 'text-red-700'
                    }`}>
                        {drawingType === 'rectangle' ? <Square className="w-4 h-4" /> :
                            drawingType === 'circle' ? <Circle className="w-4 h-4" /> :
                                <Hexagon className="w-4 h-4" />}
                        <span className="text-sm font-medium">
                            {areaInfo.isValid ? '영역이 선택되었습니다' : '영역 선택 오류'}
                        </span>
                    </div>
                    <Button
                        onClick={onClear}
                        size="sm"
                        variant="outline"
                        className="text-xs h-6"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
                <div className={`text-xs ${
                    areaInfo.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                    {/* ✅ 면적 표시 개선 */}
                    <p>• 영역 면적: <strong>{formatArea(areaInfo.area)}</strong></p>
                    {/* ✅ 상가 표시 수정 */}
                    <p>• 영역 내 전체 상가: <strong>{areaInfo.storeCount}개</strong></p>
                    <p>• 영역 타입: {drawingType === 'rectangle' ? '사각형' :
                        drawingType === 'circle' ? '원형' : '다각형'}</p>
                    {!areaInfo.isValid && areaInfo.errorMessage && (
                        <p className="mt-2 font-medium">⚠️ {areaInfo.errorMessage}</p>
                    )}
                </div>
            </div>

            {/* 영역이 유효하지 않을 때 안내 */}
            {!areaInfo.isValid && (
                <div className="p-2 bg-red-50 rounded-lg text-xs text-red-600 border border-red-200">
                    ⚠️ 영역을 다시 선택해주세요. 더 많은 상가가 포함되도록 영역을 조정하거나 확대해보세요.
                </div>
            )}
        </>
    );
}
