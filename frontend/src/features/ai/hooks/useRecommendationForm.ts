import { useState, useCallback } from 'react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationStore } from '@/features/ai/store';
import { getSingleRecommendation, getSingleIndustryRecommendation } from '@/features/ai/api';

// 🎯 좌표 포맷팅 유틸리티 함수
const formatCoordinateForDB = (coord: number): number => {
  return parseFloat(coord.toFixed(12));
};

export function useRecommendationForm() {
  const [category, setCategory] = useState<string>('');
  const {
    coordinates,
    setActiveTab,                    // ✅ 탭 이동
    setHighlightedRecommendation     // ✅ 하이라이트 (추가)
  } = useMapStore();

  const {
    isLoading,
    startRequest,
    setRequestError,
    addSingleResult,     // ✅ 새로운 스토어 함수 사용
    highlightMarker      // ✅ 마커 하이라이트
  } = useRecommendationStore();

  const handleSubmit = useCallback(async () => {
    if (!coordinates.lat || !coordinates.lng) {
      alert('분석할 위치를 선택해주세요.');
      return;
    }

    const formattedLat = formatCoordinateForDB(coordinates.lat);
    const formattedLng = formatCoordinateForDB(coordinates.lng);

    // 🎯 백엔드 validation 범위 체크
    if (formattedLat < -90 || formattedLat > 90) {
      alert('위도는 -90.0 ~ 90.0 범위여야 합니다.');
      return;
    }
    if (formattedLng < -180 || formattedLng > 180) {
      alert('경도는 -180.0 ~ 180.0 범위여야 합니다.');
      return;
    }

    console.log('📍 원본 좌표:', { lat: coordinates.lat, lng: coordinates.lng });
    console.log('📍 포맷된 좌표:', { lat: formattedLat, lng: formattedLng });

    startRequest();

    try {
      let apiResponse: any;

      if (category && category.trim()) {
        // 🎯 단일 업종 분석 API
        const industryRequest = {
          lat: formattedLat,
          lng: formattedLng,
          categoryName: category.trim()
        };

        console.log('🎯 단일 업종 분석 요청:', industryRequest);
        apiResponse = await getSingleIndustryRecommendation(industryRequest);
        console.log('✅ 단일 업종 분석 응답:', apiResponse);

      } else {
        // 🎯 다중 분석 API
        const singleRequest = {
          lat: formattedLat,
          lng: formattedLng
        };

        console.log('🌟 다중 분석 요청:', singleRequest);
        apiResponse = await getSingleRecommendation(singleRequest);
        console.log('✅ 다중 분석 응답:', apiResponse);
      }

      // 🎯 ApiResponse<RecommendResponse>에서 실제 데이터 추출
      const result = apiResponse?.body || apiResponse;

      console.log('🔍 추출된 결과:', result);
      console.log('🔍 결과 타입:', category ? '단일 업종 분석' : '다중 분석');
      console.log('🔍 결과 개수:', result?.result?.length);

      // ✅ 새로운 스토어 시스템 사용 (중복 방지 + 순위 재계산)
      addSingleResult(result as any);

      // ✅ 분석 완료 후 자동 처리
      setTimeout(() => {
        console.log('🚀 분석 완료 후 처리 시작');

        // 1. 결과 탭으로 이동
        setActiveTab('result');
        console.log('📋 결과 탭으로 이동 완료');

        // 2. 해당 결과 하이라이트 (탭 이동 후 추가 딜레이)
        setTimeout(() => {
          if (result?.building?.building_id) {
            // ✅ 두 곳에서 하이라이트 처리
            setHighlightedRecommendation(String(result.building.building_id));
            highlightMarker(result.building.building_id);
            console.log('✨ 하이라이트 시작:', result.building.building_id);
          }
        }, 300);

        // 성공 알림을 더 부드럽게 처리 (선택사항)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const resultCount = result?.result?.length || 0;
          const analysisType = category ? `업종 분석 (${category})` : '다중 분석';

          new Notification('✅ 분석 완료!', {
            body: `${analysisType} - ${resultCount}개 결과`,
            icon: '/favicon.ico',
            tag: 'ai-analysis'
          });
        }
      }, 200);

      return result;

    } catch (error: any) {
      console.error('❌ 분석 실패:', error);
      console.error('❌ 에러 상세:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      const errorMessage = error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          '알 수 없는 오류가 발생했습니다.';

      setRequestError(errorMessage);

      // ✅ 에러 시에만 Alert 사용
      alert(`❌ 분석 실패\n\n${errorMessage}\n\n` +
          `💡 확인사항:\n` +
          `- 좌표가 유효한 범위인지 확인\n` +
          `- 네트워크 연결 상태 확인\n` +
          `- 잠시 후 다시 시도해보세요`);
    }
  }, [
    coordinates,
    category,
    startRequest,
    setRequestError,
    addSingleResult,    // ✅ 변경
    highlightMarker,    // ✅ 추가
    setActiveTab,
    setHighlightedRecommendation
  ]);

  return {
    category,
    setCategory,
    isLoading,
    handleSubmit
  };
}
