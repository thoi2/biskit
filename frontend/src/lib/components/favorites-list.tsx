'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Heart, MapPin, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { RecommendationResult } from '@/lib/types/recommendation';

// 찜한 추천 결과를 위한 인터페이스
interface FavoriteRecommendation {
  id: string;
  recommendationId: string;
  businessName: string;
  businessType: string;
  address: string;
  coordinates: { lat: number; lng: number };
  closureProbability: {
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface FavoritesListProps {
  onNavigateToLocation?: (lat: number, lng: number) => void;
}

export function FavoritesList({ onNavigateToLocation }: FavoritesListProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      // TODO: 실제 API 호출로 교체
      // const response = await fetch('/api/favorites/recommendations', {
      //   headers: { 'Authorization': `Bearer ${user.token}` }
      // });
      // const data = await response.json();

      // 현재는 Mock 데이터 (빈 배열)
      const data: FavoriteRecommendation[] = [];

      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      // TODO: 실제 API 호출로 교체
      // await fetch(`/api/favorites/${favoriteId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${user.token}` }
      // });

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const getRiskLevel = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high':
        return { level: 'high', color: 'bg-red-500', text: '고위험' };
      case 'medium':
        return { level: 'medium', color: 'bg-yellow-500', text: '중위험' };
      case 'low':
        return { level: 'low', color: 'bg-green-500', text: '저위험' };
      default:
        return { level: 'medium', color: 'bg-gray-500', text: '미분류' };
    }
  };

  const getClosureProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'bg-red-500';
    if (probability >= 60) return 'bg-orange-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!user) {
    return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              찜 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">로그인 후 이용해주세요</p>
              <p className="text-sm text-muted-foreground mt-2">
                추천 결과에 하트를 눌러 저장할 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
    );
  }

  if (loading) {
    return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              찜 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="text-muted-foreground ml-2">로딩 중...</p>
            </div>
          </CardContent>
        </Card>
    );
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            찜한 추천 ({favorites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">찜한 추천이 없습니다</p>
                <p className="text-sm text-muted-foreground mt-2">
                  AI 추천 결과에 하트를 눌러 저장해보세요
                </p>
              </div>
          ) : (
              <div className="space-y-3">
                {favorites.map(favorite => {
                  const risk = getRiskLevel(favorite.riskLevel);
                  return (
                      <div
                          key={favorite.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* 비즈니스 이름과 타입 */}
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {favorite.businessName}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {favorite.businessType}
                              </Badge>
                              <Badge className={`${risk.color} text-white text-xs`}>
                                {risk.text}
                              </Badge>
                            </div>

                            {/* 주소 */}
                            <p className="text-sm text-gray-600 mb-2">
                              {favorite.address}
                            </p>

                            {/* 폐업 확률 */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">1년차 폐업률:</span>
                                <Badge className={`${getClosureProbabilityColor(favorite.closureProbability.year1)} text-white text-xs`}>
                                  {favorite.closureProbability.year1}%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">5년차:</span>
                                <Badge className={`${getClosureProbabilityColor(favorite.closureProbability.year5)} text-white text-xs`}>
                                  {favorite.closureProbability.year5}%
                                </Badge>
                              </div>
                            </div>

                            {/* 좌표와 날짜 */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>
                            {favorite.coordinates.lat.toFixed(4)}, {favorite.coordinates.lng.toFixed(4)}
                          </span>
                              </div>
                              <span>
                          {new Date(favorite.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                            </div>
                          </div>

                          {/* 액션 버튼들 */}
                          <div className="flex gap-2">
                            {/* 지도에서 보기 버튼 */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (onNavigateToLocation) {
                                    onNavigateToLocation(
                                        favorite.coordinates.lat,
                                        favorite.coordinates.lng
                                    );
                                  } else {
                                    console.log(
                                        'Navigate to:',
                                        favorite.coordinates.lat,
                                        favorite.coordinates.lng
                                    );
                                  }
                                }}
                                title="지도에서 보기"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>

                            {/* 찜 제거 버튼 */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFavorite(favorite.id)}
                                className="text-red-500 hover:text-red-700"
                                title="찜 해제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                  );
                })}
              </div>
          )}
        </CardContent>
      </Card>
  );
}
