import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { KakaoMap } from "@/components/kakao-map"

interface MapAreaProps {
    businesses: any[]
    searchActive: boolean
    setSearchActive: (active: boolean) => void
    onBusinessClick: (business: any) => void
    onMapClick: (lat: number, lng: number) => void
}

export function MapArea({ businesses, searchActive, setSearchActive, onBusinessClick, onMapClick }: MapAreaProps) {
    return (
        <div className="flex-1 relative">
            <div className="absolute top-6 left-6 z-10">
                <Button
                    onClick={() => setSearchActive(!searchActive)}
                    className={`transition-all duration-300 ${
                        searchActive
                            ? "bg-primary hover:bg-orange-700 text-white"
                            : "bg-white/90 hover:bg-white text-orange-900"
                    }`}
                >
                    <Search className="w-4 h-4 mr-2" />
                    {searchActive ? "검색 중지" : "지도에서 검색"}
                </Button>
            </div>

            <KakaoMap
                businesses={businesses}
                searchActive={searchActive}
                onBusinessClick={onBusinessClick}
                onMapClick={onMapClick}
            />
        </div>
    )
}
