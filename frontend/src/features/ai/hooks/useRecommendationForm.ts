// features/ai/hooks/useRecommendationForm.ts

import { useState } from 'react';
import { useMapStore } from '@/features/map/store/mapStore';
import { useRequestRecommendation } from '@/features/ai/hooks/useRecommendation';

export function useRecommendationForm() {
  // 1. 폼 입력 상태 관리
  const { coordinates, setCoordinates } = useMapStore();
  // const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [category, setCategory] = useState('');

  // 2. 외부 훅 연동
  const { setActiveTab } = useMapStore();
  const { singleRecommendation, singleIndustryRecommendation } =
    useRequestRecommendation();

  // 3. 로딩 상태 통합 (두 뮤테이션 중 하나라도 진행 중이면 true)
  const isLoading =
    singleRecommendation.isPending || singleIndustryRecommendation.isPending;

  // 4. 에러 상태 통합
  const error =
    singleRecommendation.error || singleIndustryRecommendation.error;

  // 5. 폼 제출 핸들러 (모든 로직을 포함)
  const handleSubmit = () => {
    const lat =
      coordinates.lat !== null
        ? Math.trunc(coordinates.lat * 1e12) / 1e12
        : null;

    const lng =
      coordinates.lng !== null
        ? Math.trunc(coordinates.lng * 1e12) / 1e12
        : null;

    // 1. null 값인지 먼저 확인합니다.
    if (lat === null || lng === null) {
      alert('정확한 위도와 경도를 입력해주세요.');
      return;
    }

    const mutationOptions = {
      onSuccess: () => {
        // 성공 시 결과 탭으로 이동
        setActiveTab('result');
      },
    };

    if (category) {
      singleIndustryRecommendation.mutate(
        { lat, lng, category },
        mutationOptions,
      );
    } else {
      singleRecommendation.mutate({ lat, lng }, mutationOptions);
    }
  };

  // 6. 컴포넌트에서 사용할 모든 것을 반환
  return {
    coordinates,
    setCoordinates,
    category,
    setCategory,
    isLoading,
    error,
    handleSubmit,
  };
}
