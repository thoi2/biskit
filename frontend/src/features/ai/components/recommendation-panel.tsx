// features/ai/components/RecommendationPanel.tsx

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Label } from '@/lib/components/ui/label';
import { Target, BarChart3 } from 'lucide-react';
import { useRecommendationForm } from '../hooks/useRecommendationForm'; // ✅ 1. 새로 만든 폼 훅 import
import { CategorySearch } from './CategorySearch'; // ✅ 2. 업종 검색 UI를 별도 컴포넌트로 분리 (선택사항)
import { useMapStore } from '@/features/map/store/mapStore';

export function RecommendationPanel() {
  // ✅ 3. 훅을 호출하여 상태와 함수를 모두 가져옴
  const { category, setCategory, isLoading, error, handleSubmit } =
    useRecommendationForm();
  const { coordinates, setCoordinates } = useMapStore();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            추천 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  단일 좌표 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 위도/경도 입력 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lat" className="text-xs">
                      위도
                    </Label>
                    <Input
                      id="lat"
                      placeholder="37.5665"
                      value={coordinates.lat ?? ''} // null일 경우 빈 문자열로 표시
                      onChange={e => {
                        const value = e.target.value;
                        // 입력값이 비어있으면 null로, 아니면 숫자로 변환하여 저장
                        const numericValue =
                          value === '' ? null : parseFloat(value);

                        // 숫자 형태가 아니거나(예: 'abc'), 범위를 벗어나는 값은 저장하지 않음 (선택 사항)
                        if (value !== '' && Number.isNaN(numericValue)) {
                          return;
                        }

                        // 🔥 핵심: 기존 coordinates 상태를 기반으로 새로운 객체를 만듭니다.
                        const newCoordinates = {
                          ...coordinates, // 기존 lng 값은 그대로 유지합니다.
                          lat: numericValue, // lat 값만 새로 업데이트합니다.
                        };

                        // 🔥 새로 만든 완벽한 형태의 Coordinates 객체를 액션에 전달합니다.
                        setCoordinates(newCoordinates);
                      }}
                      className="text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng" className="text-xs">
                      경도
                    </Label>
                    <Input
                      id="lng"
                      placeholder="126.9780"
                      value={coordinates.lat ?? ''} // null일 경우 빈 문자열로 표시
                      onChange={e => {
                        const value = e.target.value;
                        // 입력값이 비어있으면 null로, 아니면 숫자로 변환하여 저장
                        const numericValue =
                          value === '' ? null : parseFloat(value);

                        // 숫자 형태가 아니거나(예: 'abc'), 범위를 벗어나는 값은 저장하지 않음 (선택 사항)
                        if (value !== '' && Number.isNaN(numericValue)) {
                          return;
                        }

                        // 🔥 핵심: 기존 coordinates 상태를 기반으로 새로운 객체를 만듭니다.
                        const newCoordinates = {
                          ...coordinates, // 기존 lng 값은 그대로 유지합니다.
                          l: numericValue, // lat 값만 새로 업데이트합니다.
                        };

                        // 🔥 새로 만든 완벽한 형태의 Coordinates 객체를 액션에 전달합니다.
                        setCoordinates(newCoordinates);
                      }}
                      className="text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 업종 검색 UI */}
                <CategorySearch
                  selectedCategory={category}
                  onSelectCategory={setCategory}
                  disabled={isLoading}
                />

                {/* 분석 실행 버튼 */}
                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? '분석 중...' : '분석 실행'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 안내 및 에러 메시지 */}
      <Card className="border-orange-200">
        <CardContent className="p-4 bg-orange-50">
          <p className="text-sm text-orange-700 text-center">
            분석 결과는 <strong>결과 탭</strong>에서 확인하세요
          </p>
        </CardContent>
      </Card>
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4 bg-red-50">
            <p className="text-sm text-red-700 text-center">
              오류: {error.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
