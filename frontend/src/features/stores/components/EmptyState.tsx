// components/EmptyState.tsx

import { MapPin, Filter, FileText } from 'lucide-react';

interface EmptyStateProps {
    type: 'no-search' | 'no-filters' | 'no-results';
}

export function EmptyState({ type }: EmptyStateProps) {
    if (type === 'no-search') {
        return (
            <div className="text-center py-4">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 text-sm">상가 데이터를 로딩해주세요</p>
                <p className="text-xs text-gray-400">
                    지도에서 &#34;상가 데이터 로딩&#34; 버튼을 눌러주세요
                </p>
            </div>
        );
    }

    if (type === 'no-filters') {
        return (
            <div className="text-center py-4">
                <Filter className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 text-sm">업종 필터를 선택해주세요</p>
                <p className="text-xs text-gray-400">
                    원하는 업종을 선택하면 지도에 표시됩니다
                </p>
            </div>
        );
    }

    return (
        <div className="text-center py-4">
            <FileText className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm">선택한 업종의 상가가 없습니다</p>
            <p className="text-xs text-gray-400">
                다른 업종을 선택해보세요
            </p>
        </div>
    );
}
