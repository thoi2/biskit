import { BusinessFilter } from "@/components/business-filter"
import { BusinessList } from "@/components/business-list"
import { RecommendationPanel } from "@/components/recommendation-panel"
import { FavoritesList } from "@/components/favorites-list"
import { SearchHistory } from "@/components/search-history"
import { AiSurvey } from "@/components/ai-survey"
import { GuestModeNotice } from "@/components/ui/GuestModeNotice"
import { TabNavigation } from "@/components/navigation/TabNavigation"
import { ProfileTabNavigation } from "@/components/navigation/ProfileTabNavigation"

interface Business {
  id: string
  name: string
  category: string
  address: string
  closureProbability: number
  rating: number
  openHours: string
  coordinates: { lat: number; lng: number }
  isFavorite: boolean
}

interface RecommendationResult {
  id: string
  businessName: string
  address: string
  businessType: string
  closureProbability: {
    year1: number
    year2: number
    year3: number
    year4: number
    year5: number
  }
  coordinates: { lat: number; lng: number }
  riskLevel: "low" | "medium" | "high"
  isFavorite: boolean
}

interface SidebarHandlers {
  handleFilterChange: (categories: string[]) => void
  handleBusinessSelect: (business: Business) => void
  handleToggleFavorite: (businessId: string) => void
  handleAnalysisRequest: (analysisType: string, params: Record<string, any>) => void
  handleToggleRecommendationFavorite: (id: string) => void
  handleRestoreSearch: (searchType: string, params: Record<string, any>) => void
}

interface SidebarProps {
  user: Record<string, any> | null
  activeTab: string
  setActiveTab: (tab: string) => void          // 🔥 onTabChange → setActiveTab
  activeProfileTab: string
  setActiveProfileTab: (tab: string) => void   // 🔥 onProfileTabChange → setActiveProfileTab
  selectedCategories: string[]
  filteredBusinesses: Business[]
  recommendationResults: RecommendationResult[]
  handlers: SidebarHandlers                    // 🔥 handlers 객체로 받기
}

export function Sidebar({
                          user,
                          activeTab,
                          setActiveTab,                    // 🔥 변경
                          activeProfileTab,
                          setActiveProfileTab,             // 🔥 변경
                          selectedCategories,
                          filteredBusinesses,
                          recommendationResults,
                          handlers                         // 🔥 handlers 객체로 받기
                        }: SidebarProps) {
  return (
      <div className="w-96 bg-white/90 backdrop-blur-sm border-r border-orange-200 p-6 overflow-y-auto">
        {!user && <GuestModeNotice onLogin={() => {}} />}

        <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}        // 🔥 변경
            showProfileTab={!!user}
        />

        {activeTab === "search" && (
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

        {activeTab === "recommend" && (
            <RecommendationPanel
                onAnalysisRequest={handlers.handleAnalysisRequest}
                results={recommendationResults}
                onToggleFavorite={handlers.handleToggleRecommendationFavorite}
            />
        )}

        {activeTab === "profile" && user && (
            <div className="space-y-6">
              <ProfileTabNavigation
                  activeProfileTab={activeProfileTab}
                  onProfileTabChange={setActiveProfileTab}  // 🔥 변경
              />

              {activeProfileTab === "favorites" && <FavoritesList />}
              {activeProfileTab === "history" && <SearchHistory onRestoreSearch={handlers.handleRestoreSearch} />}
              {activeProfileTab === "survey" && <AiSurvey />}
            </div>
        )}
      </div>
  )
}
