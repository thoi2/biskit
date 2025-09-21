// components/FavoritesSection.tsx

import { useState, useEffect } from 'react';
import { Heart, ChevronDown, ChevronUp, MapPin, Trash2 } from 'lucide-react';
import { Badge } from '@/lib/components/ui/badge';
import { Button } from '@/lib/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';

// 찜한 추천 결과 인터페이스
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

interface FavoritesSectionProps {
    user: Record<string, any> | null;
}

export function FavoritesSection({ user }: FavoritesSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [favorites, setFavorites] = useState<FavoriteRecommendation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            // TODO: 실제 API 호출로 교체
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
            setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    const getClosureProbabilityColor = (probability: number) => {
        if (probability >= 80) return 'bg-red-500';
        if (probability >= 60) return 'bg-orange-500';
        if (probability >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (!user) return null;

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-sm">내 찜 목록</span>
                    <Badge variant="outline" className="text-xs h-5">{favorites.length}개</Badge>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </div>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                {isExpanded && (
                    <div className="px-3 pb-3 border-t">
                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mr-2"></div>
                                <span className="text-sm text-gray-600">로딩 중...</span>
                            </div>
                        ) : favorites.length === 0 ? (
                            <div className="text-center py-4">
                                <Heart className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                <p className="text-gray-500 text-sm">찜한 추천이 없습니다</p>
                                <p className="text-xs text-gray-400">
                                    AI 추천 결과에 하트를 눌러 저장해보세요
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 mt-3 max-h-[300px] overflow-y-auto">
                                {favorites.map(favorite => (
                                    <div
                                        key={favorite.id}
                                        className="p-2 border border-red-200 rounded bg-red-50 hover:bg-red-100 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-red-500 text-white text-xs h-5">찜</Badge>
                                                <span className="font-medium text-sm">{favorite.businessName}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {favorite.businessType}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFavorite(favorite.id)}
                                                    className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                                    title="찜 해제"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{favorite.address}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs">1년차 폐업률:</span>
                                            <Badge className={`${getClosureProbabilityColor(favorite.closureProbability.year1)} text-white text-xs`}>
                                                {favorite.closureProbability.year1}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
