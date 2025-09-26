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
                    <p>• 영역 면적: {(areaInfo.area / 10000).toFixed(2)}ha</p>
                    <p>• 분석 대상 상가: {areaInfo.storeCount}개</p>
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
                    ⚠️ 영역을 다시 선택해주세요. 위 조건을 확인하세요.
                </div>
            )}
        </>
    );
}
