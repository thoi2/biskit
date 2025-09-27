import { useState, useCallback } from 'react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationStore } from '@/features/ai/store';
import { getSingleRecommendation, getSingleIndustryRecommendation, getRangeRecommendation } from '@/features/ai/api';

// 🎯 좌표 포맷팅 유틸리티 함수
const formatCoordinateForDB = (coord: number): number => {
  return parseFloat(coord.toFixed(12));
};

export function useRecommendationForm() {
  const [category, setCategory] = useState<string>('');
  const {
    coordinates,
    setActiveTab,
    setHighlightedRecommendation
  } = useMapStore();

  const {
    isLoading,
    startRequest,
    setRequestError,
    addSingleResult,
    highlightMarker
  } = useRecommendationStore();

  // ✅ 기존 단일 분석 (handleSubmit)
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
          category: category.trim()
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

      // ✅ 필드명 호환성 확인 및 변환
      if (result && result.result) {
        // ✅ 백엔드 응답의 survival_rate → survivalRate 변환
        result.result = result.result.map((item: any) => ({
          category: item.category,
          survivalRate: item.survival_rate || item.survivalRate, // ✅ 호환성 보장
        }));

        console.log('🔄 필드명 변환 완료:', result.result);
      }

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

      // ✅ 백엔드 검증 오류 처리
      let errorMessage = '알 수 없는 오류가 발생했습니다.';

      if (error.response?.status === 400) {
        // 검증 오류일 경우
        if (error.response?.data?.details) {
          // ValidationError 배열 처리
          const validationErrors = error.response.data.details
              .map((err: any) => `• ${err.field}: ${err.message}`)
              .join('\n');
          errorMessage = `입력값 검증 실패:\n${validationErrors}`;
        } else {
          errorMessage = error.response?.data?.message || '잘못된 요청입니다.';
        }
      } else {
        errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            '알 수 없는 오류가 발생했습니다.';
      }

      setRequestError(errorMessage);

      // ✅ 에러 시에만 Alert 사용
      alert(`❌ 분석 실패\n\n${errorMessage}\n\n` +
          `💡 확인사항:\n` +
          `- 업종명이 올바르게 입력되었는지 확인\n` +
          `- 좌표가 유효한 범위인지 확인\n` +
          `- 네트워크 연결 상태 확인\n` +
          `- 잠시 후 다시 시도해보세요`);
    }
  }, [
    coordinates,
    category,
    startRequest,
    setRequestError,
    addSingleResult,
    highlightMarker,
    setActiveTab,
    setHighlightedRecommendation
  ]);

  // ✅ 새로운 범위 분석 함수 (상가 좌표를 polygon에 전송)
  const handleRangeSubmit = useCallback(async (areaInfo: any) => {
    if (!areaInfo) {
      alert('분석할 영역을 그려주세요.');
      return;
    }

    if (!category || !category.trim()) {
      alert('분석할 업종을 선택해주세요.');
      return;
    }

    if (!areaInfo?.isValid) {
      alert('유효하지 않은 영역입니다.');
      return;
    }

    // ✅ 상가 데이터 확인
    if (!areaInfo?.stores || areaInfo.stores.length === 0) {
      alert('선택한 영역에 상가가 없습니다.');
      return;
    }

    console.log('🚀 [범위 분석] 시작:', {
      category: category,
      영역내상가: areaInfo.stores.length + '개'
    });

    startRequest();

    try {
      // ✅ 영역 내 상가들의 좌표를 polygon에 넣어서 전송
      const storeCoordinates = areaInfo.stores.map((store: any) => {
        const formattedLat = formatCoordinateForDB(store.lat);
        const formattedLng = formatCoordinateForDB(store.lng);

        if (formattedLat < -90 || formattedLat > 90) {
          throw new Error(`위도는 -90.0 ~ 90.0 범위여야 합니다: ${formattedLat}`);
        }
        if (formattedLng < -180 || formattedLng > 180) {
          throw new Error(`경도는 -180.0 ~ 180.0 범위여야 합니다: ${formattedLng}`);
        }

        return {
          lat: formattedLat,
          lng: formattedLng
        };
      });

      const rangeRequest = {
        // ✅ polygon에 상가들의 좌표만 넣음
        polygon: storeCoordinates,
        category: category.trim()
      };

      console.log('📤 [범위 분석] 실제 전송 데이터:', {
        업종: rangeRequest.category,
        상가좌표개수: rangeRequest.polygon.length,
        첫3개샘플: rangeRequest.polygon.slice(0, 3)
      });

      const apiResponse = await getRangeRecommendation(rangeRequest);
      console.log('📥 [범위 분석] API 응답:', apiResponse);

      // ✅ API 응답 파싱
      let items: any[] = [];
      const responseData = apiResponse as any;

      if (responseData?.body?.items && Array.isArray(responseData.body.items)) {
        items = responseData.body.items;
        console.log('📥 [범위 분석] body.items 구조 감지, items 개수:', items.length);
      } else if (responseData?.body && Array.isArray(responseData.body)) {
        items = responseData.body;
        console.log('📥 [범위 분석] body 배열 구조 감지, items 개수:', items.length);
      } else if (Array.isArray(responseData)) {
        items = responseData;
        console.log('📥 [범위 분석] 직접 배열 구조 감지, items 개수:', items.length);
      } else {
        throw new Error('범위 분석 응답 구조를 인식할 수 없습니다.');
      }

      console.log(`✅ [범위 분석] ${items.length}개 결과 파싱 완료`);

      if (items.length === 0) {
        alert('해당 조건에 맞는 추천 입지를 찾을 수 없습니다.');
        return;
      }

      // ✅ 각 item을 addSingleResult 형태로 변환해서 저장
      items.forEach((item: any) => {
        console.log(`📝 [범위→단일] 변환 중:`, item);

        // ✅ addSingleResult 호환 형태로 변환
        const singleResult = {
          building: {
            building_id: item.building_id || item.buildingId,
            lat: item.lat,
            lng: item.lng
          },
          result: [{
            category: item.category,
            survivalRate: item.survival_rate || item.survivalRate // ✅ 필드명 호환성
          }],
          meta: {
            last_at: new Date().toISOString()
          }
        };

        console.log('🔄 [범위→단일] 변환 완료:', singleResult);

        // ✅ 기존 addSingleResult 로직 사용 (중복 체크 + 병합 자동)
        addSingleResult(singleResult as any);
        console.log(`✅ [범위→단일] 저장 완료: 건물 ${singleResult.building.building_id}`);
      });

      // ✅ 기존과 동일한 후처리
      setTimeout(() => {
        console.log('🚀 [범위 분석] 완료 후 처리');

        // 결과 탭으로 이동
        setActiveTab('result');
        console.log('📋 [범위 분석] 결과 탭 이동');

        // 첫 번째 결과 하이라이트
        if (items.length > 0) {
          const firstItem = items[0];
          const buildingId = firstItem.building_id || firstItem.buildingId;

          setTimeout(() => {
            setHighlightedRecommendation(String(buildingId));
            highlightMarker(buildingId);
            console.log('✨ [범위 분석] 하이라이트:', buildingId);
          }, 300);
        }

        // 성공 알림
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('✅ 범위 분석 완료!', {
            body: `${category} 업종 - ${items.length}개 추천 입지`,
            icon: '/favicon.ico',
            tag: 'range-analysis'
          });
        }
      }, 200);

      return items;

    } catch (error: any) {
      console.error('❌ [범위 분석] 실패:', error);

      let errorMessage = '범위 분석 중 오류가 발생했습니다.';

      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || '잘못된 요청입니다.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setRequestError(errorMessage);
      alert(`❌ 범위 분석 실패\n\n${errorMessage}`);
    }
  }, [
    category,
    startRequest,
    setRequestError,
    addSingleResult,
    setActiveTab,
    setHighlightedRecommendation,
    highlightMarker
  ]);

  return {
    category,
    setCategory,
    isLoading,
    handleSubmit,        // ✅ 기존 단일 분석
    handleRangeSubmit    // ✅ 새로운 범위 분석
  };
}
