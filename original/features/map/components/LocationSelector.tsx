// components/LocationSelector.tsx

import { useState } from 'react';
import { Button } from '@/lib/components/ui/button';
import { MapPin, ChevronUp } from 'lucide-react';

const SEOUL_DISTRICTS = [
    // 인기 지역 순으로 정렬
    { name: '강남구', coordinates: { lat: 37.5173, lng: 127.0473 } },
    { name: '서초구', coordinates: { lat: 37.4836, lng: 127.0327 } },
    { name: '송파구', coordinates: { lat: 37.5145, lng: 127.1059 } },
    { name: '마포구', coordinates: { lat: 37.5663, lng: 126.9019 } },
    { name: '용산구', coordinates: { lat: 37.5384, lng: 126.9654 } },
    { name: '종로구', coordinates: { lat: 37.5735, lng: 126.9788 } },
    { name: '중구', coordinates: { lat: 37.5641, lng: 126.9979 } },
    { name: '영등포구', coordinates: { lat: 37.5264, lng: 126.8962 } },
    { name: '관악구', coordinates: { lat: 37.4781, lng: 126.9515 } },
    { name: '동작구', coordinates: { lat: 37.5124, lng: 126.9393 } },
    { name: '성동구', coordinates: { lat: 37.5636, lng: 127.0286 } },
    { name: '광진구', coordinates: { lat: 37.5384, lng: 127.0823 } },
    { name: '동대문구', coordinates: { lat: 37.5744, lng: 127.0396 } },
    { name: '성북구', coordinates: { lat: 37.5894, lng: 127.0167 } },
    { name: '강북구', coordinates: { lat: 37.6369, lng: 127.0256 } },
    { name: '노원구', coordinates: { lat: 37.6542, lng: 127.0568 } },
    { name: '도봉구', coordinates: { lat: 37.6688, lng: 127.0471 } },
    { name: '중랑구', coordinates: { lat: 37.6063, lng: 127.0925 } },
    { name: '강동구', coordinates: { lat: 37.5301, lng: 127.1238 } },
    { name: '서대문구', coordinates: { lat: 37.5794, lng: 126.9368 } },
    { name: '은평구', coordinates: { lat: 37.6176, lng: 126.9227 } },
    { name: '구로구', coordinates: { lat: 37.4954, lng: 126.8873 } },
    { name: '금천구', coordinates: { lat: 37.4519, lng: 126.8956 } },
    { name: '양천구', coordinates: { lat: 37.5168, lng: 126.8665 } },
    { name: '강서구', coordinates: { lat: 37.5509, lng: 126.8495 } },
];

interface LocationSelectorProps {
    onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
}

// components/LocationSelector.tsx 수정

export function LocationSelector({ onLocationSelect }: LocationSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute bottom-16 right-4 z-[1000]"> {/* 🔥 z-index 높이고 bottom 조정 */}
            <div className="relative">
                {/* 드롭업 리스트 */}
                {isOpen && (
                    <div className="absolute bottom-full mb-2 right-0 w-52 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto z-[1001]"> {/* 🔥 z-index 더 높게 */}
                        <div className="p-1">
                            <div className="text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-100">
                                서울시 지역 선택
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {SEOUL_DISTRICTS.map((district) => (
                                    <button
                                        key={district.name}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            onLocationSelect(district.coordinates);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <MapPin className="w-3 h-3 text-gray-400" />
                                        {district.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 버튼 - 더 눈에 띄게 */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`bg-white shadow-xl border-2 border-gray-300 hover:bg-gray-50 transition-all font-medium ${
                        isOpen ? 'bg-blue-50 border-blue-400' : ''
                    }`}
                >
                    <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                    <span className="text-blue-700">지역</span>
                    <ChevronUp className={`w-4 h-4 ml-1 transition-transform text-blue-600 ${
                        isOpen ? 'rotate-180' : ''
                    }`} />
                </Button>
            </div>

            {/* 배경 클릭 시 닫기 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[999]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
