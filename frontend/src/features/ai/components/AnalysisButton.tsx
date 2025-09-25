'use client';

import { Button } from '@/lib/components/ui/button';
import { Zap } from 'lucide-react';

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
    areaCategory: string;
    areaInfo: AreaInfo | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
}

export default function AnalysisButton({
                                           drawnArea,
                                           areaCategory,
                                           areaInfo,
                                           isAnalyzing,
                                           onAnalyze
                                       }: Props) {
    if (!drawnArea || !areaCategory || !areaInfo?.isValid) return null;

    return (
        <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || !areaCategory || !areaInfo.isValid}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            size="lg"
        >
            <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                {isAnalyzing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        범위 분석 중...
                    </>
                ) : (
                    '범위 분석 실행'
                )}
            </div>
        </Button>
    );
}
