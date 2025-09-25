'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Label } from '@/lib/components/ui/label';
import { Square, Circle, Zap, AlertTriangle, X } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useIndustryStore } from '@/features/survey/store/industryStore';
import { useStoreStore } from '@/features/stores/store/storesStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import IndustrySelectModal from '@/features/survey/components/IndustrySelectModal';
import storeCategories from '@/lib/data/store_categories.json';

interface CategoryData {
    상권업종대분류코드: string;
    상권업종대분류명: string;
    상권업종중분류코드: string;
    상권업종중분류명: string;
    상권업종소분류코드: string;
    상권업종소분류명: string;
}

interface PolygonPoint {
    lat: number;
    lng: number;
}

interface AreaAnalysisData {
    polygon: PolygonPoint[];
    category: string;
}

export function AreaRecommendationPanel() {
    const {
        activeTab,
        map,
        isDrawingMode,
        drawingType,
        setIsDrawingMode,
        setDrawingType
    } = useMapStore();

    const { userIndustries, fetchUserIndustries } = useIndustryStore();
    const { stores } = useStoreStore();
    const { user } = useAuth();

    // 범위 분석 상태
    const [areaCategory, setAreaCategory] = useState('');
    const [drawnArea, setDrawnArea] = useState<PolygonPoint[] | null>(null);
    const [showAreaIndustryModal, setShowAreaIndustryModal] = useState(false);
    const [isAreaAnalyzing, setIsAreaAnalyzing] = useState(false);
    const [drawnOverlay, setDrawnOverlay] = useState<any>(null);

    // 사용자 업종 정보 로드
    useEffect(() => {
        if (user) {
            fetchUserIndustries();
        }
    }, [user, fetchUserIndustries]);

    // 내 추천 업종 변환
    const myRecommendationsForModal = useMemo(() => {
        if (!user || !userIndustries?.hasRecommendation) return [];

        const categories = storeCategories as CategoryData[];
        const recommendations = [
            { code: userIndustries.industry1st, rank: 1, emoji: '🥇' },
            { code: userIndustries.industry2nd, rank: 2, emoji: '🥈' },
            { code: userIndustries.industry3rd, rank: 3, emoji: '🥉' }
        ].filter(item => item.code);

        return recommendations.map(item => {
            const category = categories.find(cat => cat.상권업종소분류코드 === item.code);
            if (!category) return null;

            return {
                industryCode: item.code!,
                industryName: category.상권업종소분류명,
                category: category.상권업종중분류명,
                reason: `${item.emoji} ${item.rank}순위 추천 업종`,
                score: 0
            };
        }).filter(Boolean) as Array<{
            industryCode: string;
            industryName: string;
            category: string;
            reason: string;
            score: number;
        }>;
    }, [user, userIndustries]);

    // 범위 분석 조건 체크
    const hasStoreData = stores.length > 0;
    const isValidZoom = map && map.getLevel() <= 2;
    const canUseAreaRecommendation = hasStoreData && isValidZoom && activeTab === 'recommend';

    // 🎯 실제 카카오맵 객체 찾기 함수
    const findKakaoMap = useCallback(() => {
        console.log('🔍 카카오맵 객체 찾기 시작');

        // 방법 1: props로 전달받은 map 사용
        if (map) {
            console.log('✅ props에서 지도 발견:', map);
            return map;
        }

        // 방법 2: DOM에서 카카오맵 컨테이너 찾기
        const targetDiv = document.querySelector('div[style*="width"][style*="height"]') as HTMLElement ||
            document.querySelector('.w-full.h-full') as HTMLElement;

        if (targetDiv && window.kakao?.maps) {
            console.log('🗺️ 지도 컨테이너 발견:', targetDiv);

            // 이미 지도가 있는지 확인
            if ((targetDiv as any)._map) {
                console.log('✅ 기존 지도 발견:', (targetDiv as any)._map);
                return (targetDiv as any)._map;
            }

            try {
                // 새 지도 생성
                const newMap = new window.kakao.maps.Map(targetDiv, {
                    center: new window.kakao.maps.LatLng(37.5665, 126.978),
                    level: 3,
                });
                console.log('✅ 새 지도 생성 성공:', newMap);

                // DOM에 저장
                (targetDiv as any)._map = newMap;

                return newMap;
            } catch (error) {
                console.error('❌ 지도 생성 실패:', error);
            }
        }

        console.log('❌ 카카오맵 객체를 찾을 수 없음');
        return null;
    }, [map]);

    // 🎯 카카오맵 드로잉 도구 초기화
    useEffect(() => {
        console.log('🔍 드로잉 useEffect 실행');
        console.log('조건:', {
            canUseAreaRecommendation,
            isDrawingMode,
            activeTab
        });

        if (!canUseAreaRecommendation) {
            console.log('❌ 범위 추천 사용 불가');
            return;
        }

        if (!isDrawingMode) {
            console.log('ℹ️ 드로잉 모드 아님');
            return;
        }

        // 실제 지도 객체 찾기
        const actualMap = findKakaoMap();

        if (!actualMap) {
            console.log('❌ 지도를 찾을 수 없음');
            alert('지도를 찾을 수 없습니다. 페이지를 새로고침 해주세요.');
            setIsDrawingMode(false);
            return;
        }

        console.log('✅ 드로잉 시작, 사용할 지도:', actualMap);

        let drawingManager: any;

        try {
            drawingManager = new window.kakao.maps.drawing.DrawingManager({
                map: actualMap,
                drawingMode: [
                    drawingType === 'rectangle'
                        ? window.kakao.maps.drawing.OverlayType.RECTANGLE
                        : window.kakao.maps.drawing.OverlayType.CIRCLE
                ],
                guideTooltip: ['클릭 후 드래그하여 영역을 선택하세요'],
                rectangleOptions: {
                    draggable: true,
                    removable: true,
                    editable: true,
                    strokeColor: '#2563eb',
                    strokeOpacity: 1,
                    strokeWeight: 3,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                },
                circleOptions: {
                    draggable: true,
                    removable: true,
                    editable: true,
                    strokeColor: '#2563eb',
                    strokeOpacity: 1,
                    strokeWeight: 3,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2
                }
            });

            console.log('✅ 드로잉 매니저 생성 성공:', drawingManager);

            // 드로잉 완료 이벤트
            window.kakao.maps.event.addListener(drawingManager, 'drawend', (mouseEvent: any) => {
                console.log('🎉 드로잉 완료!', mouseEvent);

                const data = mouseEvent.target;
                let polygon: PolygonPoint[] = [];

                if (drawingType === 'rectangle') {
                    const bounds = data.getBounds();
                    const sw = bounds.getSouthWest();
                    const ne = bounds.getNorthEast();

                    polygon = [
                        { lat: sw.getLat(), lng: sw.getLng() },
                        { lat: sw.getLat(), lng: ne.getLng() },
                        { lat: ne.getLat(), lng: ne.getLng() },
                        { lat: ne.getLat(), lng: sw.getLng() }
                    ];
                } else if (drawingType === 'circle') {
                    const center = data.getCenter();
                    const radius = data.getRadius();
                    const points = 16;

                    for (let i = 0; i < points; i++) {
                        const angle = (i / points) * 2 * Math.PI;
                        const lat = center.getLat() + (radius / 111000) * Math.cos(angle);
                        const lng = center.getLng() + (radius / (111000 * Math.cos(center.getLat() * Math.PI / 180))) * Math.sin(angle);
                        polygon.push({ lat, lng });
                    }
                }

                console.log('📍 생성된 폴리곤:', polygon);
                setDrawnArea(polygon);
                setDrawnOverlay(data);
                setIsDrawingMode(false);
            });

            // 커서 변경
            const mapContainer = actualMap.getNode();
            if (mapContainer) {
                mapContainer.style.cursor = 'crosshair';
                console.log('🖱️ 커서 crosshair로 변경');
            }

        } catch (error: any) {
            console.error('❌ 드로잉 매니저 생성 오류:', error);
            setIsDrawingMode(false);
            alert('드로잉 생성 실패: ' + (error?.message || '알 수 없는 오류'));
        }

        return () => {
            console.log('🧹 드로잉 정리 시작');
            if (drawingManager) {
                try {
                    drawingManager.cancel();
                    drawingManager.remove();
                    console.log('✅ 드로잉 매니저 정리 완료');
                } catch (e) {
                    console.warn('드로잉 매니저 정리 중 오류:', e);
                }
            }

            const actualMap = findKakaoMap();
            if (actualMap) {
                const mapContainer = actualMap.getNode();
                if (mapContainer) {
                    mapContainer.style.cursor = 'grab';
                    console.log('🖱️ 커서 grab으로 원복');
                }
            }
        };
    }, [isDrawingMode, drawingType, canUseAreaRecommendation, findKakaoMap]);

    // 나머지 함수들은 이전과 동일...
    const handleAreaIndustrySelect = (categoryData: CategoryData) => {
        setAreaCategory(categoryData.상권업종소분류명);
        setShowAreaIndustryModal(false);
    };

    const handleClearAreaCategory = () => {
        setAreaCategory('');
    };

    const clearDrawnArea = () => {
        if (drawnOverlay) {
            drawnOverlay.setMap(null);
            setDrawnOverlay(null);
        }
        setDrawnArea(null);
    };

    const getStoresInArea = (polygon: PolygonPoint[], category: string) => {
        const filteredStores = stores.filter(store => {
            if (category) {
                const storeCategoryName = store.categoryName || store.bizCategoryCode || '';
                if (!storeCategoryName.includes(category)) return false;
            }

            const lat = store.lat;
            const lng = store.lng;
            if (!lat || !lng) return false;

            return isPointInPolygon({ lat, lng }, polygon);
        });

        const uniqueStores = filteredStores.reduce((acc, store) => {
            const key = `${store.lat?.toFixed(5)}_${store.lng?.toFixed(5)}`;
            if (!acc.find(s => `${s.lat?.toFixed(5)}_${s.lng?.toFixed(5)}` === key)) {
                acc.push(store);
            }
            return acc;
        }, [] as typeof stores);

        return uniqueStores.slice(0, 20);
    };

    const isPointInPolygon = (point: PolygonPoint, polygon: PolygonPoint[]) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (
                polygon[i].lat > point.lat !== polygon[j].lat > point.lat &&
                point.lng < ((polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat)) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng
            ) {
                inside = !inside;
            }
        }
        return inside;
    };

    const handleAreaAnalysis = async () => {
        if (!drawnArea || !canUseAreaRecommendation) return;

        setIsAreaAnalyzing(true);
        try {
            const storesInArea = getStoresInArea(drawnArea, areaCategory);

            const analysisData: AreaAnalysisData = {
                polygon: drawnArea,
                category: areaCategory || ''
            };

            console.log('전송할 데이터:', analysisData);
            console.log('영역 내 상가 수:', storesInArea.length);

            alert(`분석 완료! 영역 내 상가 ${storesInArea.length}개 발견`);
        } catch (error) {
            console.error('범위 분석 오류:', error);
            alert('범위 분석 중 오류가 발생했습니다.');
        } finally {
            setIsAreaAnalyzing(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Square className="w-4 h-4" />
                        범위 추천 분석
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 사용 조건 체크 */}
                    {!hasStoreData && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">상가 데이터를 먼저 로딩해주세요</span>
                            </div>
                        </div>
                    )}

                    {!isValidZoom && hasStoreData && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">지도를 더 확대해주세요 (축적 2레벨 이하)</span>
                            </div>
                        </div>
                    )}

                    {/* 드로잉 타입 선택 */}
                    <div className="space-y-2">
                        <Label className="text-xs mb-2 block">영역 그리기 도구</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={() => setDrawingType('rectangle')}
                                disabled={!canUseAreaRecommendation}
                                className={`h-12 transition-all duration-200 ${
                                    drawingType === 'rectangle'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                                variant={drawingType === 'rectangle' ? 'default' : 'outline'}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Square className="w-4 h-4" />
                                    <span className="text-xs font-medium">사각형</span>
                                </div>
                            </Button>
                            <Button
                                onClick={() => setDrawingType('circle')}
                                disabled={!canUseAreaRecommendation}
                                className={`h-12 transition-all duration-200 ${
                                    drawingType === 'circle'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                                variant={drawingType === 'circle' ? 'default' : 'outline'}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Circle className="w-4 h-4" />
                                    <span className="text-xs font-medium">원형</span>
                                </div>
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {drawingType === 'rectangle' ? '📐 사각형으로 영역을 선택합니다' : '⭕ 원형으로 영역을 선택합니다'}
                        </p>
                    </div>

                    {/* 업종 선택 (필수) */}
                    <div>
                        <Label className="text-xs mb-2 block">
                            분석할 업종 <span className="text-red-500">*</span>
                        </Label>
                        <button
                            onClick={() => setShowAreaIndustryModal(true)}
                            disabled={!canUseAreaRecommendation}
                            className={`w-full p-2 text-left border rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors ${
                                !areaCategory ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        >
                            <span className={`text-sm ${!areaCategory ? 'text-red-500' : 'text-gray-800'}`}>
                                {areaCategory || '업종을 반드시 선택해주세요'}
                            </span>
                        </button>

                        {areaCategory && (
                            <button
                                onClick={handleClearAreaCategory}
                                className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                                선택 해제
                            </button>
                        )}

                        {!areaCategory && (
                            <p className="text-xs text-red-500 mt-1">
                                ⚠️ 범위 추천 분석에는 업종 선택이 필수입니다
                            </p>
                        )}
                    </div>

                    {/* 드로잉 버튼 */}
                    <Button
                        onClick={() => setIsDrawingMode(true)}
                        disabled={!canUseAreaRecommendation || isDrawingMode || !areaCategory}
                        className={`w-full transition-all duration-200 ${
                            isDrawingMode
                                ? 'bg-yellow-500 text-white'
                                : !areaCategory
                                    ? 'bg-gray-400 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        size="lg"
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isDrawingMode ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>영역을 드래그하여 선택하세요</span>
                                </>
                            ) : !areaCategory ? (
                                <>
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>업종을 먼저 선택해주세요</span>
                                </>
                            ) : (
                                <>
                                    {drawingType === 'rectangle' ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                    <span>{drawingType === 'rectangle' ? '사각형' : '원형'} 영역 그리기</span>
                                </>
                            )}
                        </div>
                    </Button>

                    {/* 드로잉 모드 상태 표시 */}
                    {isDrawingMode && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">
                                        {drawingType === 'rectangle' ? '📐 사각형 그리기 모드' : '⭕ 원형 그리기 모드'}
                                    </span>
                                </div>
                                <Button
                                    onClick={() => setIsDrawingMode(false)}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-6"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                지도에서 클릭 후 드래그하여 {drawingType === 'rectangle' ? '사각형' : '원형'} 영역을 선택하세요
                            </p>
                        </div>
                    )}

                    {/* 선택된 영역 정보 */}
                    {drawnArea && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-green-700">
                                    {drawingType === 'rectangle' ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                    <span className="text-sm font-medium">영역이 선택되었습니다</span>
                                </div>
                                <Button
                                    onClick={clearDrawnArea}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-6"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                            <div className="text-xs text-green-600">
                                <p>• 선택된 영역: {drawnArea.length}개 좌표점</p>
                                <p>• 예상 상가 수: {getStoresInArea(drawnArea, areaCategory).length}개</p>
                                <p>• 영역 타입: {drawingType === 'rectangle' ? '사각형' : '원형'}</p>
                            </div>
                        </div>
                    )}

                    {/* 분석 실행 버튼 */}
                    {drawnArea && areaCategory && (
                        <Button
                            onClick={handleAreaAnalysis}
                            disabled={isAreaAnalyzing || !areaCategory}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                            size="lg"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                {isAreaAnalyzing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        범위 분석 중...
                                    </>
                                ) : (
                                    '범위 분석 실행'
                                )}
                            </div>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* 범위 분석 업종 선택 모달 */}
            <IndustrySelectModal
                isOpen={showAreaIndustryModal}
                onClose={() => setShowAreaIndustryModal(false)}
                onSelect={handleAreaIndustrySelect}
                title="범위 분석할 업종 선택"
                aiRecommendations={myRecommendationsForModal}
            />
        </>
    );
}
