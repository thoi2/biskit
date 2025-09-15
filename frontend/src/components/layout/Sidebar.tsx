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

interface SidebarProps {
  user: any
  activeTab: string
  onTabChange: (tab: string) => void
  activeProfileTab: string
  onProfileTabChange: (tab: string) => void
  selectedCategories: string[]
  onFilterChange: (categories: string[]) => void
  filteredBusinesses: Business[]
  onBusinessSelect: (business: Business) => void
  onToggleFavorite: (businessId: string) => void
  recommendationResults: RecommendationResult[]
  onAnalysisRequest: (analysisType: string, params: any) => void
  onToggleRecommendationFavorite: (id: string) => void
  onRestoreSearch: (searchType: string, params: any) => void
  onLogin: () => void
}

export function Sidebar({
  user,
  activeTab,
  onTabChange,
  activeProfileTab,
  onProfileTabChange,
  selectedCategories,
  onFilterChange,
  filteredBusinesses,
  onBusinessSelect,
  onToggleFavorite,
  recommendationResults,
  onAnalysisRequest,
  onToggleRecommendationFavorite,
  onRestoreSearch,
  onLogin
}: SidebarProps) {
  return (
    <div className="w-96 bg-white/90 backdrop-blur-sm border-r border-orange-200 p-6 overflow-y-auto">
      {!user && <GuestModeNotice onLogin={onLogin} />}

      <TabNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        showProfileTab={!!user}
      />

      {activeTab === "search" && (
        <div className="space-y-6">
          <BusinessFilter
            onFilterChange={onFilterChange}
            selectedCategories={selectedCategories}
          />
          <BusinessList
            businesses={filteredBusinesses}
            onBusinessSelect={onBusinessSelect}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}

      {activeTab === "recommend" && (
        <RecommendationPanel
          onAnalysisRequest={onAnalysisRequest}
          results={recommendationResults}
          onToggleFavorite={onToggleRecommendationFavorite}
        />
      )}

      {activeTab === "profile" && user && (
        <div className="space-y-6">
          <ProfileTabNavigation
            activeProfileTab={activeProfileTab}
            onProfileTabChange={onProfileTabChange}
          />

          {activeProfileTab === "favorites" && <FavoritesList />}
          {activeProfileTab === "history" && <SearchHistory onRestoreSearch={onRestoreSearch} />}
          {activeProfileTab === "survey" && <AiSurvey />}
        </div>
      )}
    </div>
  )
}