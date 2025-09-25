'use client';

import { SingleRecommendationPanel } from './SingleRecommendationPanel';
import { AreaRecommendationPanel } from './AreaRecommendationPanel';
import { Card, CardContent } from '@/lib/components/ui/card';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationForm } from '../hooks/useRecommendationForm';

export function RecommendationPanel() {
    const { activeTab } = useMapStore();
    const { error } = useRecommendationForm();

    return (
        <div className="space-y-4">
            {/* 업종 탭이 아닐 때 비활성화 안내 */}
            {activeTab !== 'recommend' && (
                <Card className="border-yellow-200">
                    <CardContent className="p-4 bg-yellow-50">
                        <p className="text-sm text-yellow-700 text-center">
                            ⚠️ 업종 탭에서만 AI 추천 분석을 실행할 수 있습니다
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* 단일 좌표 분석 */}
            <SingleRecommendationPanel />

            {/* 범위 추천 분석 */}
            <AreaRecommendationPanel />

            {/* 안내 및 에러 메시지 */}
            <Card className="border-orange-200">
                <CardContent className="p-4 bg-orange-50">
                    <p className="text-sm text-orange-700 text-center">
                        분석 결과는 <strong>결과 탭</strong>에서 확인하세요
                    </p>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-red-200">
                    <CardContent className="p-4 bg-red-50">
                        <p className="text-sm text-red-700 text-center">
                            오류: {error.message}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
