// hooks/useBiskitData.ts
import { useState } from "react"
import { saveSearchHistory } from "@/lib/search-history"

// Mock business data
const mockBusinesses = [
    {
        id: "1",
        name: "강남 카페 로스터리",
        category: "카페",
        address: "서울시 강남구 테헤란로 123",
        closureProbability: 78,
        rating: 4.2,
        openHours: "07:00-22:00",
        coordinates: { lat: 37.5665, lng: 126.978 },
        isFavorite: false,
    },
    {
        id: "2",
        name: "명동 한정식",
        category: "한정식",
        address: "서울시 중구 명동길 45",
        closureProbability: 62,
        rating: 4.5,
        openHours: "11:00-21:00",
        coordinates: { lat: 37.5636, lng: 126.9834 },
        isFavorite: true,
    },
    {
        id: "3",
        name: "홍대 미용실",
        category: "미용실",
        address: "서울시 마포구 홍익로 67",
        closureProbability: 90,
        rating: 3.8,
        openHours: "10:00-20:00",
        coordinates: { lat: 37.5563, lng: 126.9236 },
        isFavorite: false,
    },
]

// Mock recommendation results
const mockRecommendationResults = [
    {
        id: "rec1",
        businessName: "강남역 스타벅스",
        address: "서울시 강남구 강남대로 123",
        businessType: "카페",
        closureProbability: {
            year1: 15,
            year2: 28,
            year3: 42,
            year4: 58,
            year5: 75,
        },
        coordinates: { lat: 37.5665, lng: 126.978 },
        riskLevel: "medium" as const,
        isFavorite: false,
    },
    {
        id: "rec2",
        businessName: "홍대 미용실 클립",
        address: "서울시 마포구 홍익로 67",
        businessType: "미용실",
        closureProbability: {
            year1: 25,
            year2: 45,
            year3: 65,
            year4: 80,
            year5: 90,
        },
        coordinates: { lat: 37.5563, lng: 126.9236 },
        riskLevel: "high" as const,
        isFavorite: true,
    },
]

export function useBiskitData(user: Record<string, any> | null, setActiveTab: (tab: string) => void) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [businesses, setBusinesses] = useState(mockBusinesses)
    const [filteredBusinesses, setFilteredBusinesses] = useState(mockBusinesses)
    const [recommendationResults, setRecommendationResults] = useState(mockRecommendationResults)

    const handleFilterChange = (categories: string[]) => {
        setSelectedCategories(categories)
        if (categories.length === 0) {
            setFilteredBusinesses(businesses)
        } else {
            const filtered = businesses.filter((business) =>
                categories.some((category) => business.category.includes(category)),
            )
            setFilteredBusinesses(filtered)
        }

        if (user) {
            saveSearchHistory({
                search_type: "filter",
                search_params: { categories },
            })
        }
    }

    const handleBusinessSelect = (business: Record<string, any>) => {
        console.log("Selected business:", business)
    }

    const handleToggleFavorite = (businessId: string) => {
        if (!user) {
            alert("찜 기능을 사용하려면 로그인이 필요합니다.")
            return
        }

        setBusinesses((prev) =>
            prev.map((business) =>
                business.id === businessId ? { ...business, isFavorite: !business.isFavorite } : business,
            ),
        )
        setFilteredBusinesses((prev) =>
            prev.map((business) =>
                business.id === businessId ? { ...business, isFavorite: !business.isFavorite } : business,
            ),
        )
    }

    const handleAnalysisRequest = (analysisType: string, params: Record<string, any>) => {
        console.log("Analysis requested:", analysisType, params)
        setRecommendationResults(mockRecommendationResults)

        if (user) {
            saveSearchHistory({
                search_type: "recommendation",
                search_params: { analysisType, ...params },
            })
        }
    }

    const handleToggleRecommendationFavorite = (id: string) => {
        if (!user) {
            alert("찜 기능을 사용하려면 로그인이 필요합니다.")
            return
        }

        setRecommendationResults((prev) =>
            prev.map((result) => (result.id === id ? { ...result, isFavorite: !result.isFavorite } : result)),
        )
    }

    const handleRestoreSearch = (searchType: string, params: Record<string, any>) => {
        if (searchType === "filter") {
            setActiveTab("search")
            setSelectedCategories(params.categories || [])
            handleFilterChange(params.categories || [])
        } else if (searchType === "recommendation") {
            setActiveTab("recommend")
        }
    }

    const handleMapClick = (lat: number, lng: number) => {
        console.log(`지도 클릭: ${lat}, ${lng}`)
    }

    const handleBusinessClick = (business: Record<string, any>) => {
        console.log("선택된 상가:", business)
    }

    const handlers = {
        handleFilterChange,
        handleBusinessSelect,
        handleToggleFavorite,
        handleAnalysisRequest,
        handleToggleRecommendationFavorite,
        handleRestoreSearch,
        handleMapClick,
        handleBusinessClick,
    }

    return {
        selectedCategories,
        setSelectedCategories,
        filteredBusinesses,
        recommendationResults,
        handlers,
    }
}
