// Sidebar.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BusinessFilter } from '@/lib/components/ui/business-filter';
import { RecommendationPanel } from '@/lib/components/recommendation-panel';
import { ResultPanel } from '@/lib/components/result-panel';
import { GuestModeNotice } from '@/lib/components/ui/GuestModeNotice';
import { TabNavigation } from '@/lib/components/navigation/TabNavigation';

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  closureProbability: number;
  rating: number;
  openHours: string;
  coordinates: { lat: number; lng: number };
  isFavorite: boolean;
}

interface RecommendationResult {
  id: string;
  businessName: string;
  address: string;
  businessType: string;
  closureProbability: {
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
  };
  coordinates: { lat: number; lng: number };
  riskLevel: 'low' | 'medium' | 'high';
  isFavorite: boolean;
}

interface SidebarHandlers {
  handleFilterChange: (categories: string[]) => void;
  handleBusinessSelect: (business: Business) => void;
  handleToggleFavorite: (businessId: string) => void;
  handleToggleHideStore: (businessId: string) => void;
  handleAnalysisRequest: (
    analysisType: string,
    params: Record<string, any>,
  ) => void;
  handleToggleRecommendationFavorite: (id: string) => void;
  handleRestoreSearch: (
    searchType: string,
    params: Record<string, any>,
  ) => void;
}

interface SidebarProps {
  user: Record<string, any> | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeProfileTab: string;
  setActiveProfileTab: (tab: string) => void;
  selectedCategories: string[];
  filteredBusinesses: Business[];
  recommendationResults: RecommendationResult[];
  handlers: SidebarHandlers;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  user,
  activeTab,
  setActiveTab,
  selectedCategories,
  filteredBusinesses,
  recommendationResults,
  handlers,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
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
                {!user && <GuestModeNotice onLogin={() => {}} />}

                <TabNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  showProfileTab={false}
                />

                {activeTab === 'search' && (
                  <div className="space-y-6">
                    <BusinessFilter
                      onFilterChange={handlers.handleFilterChange}
                      selectedCategories={selectedCategories}
                      setActiveTab={setActiveTab} // ← BusinessFilter props 추가
                    />
                  </div>
                )}

                {activeTab === 'recommend' && (
                  <RecommendationPanel
                    onAnalysisRequest={handlers.handleAnalysisRequest}
                    setActiveTab={setActiveTab} // ← RecommendationPanel props 추가
                  />
                )}

                {activeTab === 'result' && (
                  <ResultPanel
                    user={user}
                    filteredBusinesses={filteredBusinesses}
                    recommendationResults={recommendationResults}
                    onToggleFavorite={handlers.handleToggleFavorite}
                    onToggleRecommendationFavorite={
                      handlers.handleToggleRecommendationFavorite
                    }
                    onToggleHideStore={handlers.handleToggleHideStore}
                    onRestoreSearch={handlers.handleRestoreSearch}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 토글 버튼 */}
      <div className="relative">
        <button
          onClick={onToggleCollapse}
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
