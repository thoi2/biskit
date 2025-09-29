import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StoreFilter } from '@/features/stores/components/store-filter';
import { ResultPanel } from '@/lib/components/result-panel';
import { GuestModeNotice } from '@/lib/components/ui/GuestModeNotice';
import { TabNavigation } from '@/lib/components/navigation/TabNavigation';
import { RecommendationPanel } from '@/features/ai/components/recommendation-panel';
import { useMapStore } from '@/features/map/store/mapStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useState } from 'react';

export function Sidebar() {
    const { activeTab } = useMapStore();
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    const handleCollapse = () => {
        setIsCollapsed(prev => !prev);
        // 사이드바 토글 후 지도 리사이즈 트리거
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });
    };

    return (
        <div className="relative flex min-h-0">
            <div
                className={`
          ${isCollapsed ? 'w-0' : 'w-[576px]'}
          flex-shrink-0 bg-white/90 backdrop-blur-sm border-r border-orange-200
          overflow-hidden transition-all duration-300 ease-in-out
        `}
            >
                {!isCollapsed && (
                    <div className="h-full flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto sidebar-scrollbar pr-2 min-h-0">
                            <div className="p-6 space-y-6">
                                {!user && <GuestModeNotice />}
                                <TabNavigation />
                                {activeTab === 'search' && <StoreFilter />}
                                {activeTab === 'recommend' && <RecommendationPanel />}
                                {activeTab === 'result' && <ResultPanel />}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 토글 버튼 - 완전 복원! */}
            <div className="relative">
                <button
                    onClick={handleCollapse}
                    className="
            absolute top-1/2 left-1 transform -translate-y-1/2 z-20
            w-8 h-8 bg-amber-700 hover:bg-amber-800
            text-white rounded-full shadow-lg
            flex items-center justify-center
            transition-all duration-200
            border-2 border-amber-600
          "
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
}
