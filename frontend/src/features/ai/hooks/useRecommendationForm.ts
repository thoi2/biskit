import { useState, useCallback } from 'react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRecommendationStore } from '@/features/ai/store';
import { getSingleRecommendation, getSingleIndustryRecommendation } from '@/features/ai/api';

// 타입 정의
interface CategoryResult {
  category: string;
  survivalRate: number;
}

interface RecommendationResult {
  building: {
    building_id: number;
    lat: number;
    lng: number;
  };
  result: CategoryResult[];
  meta: {
    source: string;
    version: string;
    last_at: string;
  };
}

export function useRecommendationForm() {
  const [category, setCategory] = useState<string>('');
  const { coordinates } = useMapStore(); // 🎯 지도는 좌표만

  const {
    isLoading,
    startRequest,
    setRequestSuccess,
    setRequestError,
    setRecommendationMarkers // 🎯 추천 스토어에서 마커 관리
  } = useRecommendationStore();

  const handleSubmit = useCallback(async () => {
    if (!coordinates.lat || !coordinates.lng) {
      alert('분석할 위치를 선택해주세요.');
      return;
    }

    // 🎯 스토어에서 로딩 시작 (기존 마커도 초기화)
    startRequest();

    try {
      let result: RecommendationResult;

      if (category) {
        // 🎯 단일+업종 분석
        console.log('🚀 단일+업종 분석 요청:', {
          lat: coordinates.lat,
          lng: coordinates.lng,
          categoryName: category
        });

        result = await getSingleIndustryRecommendation({
          lat: coordinates.lat,
          lng: coordinates.lng,
          categoryName: category
        });

        console.log('✅ 단일+업종 분석 결과:', result);
      } else {
        // 🎯 단일 분석
        console.log('🚀 단일 분석 요청:', {
          lat: coordinates.lat,
          lng: coordinates.lng
        });

        result = await getSingleRecommendation({
          lat: coordinates.lat,
          lng: coordinates.lng
        });

        console.log('✅ 단일 분석 결과:', result);
      }

      // 🎯 추천 결과 저장
      setRequestSuccess(result);

      // 🎯 추천 마커 생성 및 저장
      const marker = {
        id: `ai-${result.building.building_id}`,
        lat: result.building.lat,
        lng: result.building.lng,
        type: 'recommendation' as const,
        title: `AI 추천 #${result.building.building_id}`,
        category: result.result[0]?.category || '분석 결과',
        survivalRate: result.result[0]?.survivalRate || 0,
        buildingId: result.building.building_id
      };

      setRecommendationMarkers([marker]);

      console.log('🗺️ 추천 마커 생성:', marker);

      // 🎯 성공 메시지
      const resultText = result.result.map((r: CategoryResult) =>
          `${r.category}: ${(r.survivalRate * 100).toFixed(1)}%`
      ).join('\n');

      const analysisType = category ? '단일+업종' : '단일';
      alert(`✅ ${analysisType} 분석 완료!\n\n` +
          `📍 위치: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}\n` +
          `${category ? `🎯 업종: ${category}\n` : ''}` +
          `🏢 건물 ID: ${result.building.building_id}\n` +
          `🔄 Source: ${result.meta.source}\n\n` +
          `📊 생존율 분석:\n${resultText}\n\n` +
          `🗺️ 지도에 마커가 표시되었습니다!\n` +
          `👉 자세한 결과는 결과 탭에서 확인하세요!`);

      return result;
    } catch (error: any) {
      console.error('분석 오류:', error);
      setRequestError(error.response?.data?.message || error.message);
      alert(`❌ 분석 실패\n\n${error.response?.data?.message || error.message}`);
    }
  }, [coordinates, category, startRequest, setRequestSuccess, setRequestError, setRecommendationMarkers]);

  return {
    category,
    setCategory,
    isLoading,
    handleSubmit
  };
}
