'use client';

import { Button } from '@/lib/components/ui/button';
import { Search, BarChart3, FileText } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useState, useEffect } from 'react';

export function TabNavigation() {
    const { activeTab, setActiveTab } = useMapStore();
    const [mounted, setMounted] = useState(false);

    // ✅ 클라이언트에서만 렌더링되도록 보장
    useEffect(() => {
        setMounted(true);
    }, []);

    // ✅ 서버 렌더링 중에는 기본 상태로 표시 (동적 스타일 없음)
    if (!mounted) {
        return (
            <div className="flex gap-2 mb-8 p-1 bg-orange-100 rounded-xl">
                <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-amber-600 hover:bg-orange-700 text-white shadow-sm"
                >
                    <Search className="w-4 h-4 mr-2" />
                    검색
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 hover:bg-orange-200 text-orange-700"
                >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    추천
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 hover:bg-orange-200 text-orange-700"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    결과
                </Button>
            </div>
        );
    }

    // ✅ 클라이언트에서는 정상적으로 동적 스타일 적용
    return (
        <div className="flex gap-2 mb-8 p-1 bg-orange-100 rounded-xl">
            <Button
                variant={activeTab === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('search')}
                className={`flex-1 transition-all duration-300 ${
                    activeTab === 'search'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <Search className="w-4 h-4 mr-2" />
                검색
            </Button>

            <Button
                variant={activeTab === 'recommend' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('recommend')}
                className={`flex-1 transition-all duration-300 ${
                    activeTab === 'recommend'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <BarChart3 className="w-4 h-4 mr-2" />
                추천
            </Button>

            <Button
                variant={activeTab === 'result' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('result')}
                className={`flex-1 transition-all duration-300 ${
                    activeTab === 'result'
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
