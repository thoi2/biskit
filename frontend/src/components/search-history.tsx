"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, Trash2, RotateCcw } from "lucide-react"
// import { createClient } from "@/lib/supabase/client" // Removed supabase dependency
import { useAuth } from "@/components/auth-provider"

interface SearchHistoryItem {
  id: string
  search_type: "filter" | "recommendation"
  search_params: any
  created_at: string
}

interface SearchHistoryProps {
  onRestoreSearch?: (searchType: string, params: any) => void
}

export function SearchHistory({ onRestoreSearch }: SearchHistoryProps) {
  const { user } = useAuth()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  // const supabase = createClient() // Removed supabase dependency

  useEffect(() => {
    if (user) {
      fetchSearchHistory()
    }
  }, [user])

  const fetchSearchHistory = async () => {
    try {
      // const { data, error } = await supabase
      //   .from("search_history")
      //   .select("*")
      //   .order("created_at", { ascending: false })
      //   .limit(20)
      const data: SearchHistoryItem[] = []; const error = null; // Mock data for now

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error("Error fetching search history:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeHistoryItem = async (itemId: string) => {
    try {
      // const { error } = await supabase.from("search_history").delete().eq("id", itemId)
      const error = null; // Mock delete for now

      if (error) throw error
      setHistory((prev) => prev.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error("Error removing history item:", error)
    }
  }

  const clearAllHistory = async () => {
    try {
      // const { error } = await supabase.from("search_history").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
      const error = null; // Mock delete for now

      if (error) throw error
      setHistory([])
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  }

  const formatSearchParams = (searchType: string, params: any) => {
    if (searchType === "filter") {
      const categories = params.categories || []
      return categories.length > 0 ? `업종: ${categories.join(", ")}` : "전체 업종"
    } else if (searchType === "recommendation") {
      const { analysisType, businessType, location } = params
      let description = `${analysisType} 분석`
      if (businessType) description += ` - ${businessType}`
      if (location) description += ` - ${location}`
      return description
    }
    return "알 수 없는 검색"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            검색 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">로딩 중...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            검색 기록 ({history.length})
          </CardTitle>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-red-500 hover:text-red-700">
              전체 삭제
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">검색 기록이 없습니다</p>
            <p className="text-sm text-muted-foreground mt-2">검색을 시작하면 기록이 여기에 저장됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={item.search_type === "filter" ? "default" : "secondary"}>
                        {item.search_type === "filter" ? "검색" : "추천"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {formatSearchParams(item.search_type, item.search_params)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestoreSearch?.(item.search_type, item.search_params)}
                      title="검색 복원"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHistoryItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
