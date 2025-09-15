"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Search, Filter, X } from "lucide-react"

// Mock business category data structure
const businessCategories = {
  음식점업: {
    한식음식점업: ["한정식", "갈비전문점", "삼겹살전문점", "치킨전문점", "분식점"],
    중식음식점업: ["중국요리전문점", "짜장면전문점", "딤섬전문점"],
    일식음식점업: ["초밥전문점", "라멘전문점", "돈까스전문점", "우동전문점"],
    양식음식점업: ["이탈리안레스토랑", "패밀리레스토랑", "스테이크전문점"],
    기타외국식음식점업: ["태국음식점", "인도음식점", "멕시칸음식점"],
  },
  소매업: {
    종합소매업: ["대형마트", "편의점", "슈퍼마켓", "백화점"],
    의복소매업: ["의류매장", "신발매장", "가방매장", "액세서리매장"],
    화장품소매업: ["화장품전문점", "향수매장", "네일샵용품"],
    식품소매업: ["정육점", "수산물판매", "과일가게", "떡집"],
  },
  서비스업: {
    미용업: ["미용실", "네일샵", "피부관리실", "마사지샵"],
    세탁업: ["세탁소", "드라이클리닝", "빨래방"],
    수리업: ["휴대폰수리", "시계수리", "구두수리", "자전거수리"],
    교육서비스업: ["학원", "과외", "음악교습소", "체육시설"],
  },
}

interface BusinessFilterProps {
  onFilterChange: (selectedCategories: string[]) => void
  selectedCategories: string[]
}

export function BusinessFilter({ onFilterChange, selectedCategories }: BusinessFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedMajor, setExpandedMajor] = useState<string[]>([])
  const [expandedMinor, setExpandedMinor] = useState<string[]>([])

  const toggleMajorCategory = (category: string) => {
    setExpandedMajor((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  const toggleMinorCategory = (category: string) => {
    setExpandedMinor((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  const handleCategorySelect = (category: string) => {
    const newSelection = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]

    onFilterChange(newSelection)
  }

  const clearAllFilters = () => {
    onFilterChange([])
  }

  const filteredCategories = Object.entries(businessCategories).filter(
    ([major]) =>
      major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.entries(businessCategories[major as keyof typeof businessCategories]).some(
        ([minor]) =>
          minor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (businessCategories[major as keyof typeof businessCategories] as any)[
            minor
          ].some((sub: string) => sub.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            업종별 필터
          </div>
          {selectedCategories.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="업종 검색... (총 947개)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">선택된 업종 ({selectedCategories.length}개)</p>
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Category Tree */}
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {filteredCategories.map(([majorCategory, minorCategories]) => (
              <Collapsible
                key={majorCategory}
                open={expandedMajor.includes(majorCategory)}
                onOpenChange={() => toggleMajorCategory(majorCategory)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                    {expandedMajor.includes(majorCategory) ? (
                      <ChevronDown className="w-4 h-4 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-medium">{majorCategory}</span>
                    <Badge variant="outline" className="ml-auto">
                      {Object.values(minorCategories).flat().length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6 space-y-1">
                  {Object.entries(minorCategories).map(([minorCategory, subCategories]) => (
                    <Collapsible
                      key={minorCategory}
                      open={expandedMinor.includes(minorCategory)}
                      onOpenChange={() => toggleMinorCategory(minorCategory)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start p-2 h-auto text-sm">
                          {expandedMinor.includes(minorCategory) ? (
                            <ChevronDown className="w-3 h-3 mr-2" />
                          ) : (
                            <ChevronRight className="w-3 h-3 mr-2" />
                          )}
                          <span>{minorCategory}</span>
                          <Badge variant="outline" className="ml-auto">
                            {subCategories.length}
                          </Badge>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-6 space-y-1">
                        {subCategories.map((subCategory) => (
                          <Button
                            key={subCategory}
                            variant={selectedCategories.includes(subCategory) ? "secondary" : "ghost"}
                            className="w-full justify-start p-2 h-auto text-sm"
                            onClick={() => handleCategorySelect(subCategory)}
                          >
                            <span>{subCategory}</span>
                          </Button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
