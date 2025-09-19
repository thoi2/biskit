"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

// 👇 타입 선언 추가
declare global {
  interface Window {
    kakao: any;
  }
}

interface Business {
  id: string
  name: string
  category: string
  address: string
  closureProbability: number
  coordinates: { lat: number; lng: number }
  isFavorite: boolean
}

interface MapBounds {
  sw: { lat: number; lng: number }
  ne: { lat: number; lng: number }
}

interface KakaoMapProps {
  businesses: Business[]
  searchActive: boolean
  onBusinessClick?: (business: Business) => void
  onMapClick?: (lat: number, lng: number) => void
  onBoundsChange?: (bounds: MapBounds) => void
  onSearchInArea?: (bounds: MapBounds) => void
}

// 수정된 디바운스 훅
const useDebounce = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

export function KakaoMap({
                           businesses,
                           searchActive,
                           onBusinessClick,
                           onMapClick,
                           onBoundsChange,
                           onSearchInArea
                         }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState<number>(3)
  const [isSearchAvailable, setIsSearchAvailable] = useState<boolean>(false)

  // 검색 가능한 최대 레벨 설정 (1 또는 2에서만 검색 가능)
  const MAX_SEARCH_LEVEL = 2

  // 🔥 useCallback으로 안정적인 함수 참조 생성
  const getCurrentBounds = useCallback((): MapBounds | null => {
    if (!map) return null

    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    return {
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() }
    }
  }, [map])

  const updateSearchAvailability = useCallback(() => {
    if (!map) return

    const level = map.getLevel()
    setCurrentLevel(level)
    setIsSearchAvailable(level <= MAX_SEARCH_LEVEL)

    console.log(`현재 지도 레벨: ${level}, 검색 가능: ${level <= MAX_SEARCH_LEVEL}`)
  }, [map]) // MAX_SEARCH_LEVEL은 상수이므로 의존성에서 제외

  const handleBoundsChanged = useCallback(() => {
    const bounds = getCurrentBounds()
    if (bounds && onBoundsChange) {
      onBoundsChange(bounds)
    }
  }, [getCurrentBounds, onBoundsChange])

  const handleSearchInCurrentArea = useCallback(() => {
    if (!isSearchAvailable) {
      return
    }

    const bounds = getCurrentBounds()
    if (bounds && onSearchInArea) {
      onSearchInArea(bounds)
    }
  }, [isSearchAvailable, getCurrentBounds, onSearchInArea])

  // 🔥 디바운스된 핸들러들 - 안정적인 참조로 수정
  const debouncedUpdateSearch = useDebounce(updateSearchAvailability, 200)
  const debouncedBoundsChange = useDebounce(handleBoundsChanged, 300)

  // 레벨에 따른 안내 메시지
  const getSearchMessage = useCallback((level: number) => {
    if (level <= 2) {
      return {
        available: true,
        message: '현재 영역에서 검색',
        detail: `레벨 ${level} - 검색 가능`
      }
    } else if (level <= 5) {
      return {
        available: false,
        message: '🔍 더 확대해서 검색해주세요',
        detail: `현재 레벨 ${level} → 레벨 ${MAX_SEARCH_LEVEL} 이하로 확대 필요`
      }
    } else {
      return {
        available: false,
        message: '🔍 지도를 많이 확대해주세요',
        detail: `현재 레벨 ${level} → 레벨 ${MAX_SEARCH_LEVEL} 이하로 많이 확대 필요`
      }
    }
  }, []) // 상수만 사용하므로 의존성 배열 비움

  // 카카오맵 스크립트 로딩
  useEffect(() => {
    let isMounted = true

    const loadKakaoMap = async () => {
      try {
        if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
          setIsLoading(false)
          return
        }

        const script = document.createElement('script')
        script.async = true
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`

        script.onload = () => {
          if (isMounted) {
            setIsLoading(false)
          }
        }

        script.onerror = () => {
          if (isMounted) {
            setLoadError('카카오맵 API를 불러올 수 없습니다.')
            setIsLoading(false)
          }
        }

        document.head.appendChild(script)
      } catch (error) {
        if (isMounted) {
          setLoadError('카카오맵 로딩 중 오류가 발생했습니다.')
          setIsLoading(false)
        }
      }
    }

    loadKakaoMap()
    return () => { isMounted = false }
  }, [])

  // 🔥 지도 초기화 - 의존성 배열에서 함수들 제거
  useEffect(() => {
    if (isLoading || loadError || !mapRef.current) return

    const initializeMap = () => {
      if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
        setTimeout(initializeMap, 100)
        return
      }

      window.kakao.maps.load(() => {
        const container = mapRef.current
        if (!container) return

        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3
        }

        const kakaoMap = new window.kakao.maps.Map(container, options)
        setMap(kakaoMap)

        setTimeout(() => {
          kakaoMap.relayout()
        }, 100)
      })
    }

    initializeMap()
  }, [isLoading, loadError]) // 🔥 함수 참조들을 의존성에서 제거

  // 🔥 이벤트 리스너 등록을 별도 useEffect로 분리
  useEffect(() => {
    if (!map) return

    // 지도 레벨 변경 이벤트 리스너
    const handleZoomChanged = () => {
      debouncedUpdateSearch()
      debouncedBoundsChange()
    }

    // 지도 영역 변경 이벤트 리스너
    const handleBoundsChanged = () => {
      debouncedBoundsChange()
    }

    // 지도 클릭 이벤트 리스너
    const handleMapClick = (mouseEvent: any) => {
      if (searchActive && onMapClick && isSearchAvailable) {
        const latlng = mouseEvent.latLng
        onMapClick(latlng.getLat(), latlng.getLng())
      }
    }

    // 이벤트 리스너 등록
    window.kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChanged)
    window.kakao.maps.event.addListener(map, 'bounds_changed', handleBoundsChanged)

    if (searchActive && onMapClick) {
      window.kakao.maps.event.addListener(map, 'click', handleMapClick)
    }

    // 초기 레벨 확인
    updateSearchAvailability()

    // cleanup 함수 - 이벤트 리스너 제거
    return () => {
      if (map && window.kakao && window.kakao.maps) {
        try {
          window.kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChanged)
          window.kakao.maps.event.removeListener(map, 'bounds_changed', handleBoundsChanged)
          if (searchActive && onMapClick) {
            window.kakao.maps.event.removeListener(map, 'click', handleMapClick)
          }
        } catch (error) {
          console.warn('이벤트 리스너 제거 중 오류:', error)
        }
      }
    }
  }, [map, searchActive, onMapClick, isSearchAvailable, debouncedUpdateSearch, debouncedBoundsChange, updateSearchAvailability])

  // 윈도우 리사이즈 이벤트 리스너
  useEffect(() => {
    if (!map) return

    const handleResize = () => {
      setTimeout(() => {
        map.relayout()
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [map])

  // 컴포넌트 마운트 후 relayout 재호출
  useEffect(() => {
    if (!map) return

    const timer = setTimeout(() => {
      map.relayout()
    }, 300)

    return () => clearTimeout(timer)
  }, [map])

  // 마커 생성
  useEffect(() => {
    if (!map || !businesses.length) return

    // 기존 마커들 제거
    markers.forEach(marker => marker.setMap(null))

    const newMarkers = businesses.map((business) => {
      const markerPosition = new window.kakao.maps.LatLng(
          business.coordinates.lat,
          business.coordinates.lng
      )

      const markerColor = getMarkerColorHex(business.closureProbability)
      const customMarkerContent = `
        <div style="position: relative; cursor: pointer;">
          <div style="
            width: 32px; height: 32px; background-color: ${markerColor};
            border: 2px solid white; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            font-size: 10px; font-weight: bold; color: white;
          ">${business.closureProbability}%</div>
          <div style="
            position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
            margin-top: 4px; background: white; padding: 4px 8px; border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;
            font-size: 12px; font-weight: 500; white-space: nowrap; color: #374151;
          ">${business.name}</div>
        </div>
      `

      const customOverlay = new window.kakao.maps.CustomOverlay({
        map: map,
        position: markerPosition,
        content: customMarkerContent,
        yAnchor: 1,
        clickable: true
      })

      // 마커 클릭 이벤트
      const handleMarkerClick = () => {
        setSelectedBusiness(business)
        onBusinessClick?.(business)
      }

      // DOM 요소에 직접 이벤트 등록
      const markerElement = customOverlay.getContent()
      if (markerElement && typeof markerElement === 'string') {
        // 문자열 형태의 HTML을 DOM 요소로 변환 후 이벤트 등록
        setTimeout(() => {
          const actualElement = document.querySelector(`[data-marker-id="${business.id}"]`)
          if (actualElement) {
            actualElement.addEventListener('click', handleMarkerClick)
          }
        }, 0)
      } else {
        // CustomOverlay 이벤트 등록 (fallback)
        window.kakao.maps.event.addListener(customOverlay, 'click', handleMarkerClick)
      }

      return customOverlay
    })

    setMarkers(newMarkers)

    // 마커들이 모두 보이도록 지도 영역 설정
    if (businesses.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds()
      businesses.forEach(business => {
        bounds.extend(new window.kakao.maps.LatLng(business.coordinates.lat, business.coordinates.lng))
      })
      map.setBounds(bounds)

      setTimeout(() => {
        map.relayout()
      }, 100)
    }

    // cleanup 함수
    return () => {
      newMarkers.forEach(marker => {
        if (marker) {
          marker.setMap(null)
        }
      })
    }
  }, [map, businesses, onBusinessClick])

  const getMarkerColorHex = (probability: number) => {
    if (probability >= 80) return "#ef4444"
    if (probability >= 60) return "#f97316"
    if (probability >= 40) return "#eab308"
    return "#22c55e"
  }

  const getMarkerColorClass = (probability: number) => {
    if (probability >= 80) return "bg-red-500"
    if (probability >= 60) return "bg-orange-500"
    if (probability >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  // 로딩 중
  if (isLoading) {
    return (
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600">카카오맵을 불러오는 중...</div>
            </div>
          </div>
        </div>
    )
  }

  // 에러 발생
  if (loadError) {
    return (
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-red-600 mb-2">⚠️ {loadError}</div>
              <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
    )
  }

  const searchInfo = getSearchMessage(currentLevel)

  return (
      <div className="relative w-full h-full">
        <div
            ref={mapRef}
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ minHeight: '500px' }}
        />

        {/* 검색 버튼 또는 안내 메시지 */}
        {searchActive && (
            <div className="absolute top-4 right-4 z-20">
              {searchInfo.available ? (
                  <button
                      onClick={handleSearchInCurrentArea}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    {searchInfo.message}
                  </button>
              ) : (
                  <div className="bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg min-w-64">
                    <div className="text-sm">
                      <div className="font-medium mb-1">{searchInfo.message}</div>
                      <div className="text-xs opacity-90">
                        {searchInfo.detail}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        💡 마우스 휠이나 더블클릭으로 확대하세요
                      </div>
                    </div>
                  </div>
              )}
            </div>
        )}

        {/* 현재 축적 표시 */}
        {searchActive && (
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow text-sm text-gray-700 z-20 border">
              <div className="flex items-center gap-2">
                <span className="font-medium">레벨 {currentLevel}</span>
                <span className={`w-2 h-2 rounded-full ${isSearchAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className={`text-xs ${isSearchAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isSearchAvailable ? '검색 가능' : '검색 불가'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentLevel === 1 && '약 20m 축척'}
                {currentLevel === 2 && '약 30m 축척'}
                {currentLevel > 2 && `레벨 ${MAX_SEARCH_LEVEL} 이하 필요`}
              </div>
            </div>
        )}

        {selectedBusiness && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-64">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedBusiness.name}</h3>
                  <p className="text-sm text-gray-600">{selectedBusiness.category}</p>
                </div>
                <button
                    onClick={() => setSelectedBusiness(null)}
                    className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{selectedBusiness.address}</p>
                <div className="flex items-center gap-2">
                  <span
                      className={`px-2 py-1 rounded text-xs font-medium text-white ${getMarkerColorClass(selectedBusiness.closureProbability)}`}
                  >
                    폐업률 {selectedBusiness.closureProbability}%
                  </span>
                  {selectedBusiness.isFavorite && <span className="text-red-500">♥</span>}
                </div>
              </div>
            </div>
        )}
      </div>
  )
}
