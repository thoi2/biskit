import { Brain } from 'lucide-react';

export function RecommendationEmptyState() {
    return (
        <div className="text-center py-6">
            <Brain className="w-8 h-8 mx-auto mb-3 text-orange-400" />
            <p className="text-gray-500 text-sm font-medium mb-2">AI 추천 결과가 없습니다</p>
            <p className="text-xs text-gray-400">
                현재 위치에서 추천할 상가가 없습니다
            </p>
        </div>
    );
}
