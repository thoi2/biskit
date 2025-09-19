'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Label } from '@/lib/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/components/ui/select';
import {
  MapPin,
  Target,
  Circle,
  Building2,
  Map,
  BarChart3,
} from 'lucide-react';

interface RecommendationPanelProps {
  onAnalysisRequest: (analysisType: string, params: any) => void;
  setActiveTab: (tab: string) => void;
}

export function RecommendationPanel({
  onAnalysisRequest,
  setActiveTab,
}: RecommendationPanelProps) {
  const [activeAnalysis, setActiveAnalysis] = useState('single');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [businessType, setBusinessType] = useState('');
  const [rangeRadius, setRangeRadius] = useState('1000');
  const [resultCount, setResultCount] = useState('5');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const districts = [
    '강남구',
    '서초구',
    '송파구',
    '강동구',
    '마포구',
    '용산구',
    '중구',
    '종로구',
  ];
  const neighborhoods = [
    '역삼동',
    '논현동',
    '청담동',
    '삼성동',
    '대치동',
    '개포동',
    '잠실동',
    '신천동',
  ];
  const businessTypes = [
    '카페',
    '음식점',
    '미용실',
    '편의점',
    '의류매장',
    '화장품매장',
    '학원',
    '병원',
  ];

  const handleSingleAnalysis = async () => {
    if (!coordinates.lat || !coordinates.lng) return;
    setIsAnalyzing(true);

    try {
      await onAnalysisRequest('single', { coordinates, businessType });
      setActiveTab('result');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRangeAnalysis = async () => {
    if (!coordinates.lat || !coordinates.lng) return;
    setIsAnalyzing(true);

    try {
      await onAnalysisRequest('range', {
        coordinates,
        businessType,
        radius: rangeRadius,
        count: resultCount,
      });
      setActiveTab('result');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSeoulAnalysis = async () => {
    if (!businessType) return;
    setIsAnalyzing(true);

    try {
      await onAnalysisRequest('seoul', { businessType, count: resultCount });
      setActiveTab('result');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDistrictAnalysis = async () => {
    if (!selectedDistrict || !businessType) return;
    setIsAnalyzing(true);

    try {
      await onAnalysisRequest('district', {
        district: selectedDistrict,
        businessType,
        count: resultCount,
      });
      setActiveTab('result');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNeighborhoodAnalysis = async () => {
    if (!selectedNeighborhood || !businessType) return;
    setIsAnalyzing(true);

    try {
      await onAnalysisRequest('neighborhood', {
        neighborhood: selectedNeighborhood,
        businessType,
        count: resultCount,
      });
      setActiveTab('result');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
          {/* 통일된 탭 스타일 */}
          <div className="flex gap-2 mb-4 p-1 bg-orange-100 rounded-xl">
            <Button
              variant={activeAnalysis === 'single' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveAnalysis('single')}
              className={`flex-1 transition-all duration-300 ${
                activeAnalysis === 'single'
                  ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                  : 'hover:bg-orange-200 text-orange-700'
              }`}
            >
              단일/범위
            </Button>
            <Button
              variant={activeAnalysis === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveAnalysis('area')}
              className={`flex-1 transition-all duration-300 ${
                activeAnalysis === 'area'
                  ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                  : 'hover:bg-orange-200 text-orange-700'
              }`}
            >
              지역별
            </Button>
          </div>

          {/* 단일/범위 탭 콘텐츠 */}
          {activeAnalysis === 'single' && (
            <div className="space-y-4 mt-4">
              {/* Single Coordinate Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    단일 좌표 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="lat" className="text-xs">
                        위도
                      </Label>
                      <Input
                        id="lat"
                        placeholder="37.5665"
                        value={coordinates.lat}
                        onChange={e =>
                          setCoordinates(prev => ({
                            ...prev,
                            lat: e.target.value,
                          }))
                        }
                        className="text-sm"
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng" className="text-xs">
                        경도
                      </Label>
                      <Input
                        id="lng"
                        placeholder="126.9780"
                        value={coordinates.lng}
                        onChange={e =>
                          setCoordinates(prev => ({
                            ...prev,
                            lng: e.target.value,
                          }))
                        }
                        className="text-sm"
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="business-type" className="text-xs">
                      업종 (선택사항)
                    </Label>
                    <Select
                      value={businessType}
                      onValueChange={setBusinessType}
                      disabled={isAnalyzing}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="업종 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSingleAnalysis}
                    className="btn-orange"
                    size="sm"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? '분석 중...' : '단일 분석 실행'}
                  </Button>
                </CardContent>
              </Card>

              {/* Range Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Circle className="w-4 h-4" />
                    범위 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="radius" className="text-xs">
                        반경 (m)
                      </Label>
                      <Select
                        value={rangeRadius}
                        onValueChange={setRangeRadius}
                        disabled={isAnalyzing}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500m</SelectItem>
                          <SelectItem value="1000">1km</SelectItem>
                          <SelectItem value="2000">2km</SelectItem>
                          <SelectItem value="5000">5km</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="count" className="text-xs">
                        결과 개수
                      </Label>
                      <Select
                        value={resultCount}
                        onValueChange={setResultCount}
                        disabled={isAnalyzing}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5개</SelectItem>
                          <SelectItem value="10">10개</SelectItem>
                          <SelectItem value="20">20개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleRangeAnalysis}
                    className="btn-orange"
                    size="sm"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? '분석 중...' : '범위 분석 실행'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 지역별 탭 콘텐츠 */}
          {activeAnalysis === 'area' && (
            <div className="space-y-4 mt-4">
              {/* Seoul Wide Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    서울 전체 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="seoul-business-type" className="text-xs">
                      업종
                    </Label>
                    <Select
                      value={businessType}
                      onValueChange={setBusinessType}
                      disabled={isAnalyzing}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="업종 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSeoulAnalysis}
                    className="btn-orange"
                    size="sm"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? '분석 중...' : '서울 전체 분석'}
                  </Button>
                </CardContent>
              </Card>

              {/* District Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    구별 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="district" className="text-xs">
                      구 선택
                    </Label>
                    <Select
                      value={selectedDistrict}
                      onValueChange={setSelectedDistrict}
                      disabled={isAnalyzing}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="구 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map(district => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleDistrictAnalysis}
                    className="btn-orange"
                    size="sm"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? '분석 중...' : '구별 분석 실행'}
                  </Button>
                </CardContent>
              </Card>

              {/* Neighborhood Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    동별 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="neighborhood" className="text-xs">
                      동 선택
                    </Label>
                    <Select
                      value={selectedNeighborhood}
                      onValueChange={setSelectedNeighborhood}
                      disabled={isAnalyzing}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="동 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {neighborhoods.map(neighborhood => (
                          <SelectItem key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleNeighborhoodAnalysis}
                    className="btn-orange"
                    size="sm"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? '분석 중...' : '동별 분석 실행'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 분석 실행 후 안내 메시지 */}
      <Card className="border-orange-200">
        <CardContent className="p-4 bg-orange-50">
          <p className="text-sm text-orange-700 text-center">
            분석 결과는 <strong>결과 탭</strong>에서 확인하세요
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
