// components/ui/ResultPanel.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, FileText, Eye, EyeOff } from "lucide-react"
import { FavoritesList } from "@/components/favorites-list"
import { SearchHistory } from "@/components/search-history"

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
    hidden?: boolean
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

interface ResultPanelProps {
    user: Record<string, any> | null
    filteredBusinesses: Business[]
    recommendationResults: RecommendationResult[]
    onToggleFavorite: (businessId: string) => void
    onToggleRecommendationFavorite: (id: string) => void
    onToggleHideStore: (id: string) => void
    onRestoreSearch: (searchType: string, params: Record<string, any>) => void
}

export function ResultPanel({
                                user,
                                filteredBusinesses,
                                recommendationResults,
                                onToggleFavorite,
                                onToggleRecommendationFavorite,
                                onToggleHideStore,
                                onRestoreSearch,
                            }: ResultPanelProps) {
    return (
        <div className="space-y-6">
            {/* 로그인한 경우만 찜·기록 표시 */}
            {user && (
                <>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b border-orange-200 pb-2 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500" />
                            내 찜 목록
                        </h3>
                        <FavoritesList />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b border-orange-200 pb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            최근 검색 기록
                        </h3>
                        <SearchHistory onRestoreSearch={onRestoreSearch} />
                    </div>
                </>
            )}

            {/* 현재 세션 결과 */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-orange-200 pb-2">
                    현재 세션 결과
                </h3>

                {/* 점포 결과 */}
                {filteredBusinesses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-blue-700 flex items-center justify-between">
                                검색된 점포
                                <Badge variant="outline">{filteredBusinesses.length}개</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {filteredBusinesses.map(business => (
                                <div key={`store-${business.id}`} className={`p-3 border rounded-lg transition-opacity ${business.hidden ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-blue-500 text-white text-xs">
                                                상가
                                            </Badge>
                                            <span className="font-medium">{business.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onToggleHideStore(business.id)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                {business.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                            {user && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onToggleFavorite(business.id)}
                                                    className="text-yellow-500 hover:text-yellow-600"
                                                >
                                                    {business.isFavorite ? "★" : "☆"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{business.address}</p>
                                    <p className="text-xs text-gray-500 mt-1">{business.category}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* 추천 결과 */}
                {recommendationResults.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-orange-700 flex items-center justify-between">
                                AI 추천
                                <Badge variant="outline">{recommendationResults.length}개</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recommendationResults.map(rec => (
                                <div key={`rec-${rec.id}`} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-orange-500 text-white text-xs">
                                                추천
                                            </Badge>
                                            <span className="font-medium">{rec.businessName}</span>
                                        </div>
                                        {user && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onToggleRecommendationFavorite(rec.id)}
                                                className="text-yellow-500 hover:text-yellow-600"
                                            >
                                                {rec.isFavorite ? "★" : "☆"}
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{rec.address}</p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        폐업률: {rec.closureProbability.year1}%
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {filteredBusinesses.length === 0 && recommendationResults.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 mb-2">아직 검색 결과가 없습니다</p>
                            <p className="text-sm text-gray-400">검색 또는 추천을 실행해보세요</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 비로그인 시 안내 메시지 */}
            {!user && (
                <Card className="border-orange-200">
                    <CardContent className="p-4 bg-orange-50">
                        <p className="text-sm text-orange-700 text-center">
                            로그인하면 찜과 검색 기록을 확인할 수 있습니다
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}