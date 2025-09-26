'use client';

const AREA_LIMITS = {
    MAX_AREA: 5000000,
    MAX_STORES: 200,
    MIN_STORES: 1,
};

export default function AreaLimitsInfo() {
    return (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-700">
                <div className="font-medium mb-1">📏 영역 제한 안내</div>
                <div className="space-y-1">
                    <div>• 최대 면적: {(AREA_LIMITS.MAX_AREA / 1000000).toFixed(1)}km²</div>
                    <div>• 분석 가능 상가: {AREA_LIMITS.MIN_STORES}~{AREA_LIMITS.MAX_STORES}개</div>
                </div>
            </div>
        </div>
    );
}
