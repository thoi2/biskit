import Button from '@/components/ui/Button/Button'
import { Search, BarChart3, User } from "lucide-react"

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  showProfileTab: boolean
}

export function TabNavigation({ activeTab, onTabChange, showProfileTab }: TabNavigationProps) {
  return (
    <div className="flex gap-2 mb-8 p-1 bg-orange-100 rounded-xl">
      <Button
        variant={activeTab === "search" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTabChange("search")}
        className={`flex-1 transition-all duration-300 ${
          activeTab === "search"
            ? "bg-amber-600 hover:bg-orange-700 text-white shadow-sm"
            : "hover:bg-orange-200 text-orange-700"
        }`}
      >
        <Search className="w-4 h-4 mr-2" />
        검색
      </Button>
      <Button
        variant={activeTab === "recommend" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTabChange("recommend")}
        className={`flex-1 transition-all duration-300 ${
          activeTab === "recommend"
            ? "bg-amber-600 hover:bg-orange-700 text-white shadow-sm"
            : "hover:bg-orange-200 text-orange-700"
        }`}
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        추천
      </Button>
      {showProfileTab && (
        <Button
          variant={activeTab === "profile" ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange("profile")}
          className={`flex-1 transition-all duration-300 ${
            activeTab === "profile"
              ? "bg-amber-600 hover:bg-orange-700 text-white shadow-sm"
              : "hover:bg-orange-200 text-orange-700"
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          마이
        </Button>
      )}
    </div>
  )
}