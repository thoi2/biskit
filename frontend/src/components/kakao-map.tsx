"use client"

import type React from "react"

import { useRef, useState } from "react"
import { MapPin, Search, Zap } from "lucide-react"

interface Business {
  id: string
  name: string
  category: string
  address: string
  closureProbability: number
  coordinates: { lat: number; lng: number }
  isFavorite: boolean
}

interface KakaoMapProps {
  businesses: Business[]
  searchActive: boolean
  onBusinessClick?: (business: Business) => void
  onMapClick?: (lat: number, lng: number) => void
}

export function KakaoMap({ businesses, searchActive, onBusinessClick, onMapClick }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!searchActive || !onMapClick) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert pixel coordinates to mock lat/lng
    const lat = 37.5665 + (y - rect.height / 2) * 0.001
    const lng = 126.978 + (x - rect.width / 2) * 0.001

    onMapClick(lat, lng)
  }

  const handleBusinessMarkerClick = (business: Business) => {
    setSelectedBusiness(business)
    onBusinessClick?.(business)
  }

  const getMarkerColor = (probability: number) => {
    if (probability >= 80) return "bg-red-500"
    if (probability >= 60) return "bg-orange-500"
    if (probability >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getMarkerPosition = (business: Business, containerWidth: number, containerHeight: number) => {
    // Mock positioning based on coordinates
    const centerLat = 37.5665
    const centerLng = 126.978

    const x = ((business.coordinates.lng - centerLng) * 10000 + containerWidth / 2) % containerWidth
    const y = ((centerLat - business.coordinates.lat) * 10000 + containerHeight / 2) % containerHeight

    return {
      left: Math.max(20, Math.min(containerWidth - 60, x)),
      top: Math.max(20, Math.min(containerHeight - 60, y)),
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-blue-100 via-green-50 to-blue-50 rounded-lg overflow-hidden cursor-pointer relative"
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(147, 197, 253, 0.2) 0%, rgba(167, 243, 208, 0.2) 100%)
          `,
        }}
      >
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Mock Streets */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-300/40 rounded"></div>
          <div className="absolute top-2/3 left-0 right-0 h-2 bg-gray-300/40 rounded"></div>
          <div className="absolute left-1/4 top-0 bottom-0 w-2 bg-gray-300/40 rounded"></div>
          <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-gray-300/40 rounded"></div>
        </div>

        {/* Business Markers */}
        {businesses.map((business) => {
          const position = getMarkerPosition(business, 800, 600)
          return (
            <div
              key={business.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 z-10`}
              style={{ left: position.left, top: position.top }}
              onClick={(e) => {
                e.stopPropagation()
                handleBusinessMarkerClick(business)
              }}
            >
              <div
                className={`w-8 h-8 ${getMarkerColor(business.closureProbability)} rounded-full border-2 border-white shadow-lg flex items-center justify-center`}
              >
                <span className="text-white text-xs font-bold">{business.closureProbability}%</span>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                <div className="bg-white px-2 py-1 rounded shadow-md text-xs font-medium whitespace-nowrap border">
                  {business.name}
                </div>
              </div>
            </div>
          )
        })}

        {/* Center Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>

        {/* Map Info */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="text-sm font-medium text-gray-900 mb-1">서울시 중심가</div>
          <div className="text-xs text-gray-600">상가 분석 지역</div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="text-xs font-medium text-gray-900 mb-2">폐업 위험도</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">낮음 (0-39%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600">보통 (40-59%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">높음 (60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">매우 높음 (80%+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Mode Overlay */}
      {searchActive && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-xl max-w-md text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Search className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-lg mb-2 text-gray-900">검색 모드 활성화</p>
            <p className="text-sm text-gray-600">지도를 클릭하여 해당 위치의 상가 정보를 확인하세요</p>
          </div>
        </div>
      )}

      {/* Business Detail Popup */}
      {selectedBusiness && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-64">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedBusiness.name}</h3>
              <p className="text-sm text-gray-600">{selectedBusiness.category}</p>
            </div>
            <button onClick={() => setSelectedBusiness(null)} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{selectedBusiness.address}</p>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium text-white ${getMarkerColor(selectedBusiness.closureProbability)}`}
              >
                폐업률 {selectedBusiness.closureProbability}%
              </span>
              {selectedBusiness.isFavorite && <span className="text-red-500">♥</span>}
            </div>
          </div>
        </div>
      )}

      {/* Demo Notice */}
      <div className="absolute bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-lg max-w-xs">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-800">데모 지도</p>
            <p className="text-xs text-amber-700">실제 서비스에서는 카카오맵이 연동됩니다</p>
          </div>
        </div>
      </div>
    </div>
  )
}
