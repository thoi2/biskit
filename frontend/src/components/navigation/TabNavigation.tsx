import Button from '@/components/ui/Button/Button'
import { Search, BarChart3, FileText } from "lucide-react"  // User → FileText

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
            {/* showProfileTab 조건 제거 - 항상 보이게 */}
            <Button
                variant={activeTab === "result" ? "default" : "ghost"}
                size="sm"
                onClick={() => onTabChange("result")}
                className={`flex-1 transition-all duration-300 ${
                    activeTab === "result"                                 
                ? "bg-amber-600 hover:bg-orange-700 text-white shadow-sm"
                : "hover:bg-orange-200 text-orange-700"
                }`}
            >
                <FileText className="w-4 h-4 mr-2" />                    {/* User → FileText */}
                결과                                                      {/* 마이 → 결과 */}
            </Button>
        </div>
    )
}
