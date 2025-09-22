import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StoreFilter } from '@/lib/components/store-filter';
import { RecommendationPanel } from '@/features/ai/components/recommendation-panel';
import { ResultPanel } from '@/lib/components/result-panel';
import { GuestModeNotice } from '@/lib/components/ui/GuestModeNotice';
import { TabNavigation } from '@/lib/components/navigation/TabNavigation';
import { Store } from '@/lib/types/store';
import { RecommendationResult } from '@/features/ai/types/recommendation';
import { useMapStore } from '@/features/map/store/mapStore'; // 스토어 import
import { useState } from 'react';

interface SidebarHandlers {
  handleFilterChange: (categories: string[]) => void;
  handleStoreSelect: (store: Store) => void;
  handleToggleHideStore: (storeId: number) => void;
  handleAnalysisRequest: (
    analysisType: string,
    params: Record<string, any>,
  ) => void;
  handleToggleRecommendationFavorite: (id: string) => void;
  handleToggleHideRecommendation: (id: string) => void;
  handleDeleteRecommendation: (id: string) => void;
  handleDeleteStore: (storeId: number) => void;
}

interface SidebarProps {
  user: Record<string, any> | null;
  selectedCategories: string[];
  stores: Store[];
  recommendationResults: RecommendationResult[];
  handlers: SidebarHandlers;
}

export function Sidebar({
  user,
  selectedCategories,
  stores,
  recommendationResults,
  handlers,
}: SidebarProps) {
  const { activeTab, setActiveTab } = useMapStore();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="relative flex">
      <div
        className={`
          ${isCollapsed ? 'w-0' : 'w-[576px]'} 
          flex-shrink-0 bg-white/90 backdrop-blur-sm border-r border-orange-200 
          overflow-hidden transition-all duration-300 ease-in-out
        `}
      >
        {!isCollapsed && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto sidebar-scrollbar pr-2">
              <div className="p-6">
                {!user && <GuestModeNotice />}

                <TabNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  showProfileTab={false}
                />

                {activeTab === 'search' && (
                  <div className="space-y-6">
                    <StoreFilter
                      onFilterChange={handlers.handleFilterChange}
                      selectedCategories={selectedCategories}
                      stores={stores}
                    />
                  </div>
                )}

                {activeTab === 'recommend' && (
                  <RecommendationPanel
                    onAnalysisRequest={handlers.handleAnalysisRequest}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'result' && (
                  <div className="space-y-6">

                    <ResultPanel
                        user={user}
                        stores={stores}
                        recommendationResults={recommendationResults}
                        onToggleHideStore={handlers.handleToggleHideStore}
                        onDeleteStore={handlers.handleDeleteStore} // ← 이제 작동해야 합니다
                        onToggleRecommendationFavorite={handlers.handleToggleRecommendationFavorite}
                        onToggleHideRecommendation={handlers.handleToggleHideRecommendation}
                        onDeleteRecommendation={handlers.handleDeleteRecommendation}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 토글 버튼 */}
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
