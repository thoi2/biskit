// Sidebar.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BusinessFilter } from '@/components/business-filter';
import { BusinessList } from '@/components/business-list';
import { RecommendationPanel } from '@/components/recommendation-panel';
import { FavoritesList } from '@/components/favorites-list';
import { SearchHistory } from '@/components/search-history';
import { AiSurvey } from '@/components/ai-survey';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { ProfileTabNavigation } from '@/components/navigation/ProfileTabNavigation';

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
  isCollapsed: boolean; // 👈 props로 받음
  onToggleCollapse: () => void; // 👈 토글 함수도 props로 받음
}

export function Sidebar({
  user,
  activeTab,
  setActiveTab,
  activeProfileTab,
  setActiveProfileTab,
  selectedCategories,
  filteredBusinesses,
  recommendationResults,
  handlers,
  isCollapsed, // 👈 props로 받음
  onToggleCollapse, // 👈 props로 받음
}: SidebarProps) {
  return (
    <div className="relative flex">
      {/* 사이드바 메인 */}
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
                <TabNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  showProfileTab={!!user}
                />

                {activeTab === 'search' && (
                  <div className="space-y-6">
                    <BusinessFilter
                      onFilterChange={handlers.handleFilterChange}
                      selectedCategories={selectedCategories}
                    />
                    <BusinessList
                      businesses={filteredBusinesses}
                      onBusinessSelect={handlers.handleBusinessSelect}
                      onToggleFavorite={handlers.handleToggleFavorite}
                    />
                  </div>
                )}

                {activeTab === 'recommend' && (
                  <RecommendationPanel
                    onAnalysisRequest={handlers.handleAnalysisRequest}
                    results={recommendationResults}
                    onToggleFavorite={
                      handlers.handleToggleRecommendationFavorite
                    }
                  />
                )}

                {activeTab === 'profile' && user && (
                  <div className="space-y-6">
                    <ProfileTabNavigation
                      activeProfileTab={activeProfileTab}
                      onProfileTabChange={setActiveProfileTab}
                    />

                    {activeProfileTab === 'favorites' && <FavoritesList />}
                    {activeProfileTab === 'history' && (
                      <SearchHistory
                        onRestoreSearch={handlers.handleRestoreSearch}
                      />
                    )}
                    {activeProfileTab === 'survey' && <AiSurvey />}
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
          onClick={onToggleCollapse} // 👈 props 함수 사용
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
