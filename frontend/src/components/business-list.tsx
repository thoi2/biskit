"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Heart, Star, Clock } from "lucide-react"

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

interface BusinessListProps {
  businesses: Business[]
  onBusinessSelect: (business: Business) => void
  onToggleFavorite: (businessId: string) => void
}

export function BusinessList({ businesses, onBusinessSelect, onToggleFavorite }: BusinessListProps) {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return "text-red-600"
    if (probability >= 60) return "text-orange-500"
    if (probability >= 40) return "text-yellow-500"
    return "text-green-600"
  }

  const getProbabilityBadgeVariant = (probability: number) => {
    if (probability >= 80) return "destructive"
    if (probability >= 60) return "secondary"
    return "default"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            검색 결과
          </div>
          <Badge variant="outline">{businesses.length}개</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {businesses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>검색 결과가 없습니다.</p>
                <p className="text-sm">다른 업종을 선택해보세요.</p>
              </div>
            ) : (
              businesses.map((business) => (
                <Card
                  key={business.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onBusinessSelect(business)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1">{business.name}</h3>
                        <p className="text-xs text-muted-foreground mb-1">{business.category}</p>
                        <p className="text-xs text-muted-foreground">{business.address}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(business.id)
                        }}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            business.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {/* Closure Probability */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">5년 폐업 확률</span>
                          <Badge variant={getProbabilityBadgeVariant(business.closureProbability)} className="text-xs">
                            {business.closureProbability}%
                          </Badge>
                        </div>
                        <Progress value={business.closureProbability} className="h-1" />
                      </div>

                      {/* Rating and Hours */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{business.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{business.openHours}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
