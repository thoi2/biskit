'use client';

import { Button } from '@/lib/components/ui/button';
import { Search, BarChart3, FileText } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useState, useEffect } from 'react';

export function TabNavigation() {
    const { activeTab, setActiveTab } = useMapStore();
    const [mounted, setMounted] = useState(false);

    // 클라이언트에서만 렌더링되도록 보장
    useEffect(() => {
        setMounted(true);
    }, []);

    // 서버/클라이언트 모두 동일한 마크업 구조를 사용하여 하이드레이션 에러 방지
    return (
        <div className="flex gap-2 mb-8 p-1 bg-orange-100 rounded-xl">
            <Button
                variant={mounted && activeTab === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={mounted ? () => setActiveTab('search') : undefined}
                className={`flex-1 transition-all duration-300 ${
                    mounted && activeTab === 'search'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <Search className="w-4 h-4 mr-2" />
                검색
            </Button>

            <Button
                variant={mounted && activeTab === 'recommend' ? 'default' : 'ghost'}
                size="sm"
                onClick={mounted ? () => setActiveTab('recommend') : undefined}
                className={`flex-1 transition-all duration-300 ${
                    mounted && activeTab === 'recommend'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <BarChart3 className="w-4 h-4 mr-2" />
                추천
            </Button>

            <Button
                variant={mounted && activeTab === 'result' ? 'default' : 'ghost'}
                size="sm"
                onClick={mounted ? () => setActiveTab('result') : undefined}
                className={`flex-1 transition-all duration-300 ${
                    mounted && activeTab === 'result'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <FileText className="w-4 h-4 mr-2" />
                결과
            </Button>
        </div>
    );
}
