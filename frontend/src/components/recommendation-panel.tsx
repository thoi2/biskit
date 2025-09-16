"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Target, Circle, Building2, Map, BarChart3, TrendingUp, Heart } from "lucide-react"

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

interface RecommendationPanelProps {
  onAnalysisRequest: (analysisType: string, params: any) => void
  results: RecommendationResult[]
  onToggleFavorite: (id: string) => void
}

export function RecommendationPanel({ onAnalysisRequest, results, onToggleFavorite }: RecommendationPanelProps) {
  const [activeAnalysis, setActiveAnalysis] = useState("single")
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" })
  const [businessType, setBusinessType] = useState("")
  const [rangeRadius, setRangeRadius] = useState("1000")
  const [resultCount, setResultCount] = useState("5")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("")

  const districts = ["강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "중구", "종로구"]
  const neighborhoods = ["역삼동", "논현동", "청담동", "삼성동", "대치동", "개포동", "잠실동", "신천동"]

  const businessTypes = ["카페", "음식점", "미용실", "편의점", "의류매장", "화장품매장", "학원", "병원"]

  const handleSingleAnalysis = () => {
    if (!coordinates.lat || !coordinates.lng) return
    onAnalysisRequest("single", { coordinates, businessType })
  }

  const handleRangeAnalysis = () => {
    if (!coordinates.lat || !coordinates.lng) return
    onAnalysisRequest("range", { coordinates, businessType, radius: rangeRadius, count: resultCount })
  }

  const handleSeoulAnalysis = () => {
    if (!businessType) return
    onAnalysisRequest("seoul", { businessType, count: resultCount })
  }

  const handleDistrictAnalysis = () => {
    if (!selectedDistrict || !businessType) return
    onAnalysisRequest("district", { district: selectedDistrict, businessType, count: resultCount })
  }

  const handleNeighborhoodAnalysis = () => {
    if (!selectedNeighborhood || !businessType) return
    onAnalysisRequest("neighborhood", { neighborhood: selectedNeighborhood, businessType, count: resultCount })
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "high":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "low":
        return "default"
      case "medium":
        return "secondary"
      case "high":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            추천 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeAnalysis} onValueChange={setActiveAnalysis}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">단일/범위</TabsTrigger>
              <TabsTrigger value="area">지역별</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              {/* Single Coordinate Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    단일 좌표 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="lat" className="text-xs">
                        위도
                      </Label>
                      <Input
                        id="lat"
                        placeholder="37.5665"
                        value={coordinates.lat}
                        onChange={(e) => setCoordinates((prev) => ({ ...prev, lat: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng" className="text-xs">
                        경도
                      </Label>
                      <Input
                        id="lng"
                        placeholder="126.9780"
                        value={coordinates.lng}
                        onChange={(e) => setCoordinates((prev) => ({ ...prev, lng: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="business-type" className="text-xs">
                      업종 (선택사항)
                    </Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="업종 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSingleAnalysis} className="w-full" size="sm">
                    단일 분석 실행
                  </Button>
                </CardContent>
              </Card>

              {/* Range Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Circle className="w-4 h-4" />
                    범위 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="radius" className="text-xs">
                        반경 (m)
                      </Label>
                      <Select value={rangeRadius} onValueChange={setRangeRadius}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500m</SelectItem>
                          <SelectItem value="1000">1km</SelectItem>
                          <SelectItem value="2000">2km</SelectItem>
                          <SelectItem value="5000">5km</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="count" className="text-xs">
                        결과 개수
                      </Label>
                      <Select value={resultCount} onValueChange={setResultCount}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5개</SelectItem>
                          <SelectItem value="10">10개</SelectItem>
                          <SelectItem value="20">20개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleRangeAnalysis} className="w-full" size="sm">
                    범위 분석 실행
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="area" className="space-y-4 mt-4">
              {/* Seoul Wide Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    서울 전체 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="seoul-business-type" className="text-xs">
                      업종
                    </Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="업종 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSeoulAnalysis} className="w-full" size="sm">
                    서울 전체 분석
                  </Button>
                </CardContent>
              </Card>

              {/* District Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    구별 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="district" className="text-xs">
                      구 선택
                    </Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="구 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleDistrictAnalysis} className="w-full" size="sm">
                    구별 분석 실행
                  </Button>
                </CardContent>
              </Card>

              {/* Neighborhood Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    동별 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="neighborhood" className="text-xs">
                      동 선택
                    </Label>
                    <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="동 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {neighborhoods.map((neighborhood) => (
                          <SelectItem key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleNeighborhoodAnalysis} className="w-full" size="sm">
                    동별 분석 실행
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                분석 결과
              </div>
              <Badge variant="outline">{results.length}개</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {results.map((result) => (
                  <Card key={result.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1">{result.businessName}</h3>
                        <p className="text-xs text-muted-foreground mb-1">{result.businessType}</p>
                        <p className="text-xs text-muted-foreground">{result.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariant(result.riskLevel)} className="text-xs">
                          {result.riskLevel === "low" ? "낮음" : result.riskLevel === "medium" ? "보통" : "높음"}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => onToggleFavorite(result.id)}>
                          <Heart
                            className={`w-4 h-4 ${
                              result.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-medium">5개년 폐업 확률</h4>
                      {Object.entries(result.closureProbability).map(([year, probability]) => (
                        <div key={year} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{year.replace("year", "")}년차</span>
                            <span className="text-xs font-medium">{probability}%</span>
                          </div>
                          <Progress value={probability} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
